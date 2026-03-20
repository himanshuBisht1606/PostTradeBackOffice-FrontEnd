import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  SwapOutlined,
  BankOutlined,
  BarChartOutlined,
  SafetyOutlined,
  SettingOutlined,
  UserAddOutlined,
  ImportOutlined,
  ApartmentOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '@store/uiStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function makeItem(
  label: string,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return { key, icon, children, label, type } as MenuItem;
}

function makeGroup(label: string, key: string, children: MenuItem[]): MenuItem {
  return { key, label, type: 'group', children } as MenuItem;
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed } = useUiStore();
  const { roles } = useAuthStore();

  const isAuditorOnly = roles.includes(Role.Auditor) && roles.length === 1;
  const isPartnerOnly = roles.includes(Role.Partner) && roles.length === 1;

  const masterSetupChildren: MenuItem[] = [
    // ── Exchange & Segments ───────────────────────────────────────────────────
    makeItem('Exchange & Segments', 'master-exchange-group', <ApartmentOutlined />, [
      makeItem('Exchanges', '/master/exchanges'),
      makeItem('Segments', '/master/segments'),
      makeItem('Exchange Segments', '/master/exchange-segments'),
    ]),

    // ── Instruments ───────────────────────────────────────────────────────────
    makeItem('Instruments', '/master/instruments', <FundOutlined />),

    // ── Branches ─────────────────────────────────────────────────────────────
    makeItem('Branches', '/master/branches'),

    // ── Reference Data ────────────────────────────────────────────────────────
    makeItem('Reference Data', 'master-ref-group', <DatabaseOutlined />, [
      makeItem('States', '/master/states'),
      makeItem('Pin Codes', '/master/pin-codes'),
      makeItem('Banks', '/master/banks'),
      makeItem('Bank Mappings', '/master/bank-mappings'),
    ]),

    // ── Depository Masters ────────────────────────────────────────────────────
    makeItem('Depository', 'master-dp-group', <SafetyCertificateOutlined />, [
      makeItem('NSDL DP Master', '/master/nsdl-dp'),
      makeItem('CDSL DP Master', '/master/cdsl-dp'),
    ]),
  ];

  const items: MenuItem[] = [
    makeItem('Dashboard', '/dashboard', <DashboardOutlined />),

    makeItem('Account Management', 'account-management', <TeamOutlined />, [
      makeItem('Clients', '/account-management/clients'),
      ...(!isAuditorOnly && !isPartnerOnly
        ? [
            makeItem('New Client', '/account-management/onboarding', <UserAddOutlined />),
            makeItem('Brokers', '/account-management/brokers'),
          ]
        : []),
    ]),

    ...(!isAuditorOnly && !isPartnerOnly
      ? [
          makeItem('Revenue Ops', 'revenue-ops', <DollarOutlined />, [
            makeItem('Charges Config', '/finance/charges'),
          ]),

          makeItem('Clearing', 'clearing', <SwapOutlined />, [
            makeItem('Trade Book', '/clearing/trades'),
            makeItem('Settlement Batches', '/clearing/settlement/batches'),
            makeItem('Obligations', '/clearing/settlement/obligations'),
          ]),

          makeItem('Finance', 'finance', <BankOutlined />, [makeItem('Ledger', '/finance/ledger')]),

          makeItem('Reconciliation', '/reconciliation', <BarChartOutlined />),

          makeItem('Post-Trade', 'post-trade', <ImportOutlined />, [
            makeItem('CM File Import', '/post-trade/cm/import'),
            makeItem('FO File Import', '/post-trade/fo/import'),
          ]),

          makeItem('Master Setup', 'master', <SettingOutlined />, masterSetupChildren),
        ]
      : []),

    makeItem('Governance', 'governance', <SafetyOutlined />, [
      ...(!isAuditorOnly && !isPartnerOnly ? [makeItem('Approvals', '/governance/approvals')] : []),
      makeItem('Audit Log', '/governance/audit'),
    ]),
  ];

  const selectedKeys = [location.pathname];

  // Build open keys from current path — walk nested items
  const allParentKeys: string[] = [];
  const collectParents = (menuItems: MenuItem[], path: string) => {
    for (const item of menuItems) {
      if (!item) continue;
      const i = item as { key: string; children?: MenuItem[] };
      if (i.children) {
        const childHit = i.children.some((c) => {
          const ci = c as { key: string; children?: MenuItem[] };
          if (ci.key === path) return true;
          if (ci.children) {
            const subHit = ci.children.some((sc) => (sc as { key: string }).key === path);
            if (subHit) allParentKeys.push(ci.key);
            return subHit;
          }
          return false;
        });
        if (childHit) allParentKeys.push(i.key);
        collectParents(i.children, path);
      }
    }
  };
  collectParents(items, location.pathname);

  return (
    <Sider
      collapsed={sidebarCollapsed}
      width={240}
      collapsedWidth={60}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 16px',
        }}
      >
        {!sidebarCollapsed && (
          <span style={{ fontWeight: 700, fontSize: 13, color: '#1d3557', letterSpacing: 0.5 }}>
            PT CLEARING
          </span>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={['master', 'account-management', ...allParentKeys]}
        items={items}
        style={{ border: 'none', paddingTop: 8 }}
        onClick={({ key }) => {
          if (key.startsWith('/')) void navigate(key);
        }}
      />
    </Sider>
  );
}
