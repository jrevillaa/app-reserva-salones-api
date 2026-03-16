import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { EMAIL_JOB_NAMES, EMAIL_QUEUE } from '../../queue';
import {
  SendPasswordResetEmailJobData,
  SendVerificationEmailJobData,
  SendWelcomeEmailJobData,
} from './email-job.types';

/**
 * EmailQueueService
 *
 * Encola el envio de emails para que el request HTTP no quede
 * bloqueado por Nodemailer ni por la disponibilidad del proveedor.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue,
  ) {}

  /**
   * Encola un email de verificacion de cuenta.
   *
   * @param payload - Datos necesarios para renderizar el email
   */
  async enqueueVerificationEmail(
    payload: SendVerificationEmailJobData,
  ): Promise<Job<SendVerificationEmailJobData>> {
    return this.addJob(EMAIL_JOB_NAMES.SEND_VERIFICATION, payload, payload.to);
  }

  /**
   * Encola un email de bienvenida.
   *
   * @param payload - Datos necesarios para renderizar el email
   */
  async enqueueWelcomeEmail(
    payload: SendWelcomeEmailJobData,
  ): Promise<Job<SendWelcomeEmailJobData>> {
    return this.addJob(EMAIL_JOB_NAMES.SEND_WELCOME, payload, payload.to);
  }

  /**
   * Encola un email de restablecimiento de contrasena.
   *
   * @param payload - Datos necesarios para renderizar el email
   */
  async enqueuePasswordResetEmail(
    payload: SendPasswordResetEmailJobData,
  ): Promise<Job<SendPasswordResetEmailJobData>> {
    return this.addJob(EMAIL_JOB_NAMES.SEND_PASSWORD_RESET, payload, payload.to);
  }

  /**
   * Agrega un job a la cola de emails con metadata consistente.
   *
   * @param name - Nombre del job dentro de la cola
   * @param payload - Carga util serializable del job
   * @param recipient - Email del destinatario para trazabilidad
   * @returns Job encolado con su id generado
   */
  private async addJob<T extends object>(
    name: string,
    payload: T,
    recipient: string,
  ): Promise<Job<T>> {
    const job = await this.emailQueue.add(name, payload, {
      jobId: `${name}:${recipient}:${Date.now()}`,
    });

    this.logger.log(`Job ${name} encolado para ${recipient} (${job.id})`);

    return job;
  }
}

