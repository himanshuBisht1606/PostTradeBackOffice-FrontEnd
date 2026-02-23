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
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '@store/uiStore';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@types/roles.types';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function makeItem(
  label: string,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed } = useUiStore();
  const { roles } = useAuthStore();

  const isAuditorOnly =
    roles.includes(Role.Auditor) && roles.length === 1;
  const isPartnerOnly =
    roles.includes(Role.Partner) && roles.length === 1;

  const items: MenuItem[] = [
    makeItem('Dashboard', '/dashboard', <DashboardOutlined />),

    makeItem('Account Management', 'account-management', <TeamOutlined />, [
      makeItem('Clients', '/account-management/clients'),
      ...(isAuditorOnly || isPartnerOnly
        ? []
        : [makeItem('Brokers', '/account-management/brokers')]),
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

          makeItem('Finance', 'finance', <BankOutlined />, [
            makeItem('Ledger', '/finance/ledger'),
          ]),

          makeItem('Reconciliation', '/reconciliation', <BarChartOutlined />),
        ]
      : []),

    makeItem('Governance', 'governance', <SafetyOutlined />, [
      ...(!isAuditorOnly && !isPartnerOnly
        ? [makeItem('Approvals', '/governance/approvals')]
        : []),
      makeItem('Audit Log', '/governance/audit'),
    ]),
  ];

  const selectedKeys = [location.pathname];
  const openKeys = items
    .filter((item) => item && 'children' in item && item.children)
    .map((item) => item?.key as string)
    .filter((key) => location.pathname.startsWith('/' + key.replace('/', '')));

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
        defaultOpenKeys={openKeys}
        items={items}
        style={{ border: 'none', paddingTop: 8 }}
        onClick={({ key }) => {
          if (key.startsWith('/')) void navigate(key);
        }}
      />
    </Sider>
  );
}
