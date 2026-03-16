/**
 * Nombre canonico de la cola de emails.
 * Se reutiliza en productores y processors para evitar strings magicos.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export const EMAIL_QUEUE = 'emails';

/**
 * Tipos de jobs soportados por la cola de emails.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export const EMAIL_JOB_NAMES = {
  SEND_VERIFICATION: 'send-verification',
  SEND_WELCOME: 'send-welcome',
  SEND_PASSWORD_RESET: 'send-password-reset',
} as const;

