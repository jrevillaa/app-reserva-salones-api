import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * JwtAuthGuard - Guard global de autenticacion JWT.
 *
 * Valida el token JWT en cada peticion entrante.
 * Los endpoints marcados con @Public() quedan exentos.
 * Si el token es valido, agrega el payload a request.user.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Verifica si el endpoint requiere autenticacion.
   * Si es publico, permite el acceso sin token.
   * Si no es publico, delega a la estrategia JWT de Passport.
   *
   * @param context - Contexto de ejecucion de NestJS
   */
  canActivate(context: ExecutionContext) {
    // Verificar si el endpoint esta marcado como publico
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Maneja el resultado de la validacion JWT.
   * Lanza excepcion si el token es invalido o no existe.
   *
   * @param err - Error de Passport
   * @param user - Usuario extraido del JWT
   */
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Token invalido o expirado. Por favor inicia sesion nuevamente.',
        )
      );
    }
    return user;
  }
}
