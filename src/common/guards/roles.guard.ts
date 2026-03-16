import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators';

/**
 * RolesGuard - Guard de control de acceso por roles (RBAC).
 *
 * Verifica que el usuario autenticado tenga al menos uno de los roles
 * declarados en el decorador @Roles() del endpoint.
 * Debe usarse siempre despues de JwtAuthGuard (que ya poblo request.user).
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Verifica si el rol del usuario coincide con los roles requeridos.
   *
   * @param context - Contexto de ejecucion
   * @returns true si el usuario tiene el rol requerido
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles declarados, permitir acceso a cualquier usuario autenticado
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Jerarquia de roles para comparacion
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.OWNER]: 5,
      [UserRole.ADMIN]: 4,
      [UserRole.STAFF]: 3,
      [UserRole.CLIENT]: 2,
      [UserRole.TEACHER]: 1,
      [UserRole.STUDENT]: 0,
    };

    const userLevel = roleHierarchy[user?.role as UserRole] ?? -1;
    const minRequired = Math.min(
      ...requiredRoles.map((r) => roleHierarchy[r] ?? 99),
    );

    return userLevel >= minRequired;
  }
}
