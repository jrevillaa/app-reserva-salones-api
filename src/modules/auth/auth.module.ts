import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationsModule } from '../notifications';

/**
 * AuthModule
 *
 * Agrupa todos los componentes de autenticacion:
 * controlador, servicio, estrategia JWT y configuracion de tokens.
 *
 * Importa NotificationsModule para envio de emails transaccionales.
 * AuditModule y DatabaseModule son globales, no es necesario importarlos.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configuracion asincrona del modulo JWT para acceder a ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret')!,
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') as any,
        },
      }),
    }),

    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
  ],
  exports: [
    JwtStrategy,
    AuthService,
    JwtModule,
  ],
})
export class AuthModule {}
