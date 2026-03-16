import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { NotificationsModule } from './modules/notifications';
import { AuditModule } from './modules/audit';
import { DashboardModule } from './modules/dashboard';
import { configuration, validateEnv } from './config';
import { QueueModule } from './queue';

/**
 * AppModule - Modulo raiz de la aplicacion.
 *
 * Importa todos los modulos principales:
 * - ConfigModule: Configuracion global con validacion Zod (fail fast)
 * - DatabaseModule: PrismaService global
 * - ThrottlerModule: Rate limiting global
 * - AuditModule: Auditoria global
 * - AuthModule: Autenticacion y sesiones
 * - UsersModule: Gestion de perfil de usuario
 * - NotificationsModule: Envio de emails
 * - DashboardModule: Panel principal
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Module({
  imports: [
    // Configuracion global con validacion de env vars al inicio
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),

    // Rate limiting global (proteccion contra fuerza bruta y DDoS)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60000),
          limit: configService.get<number>('throttle.limit', 10),
        },
      ],
    }),

    // Base de datos Prisma (global)
    DatabaseModule,

    // Colas BullMQ (productores y conexion compartida a Redis)
    QueueModule,

    // Auditoria (global - disponible en todos los modulos)
    AuditModule,

    // Autenticacion y autorizacion
    AuthModule,

    // Gestion de usuarios
    UsersModule,

    // Notificaciones por email
    NotificationsModule,

    // Panel de control
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
