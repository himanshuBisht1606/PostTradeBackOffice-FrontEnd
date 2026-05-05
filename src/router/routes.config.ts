import { Role } from '@app-types/roles.types';

export interface RouteConfig {
  path: string;
  requiredRoles?: string[];
  label: string;
}

const ALL_ROLES = Object.values(Role);
const FINANCE_ROLES = [Role.FinanceController, Role.TenantOwner, Role.PlatformSuperAdmin];
const OPS_ROLES = [Role.OperationsController, Role.TenantOwner, Role.PlatformSuperAdmin];
const CHECKER_ROLES = [
  Role.FinanceController,
  Role.RiskController,
  Role.TenantOwner,
  Role.PlatformSuperAdmin,
];
const AUDIT_ROLES = [
  Role.Auditor,
  Role.ComplianceOfficer,
  Role.PlatformSuperAdmin,
  Role.TenantOwner,
];

export const ROUTE_CONFIG: RouteConfig[] = [
  { path: '/dashboard', requiredRoles: ALL_ROLES, label: 'Dashboard' },

  { path: '/account-management/clients', requiredRoles: ALL_ROLES, label: 'Clients' },
  {
    path: '/account-management/brokers',
    requiredRoles: [...OPS_ROLES, Role.TenantOwner],
    label: 'Brokers',
  },

  { path: '/clearing/trades', requiredRoles: ALL_ROLES, label: 'Trade Book' },
  {
    path: '/clearing/settlement/batches',
    requiredRoles: [...OPS_ROLES, ...FINANCE_ROLES],
    label: 'Settlement Batches',
  },
  {
    path: '/clearing/settlement/obligations',
    requiredRoles: [...OPS_ROLES, ...FINANCE_ROLES],
    label: 'Obligations',
  },

  {
    path: '/finance/ledger',
    requiredRoles: [...FINANCE_ROLES, Role.Auditor],
    label: 'Ledger',
  },
  { path: '/finance/fo-ledger', requiredRoles: [...FINANCE_ROLES, ...OPS_ROLES], label: 'FO Finance Ledger' },
  { path: '/finance/charges', requiredRoles: FINANCE_ROLES, label: 'Charges Config' },

  {
    path: '/reconciliation',
    requiredRoles: [...OPS_ROLES, Role.RiskController],
    label: 'Reconciliation',
  },

  { path: '/post-trade/cm/import', requiredRoles: OPS_ROLES, label: 'CM File Import' },
  { path: '/post-trade/fo/import', requiredRoles: OPS_ROLES, label: 'FO File Import' },

  { path: '/governance/approvals', requiredRoles: CHECKER_ROLES, label: 'Approvals' },
  { path: '/governance/audit', requiredRoles: AUDIT_ROLES, label: 'Audit Log' },
];
