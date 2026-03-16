import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO de inicio de sesion.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export class LoginDto {
  @IsEmail({}, { message: 'El correo electronico no es valido.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contrasena es obligatoria.' })
  password: string;
}
