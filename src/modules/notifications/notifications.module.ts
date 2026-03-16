import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { QueueModule } from '../../queue';
import { EmailQueueService } from './email-queue.service';

/**
 * NotificationsModule
 *
 * Agrupa los servicios de notificacion de la aplicacion.
 * Exporta EmailService para uso en otros modulos (auth, reservations, etc.).
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Module({
  imports: [QueueModule],
  providers: [EmailService, EmailQueueService],
  exports: [EmailService, EmailQueueService],
})
export class NotificationsModule {}
