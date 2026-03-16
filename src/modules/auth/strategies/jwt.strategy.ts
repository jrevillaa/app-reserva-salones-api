import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database';

/**
 * Payload decodificado del token JWT de acceso.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  workspaceId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * JwtStrategy - Estrategia de autenticacion Passport con JWT.
 *
 * Extrae el token del header Authorization (Bearer ...).
 * Valida la firma con el secreto configurado.
 * El payload validado se agrega a request.user para uso posterior.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extrae el token del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rechaza tokens expirados automaticamente
      ignoreExpiration: false,
      // Secreto para verificar la firma del token
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  /**
   * Valida el payload del JWT ya verificado por Passport.
   * Verifica que el usuario aun exista en la base de datos.
   * El valor retornado se asigna a request.user.
   *
   * @param payload - Payload decodificado del JWT
   * @returns Datos del usuario para request.user
   * @throws UnauthorizedException si el usuario no existe
   */
  async validate(payload: JwtPayload) {
    // Verificar que el usuario aun exista (podria haber sido eliminado)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, workspaceId: true, role: true, emailVerified: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o desactivado.');
    }

    // Retornar datos para request.user
    return {
      id: user.id,
      email: user.email,
      workspaceId: user.workspaceId,
      role: user.role,
    };
  }
}
