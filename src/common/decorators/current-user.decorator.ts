import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador @CurrentUser()
 *
 * Extrae el usuario actual del request (agregado por el JwtAuthGuard).
 * El guard de JWT coloca el payload del token en request.user.
 *
 * Uso:
 * @Get('me')
 * getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
