import { SetMetadata } from '@nestjs/common';

/**
 * Clave de metadato para marcar endpoints publicos.
 * Usada por JwtAuthGuard para saltarse la validacion de JWT.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador @Public()
 *
 * Marca un endpoint como publico (no requiere autenticacion).
 * El JwtAuthGuard verifica este metadato antes de validar el token.
 *
 * Uso:
 * @Public()
 * @Post('login')
 * async login(...) { ... }
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
