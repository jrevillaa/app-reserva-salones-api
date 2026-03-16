import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database';
import { AuditService } from '../audit/audit.service';
import { EmailQueueService } from '../notifications/email-queue.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Estructura del par de tokens JWT generado tras autenticacion.
 */
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Payload del token JWT de acceso.
 */
interface AccessTokenPayload {
  sub: string;
  email: string;
  workspaceId: string;
  role: string;
}

/**
 * Respuesta de autenticacion exitosa (login o verificacion de email).
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    workspace: {
      id: string;
      name: string;
      slug: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * AuthService
 *
 * Servicio principal de autenticacion. Implementa los flujos de:
 * - Registro con verificacion de email obligatoria
 * - Verificacion de email con generacion de JWT
 * - Login con validacion de email verificado
 * - Reenvio de email de verificacion
 * - Refresh de tokens con rotacion y deteccion de robo
 * - Logout con revocacion de refresh token
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  /**
   * Registra un nuevo usuario y crea su workspace.
   * No genera tokens aun: el usuario debe verificar su email primero.
   *
   * Flujo:
   * 1. Verificar que el email no este registrado globalmente
   * 2. Crear workspace + usuario en transaccion atomica
   * 3. Generar token de verificacion (expira en 24h)
   * 4. Enviar email de verificacion
   * 5. Registrar en audit log
   *
   * @param dto - Datos del nuevo usuario y workspace
   * @returns Mensaje informativo (sin tokens)
   * @throws ConflictException si el email ya existe
   */
  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    // Verificar unicidad de email globalmente
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Este email ya esta registrado. Verifica tu bandeja de entrada o usa otro correo.',
      );
    }

    // Generar slug unico para el workspace
    const baseSlug = dto.workspaceName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Hashear contrasena con Argon2
    const passwordHash = await argon2.hash(dto.password);

    // Generar token de verificacion de email
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Crear workspace y usuario en transaccion atomica
    const { user, workspace } = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: dto.workspaceName,
          slug,
          currency: 'PEN',
          timezone: 'America/Lima',
          plan: 'FREE',
        },
      });

      const u = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: UserRole.OWNER,
          workspaceId: ws.id,
          emailNotifications: true,
          emailVerified: false,
          emailVerificationToken,
          emailVerificationExpires,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          workspaceId: true,
        },
      });

      return { user: u, workspace: ws };
    });

    // Registrar en audit log
    await this.auditService.log({
      workspaceId: workspace.id,
      userId: user.id,
      action: 'USER_REGISTER',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    // Enviar email de verificacion
    const frontendUrl = this.configService.get<string>('server.frontendUrl');
    const verificationUrl = `${frontendUrl}/verificar-email?token=${emailVerificationToken}`;

    await this.emailQueueService.enqueueVerificationEmail({
      to: user.email,
      name: user.firstName,
      verificationUrl,
    });

    this.logger.log(`Nuevo registro: ${user.email} (workspace: ${workspace.name})`);

    // No generar tokens aun: el usuario debe verificar su email
    return {
      message: 'Registro exitoso. Por favor revisa tu correo y verifica tu cuenta antes de iniciar sesion.',
      email: user.email,
    };
  }

  /**
   * Verifica el email del usuario usando el token enviado por correo.
   * Una vez verificado, genera y retorna los tokens JWT.
   *
   * @param token - Token de verificacion del email
   * @returns Tokens JWT + datos del usuario
   * @throws BadRequestException si el token es invalido o expiro
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    // Buscar usuario por token de verificacion
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Token de verificacion invalido o ya utilizado.',
      );
    }

    // Verificar que el token no haya expirado
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestException(
        'El enlace de verificacion ha expirado. Solicita uno nuevo.',
      );
    }

    // Marcar email como verificado y limpiar tokens
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Registrar verificacion en audit log
    await this.auditService.log({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: 'USER_EMAIL_VERIFIED',
      entityType: 'User',
      entityId: user.id,
    });

    // Enviar email de bienvenida
    await this.emailQueueService.enqueueWelcomeEmail({
      to: user.email,
      name: user.firstName,
    });

    // Generar par de tokens JWT
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.workspaceId,
      user.role,
    );

    this.logger.log(`Email verificado: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        workspace: user.workspace,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Autentica un usuario existente con email y contrasena.
   * Verifica que el email este verificado antes de permitir el login.
   *
   * @param dto - Credenciales de acceso
   * @returns Tokens JWT + datos del usuario
   * @throws UnauthorizedException si las credenciales son incorrectas
   * @throws ForbiddenException si el email no esta verificado
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    // Buscar usuario por email incluyendo workspace
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
      },
    });

    // Mensaje generico para no revelar si el email existe (previene user enumeration)
    if (!user) {
      this.logger.warn(`Intento de login con email inexistente: ${dto.email}`);
      throw new UnauthorizedException(
        'Email o contrasena incorrectos.',
      );
    }

    // Verificar contrasena con Argon2
    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!isPasswordValid) {
      this.logger.warn(`Contrasena incorrecta para: ${user.email}`);
      await this.auditService.log({
        workspaceId: user.workspaceId,
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        metadata: { success: false, reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Email o contrasena incorrectos.');
    }

    // Verificar que el email este confirmado
    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Debes verificar tu correo electronico antes de iniciar sesion. Revisa tu bandeja de entrada.',
      );
    }

    // Generar par de tokens JWT
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.workspaceId,
      user.role,
    );

    // Actualizar fecha de ultimo login de forma asincrona (no bloquea la respuesta)
    this.prisma.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch((err) =>
        this.logger.error(`Error actualizando lastLoginAt: ${err.message}`),
      );

    // Registrar login exitoso en audit log
    await this.auditService.log({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { success: true },
    });

    this.logger.log(`Login exitoso: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        workspace: user.workspace,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Reenvía el email de verificacion a un usuario que aun no lo ha verificado.
   *
   * @param email - Email del usuario
   * @returns Mensaje de confirmacion
   * @throws BadRequestException si el email ya esta verificado
   * @throws NotFoundException si el email no existe
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Mensaje neutro para no revelar si el email existe
      return { message: 'Si ese correo esta registrado, recibiras un nuevo email de verificacion.' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Este correo ya ha sido verificado. Puedes iniciar sesion normalmente.');
    }

    // Generar nuevo token de verificacion
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken, emailVerificationExpires },
    });

    const frontendUrl = this.configService.get<string>('server.frontendUrl');
    const verificationUrl = `${frontendUrl}/verificar-email?token=${emailVerificationToken}`;

    await this.emailQueueService.enqueueVerificationEmail({
      to: user.email,
      name: user.firstName,
      verificationUrl,
    });

    return { message: 'Email de verificacion reenviado. Revisa tu bandeja de entrada.' };
  }

  /**
   * Renueva el access token usando un refresh token valido.
   * Implementa rotacion de tokens y deteccion de reuso sospechoso.
   *
   * @param refreshToken - Refresh token a validar
   * @returns Nuevo par de tokens + datos del usuario
   * @throws UnauthorizedException si el token es invalido o fue revocado
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            workspace: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalido o expirado.');
    }

    // Token revocado: posible reuso, revocar toda la familia por seguridad
    if (storedToken.revokedAt) {
      await this.revokeTokenFamily(storedToken.familyId);
      throw new UnauthorizedException(
        'Sesion comprometida detectada. Por favor inicia sesion nuevamente.',
      );
    }

    // Token expirado
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('La sesion ha expirado. Por favor inicia sesion nuevamente.');
    }

    // Revocar token actual y generar nuevo par
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const { user } = storedToken;
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      user.workspaceId,
      user.role,
      storedToken.familyId,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        workspace: user.workspace,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Cierra la sesion del usuario revocando su refresh token.
   *
   * @param refreshToken - Token a revocar
   * @returns Mensaje de confirmacion
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });

    if (token?.user) {
      await this.auditService.log({
        workspaceId: token.user.workspaceId,
        userId: token.user.id,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: token.user.id,
      });
      this.logger.log(`Logout: ${token.user.email}`);
    }

    return { message: 'Sesion cerrada exitosamente.' };
  }

  /**
   * Retorna los datos del usuario autenticado actual.
   *
   * @param userId - ID del usuario extraido del JWT
   * @returns Datos del usuario y su workspace
   * @throws UnauthorizedException si el usuario no existe
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        emailNotifications: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            timezone: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return user;
  }

  /**
   * Genera un par de tokens JWT (access + refresh) para un usuario.
   *
   * @param userId - ID del usuario
   * @param email - Email del usuario
   * @param workspaceId - ID del workspace
   * @param role - Rol del usuario
   * @param existingFamilyId - familyId para rotacion de refresh tokens
   */
  private async generateTokenPair(
    userId: string,
    email: string,
    workspaceId: string,
    role: string,
    existingFamilyId?: string,
  ): Promise<TokenPair> {
    const payload: AccessTokenPayload = { sub: userId, email, workspaceId, role };

    // Access token de vida corta (15m por defecto)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret')!,
      expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
    });

    // Refresh token aleatorio almacenado en DB
    const refreshTokenValue = randomBytes(32).toString('hex');
    const familyId = existingFamilyId || randomBytes(16).toString('hex');

    const expiresAt = new Date();
    const daysStr = this.configService.get<string>('jwt.refreshExpiresIn') || '30d';
    const days = parseInt(daysStr.replace('d', ''), 10);
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        familyId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  /**
   * Revoca todos los tokens activos de una familia.
   * Se usa ante deteccion de reuso de token revocado (posible robo).
   *
   * @param familyId - ID de la familia de tokens a revocar
   */
  private async revokeTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
