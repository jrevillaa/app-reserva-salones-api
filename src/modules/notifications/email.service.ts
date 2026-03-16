import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Color primario del proyecto para los templates de email.
 */
const COLOR_PRIMARY = '#0E7C86';

/**
 * Color secundario (amber) del proyecto para los templates de email.
 */
const COLOR_AMBER = '#F2A900';

/**
 * EmailService
 *
 * Servicio para envio de emails transaccionales con Nodemailer.
 * Los templates son HTML inline (no dependen de archivos externos).
 * Cuando el envio se ejecuta desde BullMQ, propaga el error para
 * habilitar reintentos automaticos del job.
 *
 * Templates disponibles:
 * - Verificacion de email (con boton CTA verde)
 * - Bienvenida (despues de verificar)
 * - Restablecimiento de contrasena
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Crear transporte de nodemailer desde configuracion
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
    });
  }

  /**
   * Construye el layout HTML base para todos los emails.
   * Usa CSS inline para maxima compatibilidad con clientes de email.
   *
   * @param content - HTML del cuerpo del email
   * @param previewText - Texto visible en la vista previa del cliente de email
   */
  private buildEmailLayout(content: string, previewText: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SalonPay</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${COLOR_PRIMARY};padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">SalonPay</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Reservas y pagos para salones</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                &copy; 2026 NEXUM BUSINESS SAC. Todos los derechos reservados.<br>
                Este email fue enviado automaticamente. Por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Envia un email de verificacion de cuenta al usuario recien registrado.
   * Incluye un boton CTA que enlaza a la URL de verificacion.
   *
   * @param to - Email del destinatario
   * @param name - Nombre del usuario para personalizar el saludo
   * @param verificationUrl - URL completa con el token de verificacion
   */
  async sendVerificationEmail(
    to: string,
    name: string,
    verificationUrl: string,
  ): Promise<void> {
    const content = `
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;font-weight:700;">Verifica tu cuenta</h2>
      <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6;">
        Hola <strong>${name}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Gracias por registrarte en SalonPay. Para activar tu cuenta, haz clic en el siguiente boton:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verificationUrl}"
           style="display:inline-block;background:${COLOR_PRIMARY};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:16px;letter-spacing:0.3px;">
          Verificar mi cuenta
        </a>
      </div>
      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-align:center;">
        Si el boton no funciona, copia y pega este enlace en tu navegador:
      </p>
      <p style="margin:0;color:${COLOR_PRIMARY};font-size:12px;word-break:break-all;text-align:center;">
        ${verificationUrl}
      </p>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;">
        Este enlace expira en 24 horas. Si no creaste una cuenta en SalonPay, ignora este email.
      </p>
    `;

    await this.send(
      to,
      'Verifica tu cuenta en SalonPay',
      this.buildEmailLayout(content, 'Verifica tu cuenta para empezar a usar SalonPay'),
    );
  }

  /**
   * Envia un email de bienvenida despues de que el usuario verifica su cuenta.
   *
   * @param to - Email del destinatario
   * @param name - Nombre del usuario
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const content = `
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;font-weight:700;">Bienvenido a SalonPay</h2>
      <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6;">
        Hola <strong>${name}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funcionalidades de SalonPay.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="margin:0;color:#16a34a;font-weight:600;font-size:15px;">Tu cuenta esta lista</p>
        <p style="margin:8px 0 0;color:#475569;font-size:14px;">Gestiona tus reservas, pagos y clientes desde tu panel de control.</p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${this.configService.get('server.frontendUrl')}/dashboard"
           style="display:inline-block;background:${COLOR_PRIMARY};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:16px;">
          Ir a mi panel
        </a>
      </div>
    `;

    await this.send(
      to,
      'Bienvenido a SalonPay - Tu cuenta esta activa',
      this.buildEmailLayout(content, 'Tu cuenta en SalonPay esta lista. Comienza a gestionar tu negocio.'),
    );
  }

  /**
   * Envia un email para restablecer la contrasena del usuario.
   *
   * @param to - Email del destinatario
   * @param name - Nombre del usuario
   * @param resetUrl - URL completa con el token de restablecimiento
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const content = `
      <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;font-weight:700;">Restablece tu contrasena</h2>
      <p style="margin:0 0 12px;color:#475569;font-size:15px;line-height:1.6;">
        Hola <strong>${name}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Recibimos una solicitud para restablecer la contrasena de tu cuenta. Haz clic en el siguiente boton:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}"
           style="display:inline-block;background:${COLOR_AMBER};color:#1C1F24;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:16px;">
          Restablecer contrasena
        </a>
      </div>
      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;text-align:center;">
        Si el boton no funciona, copia y pega este enlace:
      </p>
      <p style="margin:0;color:${COLOR_PRIMARY};font-size:12px;word-break:break-all;text-align:center;">
        ${resetUrl}
      </p>
      <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;">
        Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email y tu contrasena permanecera igual.
      </p>
    `;

    await this.send(
      to,
      'Restablece tu contrasena de SalonPay',
      this.buildEmailLayout(content, 'Solicitud de restablecimiento de contrasena recibida'),
    );
  }

  /**
   * Envia un email a la direccion indicada.
   * Si el transporte no esta configurado, solo registra el intento en el log.
   * Si el proveedor falla, relanza el error para que BullMQ pueda reintentar.
   *
   * @param to - Direccion de destino
   * @param subject - Asunto del email
   * @param html - Contenido HTML del email
   */
  private async send(to: string, subject: string, html: string): Promise<void> {
    const from = this.configService.get<string>('email.from');
    const host = this.configService.get<string>('email.host');

    // En desarrollo sin configuracion de email, solo loguear
    if (!host) {
      this.logger.debug(`[EMAIL-MOCK] Para: ${to} | Asunto: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email enviado a: ${to} | Asunto: ${subject}`);
    } catch (error) {
      const message = `Error al enviar email a ${to}: ${(error as Error).message}`;
      this.logger.error(message);
      throw error;
    }
  }
}
