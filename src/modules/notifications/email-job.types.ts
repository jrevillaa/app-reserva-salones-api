import { EMAIL_JOB_NAMES } from '../../queue';

/**
 * Payload del job de verificacion de email.
 */
export interface SendVerificationEmailJobData {
  to: string;
  name: string;
  verificationUrl: string;
}

/**
 * Payload del job de bienvenida.
 */
export interface SendWelcomeEmailJobData {
  to: string;
  name: string;
}

/**
 * Payload del job de recuperacion de contrasena.
 */
export interface SendPasswordResetEmailJobData {
  to: string;
  name: string;
  resetUrl: string;
}

/**
 * Mapa tipado entre nombre de job y su payload.
 */
export interface EmailJobDataMap {
  [EMAIL_JOB_NAMES.SEND_VERIFICATION]: SendVerificationEmailJobData;
  [EMAIL_JOB_NAMES.SEND_WELCOME]: SendWelcomeEmailJobData;
  [EMAIL_JOB_NAMES.SEND_PASSWORD_RESET]: SendPasswordResetEmailJobData;
}

