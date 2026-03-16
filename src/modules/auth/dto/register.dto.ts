import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

/**
 * DTO de registro de nuevo usuario y workspace.
 * Validado con class-validator para pipes de NestJS.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export class RegisterDto {
  @IsEmail({}, { message: 'El correo electronico no es valido.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres.' })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contrasena debe tener al menos una mayuscula, una minuscula y un numero.',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres.' })
  @MaxLength(50)
  lastName: string;

  @IsString()
  @MinLength(3, { message: 'El nombre del workspace debe tener al menos 3 caracteres.' })
  @MaxLength(100)
  workspaceName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
