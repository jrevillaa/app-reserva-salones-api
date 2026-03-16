import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

/**
 * AuthController
 *
 * Endpoints de autenticacion y gestion de sesion.
 * Los endpoints publicos estan marcados con @Public().
 * Los endpoints protegidos requieren JWT valido en el header Authorization.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Registra un nuevo usuario y crea su workspace.
   * Envia email de verificacion. No genera tokens aun.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registro de nuevo usuario y workspace' })
  async register(
    @Body(new ValidationPipe({ whitelist: true })) dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Autentica un usuario. Requiere email verificado.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicio de sesion' })
  async login(
    @Body(new ValidationPipe({ whitelist: true })) dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/verify-email
   * Verifica el email del usuario con el token recibido por correo.
   * Genera y retorna los tokens JWT tras la verificacion exitosa.
   */
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificacion de email' })
  async verifyEmail(
    @Body(new ValidationPipe({ whitelist: true })) dto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(dto.token);
  }

  /**
   * POST /auth/resend-verification
   * Reenvía el email de verificacion al usuario.
   */
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenvio de email de verificacion' })
  async resendVerification(
    @Body(new ValidationPipe({ whitelist: true })) dto: ResendVerificationDto,
  ) {
    return this.authService.resendVerification(dto.email);
  }

  /**
   * POST /auth/refresh
   * Renueva el access token usando un refresh token valido.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovacion de tokens' })
  async refresh(
    @Body(new ValidationPipe({ whitelist: true })) dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * POST /auth/logout
   * Revoca el refresh token y cierra la sesion.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cierre de sesion' })
  async logout(
    @Body(new ValidationPipe({ whitelist: true })) dto: RefreshTokenDto,
  ) {
    return this.authService.logout(dto.refreshToken);
  }

  /**
   * GET /auth/me
   * Retorna los datos del usuario autenticado actual.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener usuario actual' })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }
}
