import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO para renovacion de tokens.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'El refresh token es obligatorio.' })
  refreshToken: string;
}
