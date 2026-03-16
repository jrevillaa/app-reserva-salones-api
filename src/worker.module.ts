import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validateEnv } from './config';
import { QueueModule } from './queue';
import { NotificationsModule } from './modules/notifications';
import { EmailProcessor } from './modules/notifications/processors/email.processor';

/**
 * WorkerModule
 *
 * Modulo raiz del proceso worker. No expone HTTP; solo consume
 * jobs en segundo plano desde Redis/BullMQ.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    QueueModule,
    NotificationsModule,
  ],
  providers: [EmailProcessor],
})
export class WorkerModule {}

