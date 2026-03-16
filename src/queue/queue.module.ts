import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_QUEUE } from './queue.constants';

/**
 * QueueModule
 *
 * Centraliza la configuracion global de BullMQ y el registro
 * de las colas usadas por la aplicacion. Debe importarse tanto
 * en la API HTTP como en el proceso worker para compartir Redis.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      /**
       * Construye la configuracion global de BullMQ desde variables de entorno.
       * Aplica politicas de reintento y limpieza por defecto para todas las colas.
       *
       * @param configService - Servicio de configuracion global
       * @returns Configuracion BullMQ lista para Redis
       */
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password') || undefined,
          db: configService.get<number>('redis.db', 0),
        },
        prefix: configService.get<string>('redis.queuePrefix', 'salonpay'),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 500,
        },
      }),
    }),
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

