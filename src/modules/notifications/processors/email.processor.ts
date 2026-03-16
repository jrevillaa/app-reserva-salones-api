import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EMAIL_JOB_NAMES, EMAIL_QUEUE } from '../../../queue';
import { EmailService } from '../email.service';
import {
  EmailJobDataMap,
  SendPasswordResetEmailJobData,
  SendVerificationEmailJobData,
  SendWelcomeEmailJobData,
} from '../email-job.types';

/**
 * EmailProcessor
 *
 * Consumer de BullMQ encargado de ejecutar el envio real de emails.
 * Corre solo en el proceso worker para desacoplar la API HTTP.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  /**
   * Procesa un job de la cola de emails segun su nombre.
   *
   * @param job - Job entregado por BullMQ
   */
  async process(
    job: Job<EmailJobDataMap[keyof EmailJobDataMap]>,
  ): Promise<void> {
    switch (job.name) {
      case EMAIL_JOB_NAMES.SEND_VERIFICATION:
        await this.handleVerificationJob(job as Job<SendVerificationEmailJobData>);
        return;
      case EMAIL_JOB_NAMES.SEND_WELCOME:
        await this.handleWelcomeJob(job as Job<SendWelcomeEmailJobData>);
        return;
      case EMAIL_JOB_NAMES.SEND_PASSWORD_RESET:
        await this.handlePasswordResetJob(job as Job<SendPasswordResetEmailJobData>);
        return;
      default:
        throw new Error(`Tipo de job no soportado: ${job.name}`);
    }
  }

  /**
   * Ejecuta el envio del email de verificacion.
   *
   * @param job - Job tipado de verificacion
   */
  private async handleVerificationJob(
    job: Job<SendVerificationEmailJobData>,
  ): Promise<void> {
    await this.emailService.sendVerificationEmail(
      job.data.to,
      job.data.name,
      job.data.verificationUrl,
    );
  }

  /**
   * Ejecuta el envio del email de bienvenida.
   *
   * @param job - Job tipado de bienvenida
   */
  private async handleWelcomeJob(job: Job<SendWelcomeEmailJobData>): Promise<void> {
    await this.emailService.sendWelcomeEmail(job.data.to, job.data.name);
  }

  /**
   * Ejecuta el envio del email de recuperacion de contrasena.
   *
   * @param job - Job tipado de recuperacion
   */
  private async handlePasswordResetJob(
    job: Job<SendPasswordResetEmailJobData>,
  ): Promise<void> {
    await this.emailService.sendPasswordResetEmail(
      job.data.to,
      job.data.name,
      job.data.resetUrl,
    );
  }

  /**
   * Registra el fin exitoso de un job para trazabilidad operativa.
   *
   * @param job - Job procesado
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job completado: ${job.name} (${job.id})`);
  }

  /**
   * Registra fallos del worker para facilitar debugging y reintentos.
   *
   * @param job - Job fallido
   * @param error - Error arrojado por el procesamiento
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job fallido: ${job?.name ?? 'unknown'} (${job?.id ?? 'sin-id'}) - ${error.message}`,
    );
  }
}

