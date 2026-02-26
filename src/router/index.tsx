import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '@shared/components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@modules/auth/components/LoginPage';
import { Role } from '@app-types/roles.types';
import { lazy, Suspense } from 'react';
import { PageLoader } from '@shared/components/feedback/PageLoader';

// Lazy-loaded feature pages for optimal bundle splitting
const DashboardPage = lazy(() =>
  import('@modules/dashboard/components/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ClientListPage = lazy(() =>
  import('@modules/account-management/components/clients/ClientListPage').then((m) => ({
    default: m.ClientListPage,
  })),
);
const BrokerListPage = lazy(() =>
  import('@modules/account-management/components/brokers/BrokerListPage').then((m) => ({
    default: m.BrokerListPage,
  })),
);
const TradeListPage = lazy(() =>
  import('@modules/clearing/components/trade-book/TradeListPage').then((m) => ({
    default: m.TradeListPage,
  })),
);
const BatchListPage = lazy(() =>
  import('@modules/clearing/components/settlement/BatchListPage').then((m) => ({
    default: m.BatchListPage,
  })),
);
const ObligationListPage = lazy(() =>
  import('@modules/clearing/components/settlement/ObligationListPage').then((m) => ({
    default: m.ObligationListPage,
  })),
);
const LedgerPage = lazy(() =>
  import('@modules/finance/components/ledger/LedgerPage').then((m) => ({
    default: m.LedgerPage,
  })),
);
const ChargesConfigPage = lazy(() =>
  import('@modules/finance/components/charges/ChargesConfigPage').then((m) => ({
    default: m.ChargesConfigPage,
  })),
);
const ReconDashboardPage = lazy(() =>
  import('@modules/reconciliation/components/ReconDashboardPage').then((m) => ({
    default: m.ReconDashboardPage,
  })),
);
const ApprovalQueuePage = lazy(() =>
  import('@modules/governance/components/approvals/ApprovalQueuePage').then((m) => ({
    default: m.ApprovalQueuePage,
  })),
);
const AuditLogPage = lazy(() =>
  import('@modules/governance/components/audit/AuditLogPage').then((m) => ({
    default: m.AuditLogPage,
  })),
);
const ExchangeListPage = lazy(() =>
  import('@modules/master-setup/components/exchanges/ExchangeListPage').then((m) => ({
    default: m.ExchangeListPage,
  })),
);
const InstrumentListPage = lazy(() =>
  import('@modules/master-setup/components/instruments/InstrumentListPage').then((m) => ({
    default: m.InstrumentListPage,
  })),
);
const CorporateActionsListPage = lazy(() =>
  import('@modules/corporate-actions/components/CorporateActionsListPage').then((m) => ({
    default: m.CorporateActionsListPage,
  })),
);
const EodPanel = lazy(() =>
  import('@modules/eod/components/EodPanel').then((m) => ({
    default: m.EodPanel,
  })),
);

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
const MASTER_SETUP_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner];
const CORP_ACTION_ROLES = [Role.FinanceController, Role.TenantOwner, Role.PlatformSuperAdmin];
const EOD_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner];

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        element: <AppShell />,
        children: [
          {
            path: 'dashboard',
            element: <ProtectedRoute requiredRoles={ALL_ROLES} />,
            children: [
              {
                index: true,
                element: (
                  <Lazy>
                    <DashboardPage />
                  </Lazy>
                ),
              },
            ],
          },
          {
            path: 'account-management',
            children: [
              {
                path: 'clients',
                element: <ProtectedRoute requiredRoles={ALL_ROLES} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <ClientListPage />
                      </Lazy>
                    ),
                  },
                ],
              },
              {
                path: 'brokers',
                element: <ProtectedRoute requiredRoles={[...OPS_ROLES, Role.TenantOwner]} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <BrokerListPage />
                      </Lazy>
                    ),
                  },
                ],
              },
            ],
          },
          {
            path: 'clearing',
            children: [
              {
                path: 'trades',
                element: <ProtectedRoute requiredRoles={ALL_ROLES} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <TradeListPage />
                      </Lazy>
                    ),
                  },
                ],
              },
              {
                path: 'settlement/batches',
                element: <ProtectedRoute requiredRoles={[...OPS_ROLES, ...FINANCE_ROLES]} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <BatchListPage />
                      </Lazy>
                    ),
                  },
                ],
              },
              {
                path: 'settlement/obligations',
                element: <ProtectedRoute requiredRoles={[...OPS_ROLES, ...FINANCE_ROLES]} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <ObligationListPage />
                      </Lazy>
                    ),
                  },
                ],
              },
            ],
          },
          {
            path: 'finance',
            children: [
              {
                path: 'ledger',
                element: <ProtectedRoute requiredRoles={[...FINANCE_ROLES, Role.Auditor]} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <LedgerPage />
                      </Lazy>
                    ),
                  },
                ],
              },
              {
                path: 'charges',
                element: <ProtectedRoute requiredRoles={FINANCE_ROLES} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <ChargesConfigPage />
                      </Lazy>
                    ),
                  },
                ],
              },
            ],
          },
          {
            path: 'reconciliation',
            element: <ProtectedRoute requiredRoles={[...OPS_ROLES, Role.RiskController]} />,
            children: [
              {
                index: true,
                element: (
                  <Lazy>
                    <ReconDashboardPage />
                  </Lazy>
                ),
              },
            ],
          },
          {
            path: 'master-setup',
            children: [
              {
                path: 'exchanges',
                element: <ProtectedRoute requiredRoles={MASTER_SETUP_ROLES} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <ExchangeListPage />
                      </Lazy>
                    ),
                  },
                ],
              },
              {
                path: 'instruments',
                element: <ProtectedRoute requiredRoles={MASTER_SETUP_ROLES} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <InstrumentListPage />
                      </Lazy>
                    ),
                  },
                ],
              },
            ],
          },
          {
            path: 'corporate-actions',
            element: <ProtectedRoute requiredRoles={CORP_ACTION_ROLES} />,
            children: [
              {
                index: true,
                element: (
                  <Lazy>
                    <CorporateActionsListPage />
                  </Lazy>
                ),
              },
            ],
          },
          {
            path: 'eod',
            element: <ProtectedRoute requiredRoles={EOD_ROLES} />,
            children: [
              {
                index: true,
                element: (
                  <Lazy>
                    <EodPanel />
                  </Lazy>
                ),
              },
            ],
          },
          {
            path: 'governance',
            children: [
              {
                path: 'approvals',
                element: <ProtectedRoute requiredRoles={CHECKER_ROLES} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <ApprovalQueuePage />
                      </Lazy>
                    ),
                  },
                ],
              },
              {
                path: 'audit',
                element: <ProtectedRoute requiredRoles={AUDIT_ROLES} />,
                children: [
                  {
                    index: true,
                    element: (
                      <Lazy>
                        <AuditLogPage />
                      </Lazy>
                    ),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
