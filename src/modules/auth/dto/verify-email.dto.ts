import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO para verificacion de email.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'El token de verificacion es obligatorio.' })
  token: string;
}
