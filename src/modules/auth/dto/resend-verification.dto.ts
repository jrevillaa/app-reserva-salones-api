import { IsEmail } from 'class-validator';

/**
 * DTO para reenvio de email de verificacion.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export class ResendVerificationDto {
  @IsEmail({}, { message: 'El correo electronico no es valido.' })
  email: string;
}
