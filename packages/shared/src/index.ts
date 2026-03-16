// Constants
export * from './constants';

// Validators
export * from './validators';

// Tipos compartidos de autenticacion
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  workspaceName: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Utility function to check if user has required role
import { UserRole } from './constants';

export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.OWNER]: 5,
    [UserRole.ADMIN]: 4,
    [UserRole.STAFF]: 3,
    [UserRole.CLIENT]: 2,
    [UserRole.TEACHER]: 1,
    [UserRole.STUDENT]: 0,
  };

  const userRoleLevel = roleHierarchy[userRole];
  const requiredRoleLevels = requiredRoles.map((role) => roleHierarchy[role]);
  const minRequiredLevel = Math.min(...requiredRoleLevels);

  return userRoleLevel >= minRequiredLevel;
}
