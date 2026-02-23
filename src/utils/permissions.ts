import { ROLE_PERMISSIONS } from '@types/roles.types';
import type { PermissionKey } from '@types/roles.types';
import { Role } from '@types/roles.types';

/**
 * Check if any of the user's roles includes the given permission.
 * Pure function — no side effects, no store access.
 */
export function hasPermission(userRoles: string[], permission: PermissionKey): boolean {
  return userRoles.some((roleName) => {
    const role = roleName as Role;
    const rolePermissions = ROLE_PERMISSIONS[role];
    return rolePermissions?.includes(permission) ?? false;
  });
}

/**
 * Check if the user has at least one of the specified roles.
 */
export function hasRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((r) => userRoles.includes(r));
}

/**
 * Check if the user has exactly this role (strict match).
 */
export function hasExactRole(userRoles: string[], role: Role): boolean {
  return userRoles.includes(role);
}

/**
 * Maker-Checker guard: returns true if the current user can approve this record.
 * A checker must not approve their own record.
 */
export function canApprove(
  userRoles: string[],
  currentUserId: string,
  recordCreatedBy: string,
): boolean {
  const isChecker = userRoles.some((r) =>
    [Role.FinanceController, Role.RiskController, Role.TenantOwner, Role.PlatformSuperAdmin].includes(r as Role),
  );
  const isNotOwnRecord = currentUserId !== recordCreatedBy;
  return isChecker && isNotOwnRecord;
}
