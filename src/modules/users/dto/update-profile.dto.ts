import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * DTO para actualizacion de perfil del usuario.
 * Todos los campos son opcionales (PATCH semantics).
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
