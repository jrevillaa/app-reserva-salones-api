import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Clave de metadato para roles requeridos en un endpoint.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador @Roles(...roles)
 *
 * Declara los roles que tienen permiso de acceder a un endpoint.
 * El RolesGuard verifica este metadato contra el rol del usuario en JWT.
 *
 * Uso:
 * @Roles(UserRole.OWNER, UserRole.ADMIN)
 * @Delete(':id')
 * async deleteRoom(...) { ... }
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
