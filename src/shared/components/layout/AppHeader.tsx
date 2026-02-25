import { Layout, Space, Badge, Avatar, Dropdown, Typography, Button } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@modules/auth/store/authStore';
import { useUiStore } from '@store/uiStore';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  pendingApprovalCount?: number;
}

export function AppHeader({ pendingApprovalCount = 0 }: AppHeaderProps) {
  const navigate = useNavigate();
  const { username, tenantId, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const handleLogout = (): void => {
    logout();
    void navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 600 }}>{username}</div>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>
            Tenant: {tenantId?.substring(0, 8).toUpperCase()}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', danger: true },
  ];

  return (
    <Header
      style={{
        height: 64,
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Space size={16} align="center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ fontSize: 16 }}
        />
        <Text strong style={{ fontSize: 16, color: '#1d3557' }}>
          PostTrade Clearing Platform
        </Text>
      </Space>

      <Space size={20} align="center">
        <Badge count={pendingApprovalCount} overflowCount={99}>
          <Button
            type="text"
            icon={<CheckCircleOutlined style={{ fontSize: 18 }} />}
            onClick={() => void navigate('/governance/approvals')}
            title="Pending Approvals"
          />
        </Badge>

        <Badge dot={false}>
          <Button
            type="text"
            icon={<BellOutlined style={{ fontSize: 18 }} />}
            title="Notifications"
          />
        </Badge>

        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key === 'logout') handleLogout();
            },
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', background: '#1d3557' }} />
        </Dropdown>
      </Space>
    </Header>
  );
}
