/**
 * Role definitions mirroring the Architecture Governance Document.
 * 8 defined roles — responsibility-driven, not power-driven.
 */

export enum Role {
  PlatformSuperAdmin = 'PlatformSuperAdmin',
  TenantOwner = 'TenantOwner',
  OperationsController = 'OperationsController',
  FinanceController = 'FinanceController',
  RiskController = 'RiskController',
  ComplianceOfficer = 'ComplianceOfficer',
  Partner = 'Partner',
  Auditor = 'Auditor',
}

/**
 * Permission constants for field-level and action-level access control.
 * Used with hasPermission() in components.
 */
export const Permission = {
  VIEW_SENSITIVE_FIELDS: 'view:sensitive-fields',
  APPROVE_SETTLEMENT: 'approve:settlement',
  APPROVE_LEDGER_REVERSAL: 'approve:ledger-reversal',
  MODIFY_CHARGES: 'modify:charges',
  INCREASE_EXPOSURE_LIMIT: 'increase:exposure-limit',
  VIEW_AUDIT_LOG: 'view:audit-log',
  MANAGE_TENANTS: 'manage:tenants',
  MANAGE_USERS: 'manage:users',
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

/**
 * Role-to-permission mapping for client-side render guards.
 * Backend enforces the authoritative check; this is UI-layer only.
 */
export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  [Role.PlatformSuperAdmin]: Object.values(Permission),
  [Role.TenantOwner]: [
    Permission.VIEW_SENSITIVE_FIELDS,
    Permission.APPROVE_SETTLEMENT,
    Permission.APPROVE_LEDGER_REVERSAL,
    Permission.MODIFY_CHARGES,
    Permission.INCREASE_EXPOSURE_LIMIT,
    Permission.MANAGE_TENANTS,
    Permission.MANAGE_USERS,
  ],
  [Role.OperationsController]: [Permission.APPROVE_SETTLEMENT],
  [Role.FinanceController]: [
    Permission.VIEW_SENSITIVE_FIELDS,
    Permission.APPROVE_SETTLEMENT,
    Permission.APPROVE_LEDGER_REVERSAL,
    Permission.MODIFY_CHARGES,
  ],
  [Role.RiskController]: [Permission.VIEW_SENSITIVE_FIELDS, Permission.INCREASE_EXPOSURE_LIMIT],
  [Role.ComplianceOfficer]: [Permission.VIEW_AUDIT_LOG],
  [Role.Partner]: [],
  [Role.Auditor]: [Permission.VIEW_AUDIT_LOG],
};

/**
 * Roles allowed to be Makers (create financial actions).
 */
export const MAKER_ROLES: Role[] = [Role.OperationsController, Role.TenantOwner];

/**
 * Roles allowed to be Checkers (approve financial actions).
 * A checker must never approve their own action.
 */
export const CHECKER_ROLES: Role[] = [
  Role.FinanceController,
  Role.RiskController,
  Role.TenantOwner,
];
