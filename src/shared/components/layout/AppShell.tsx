import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { ErrorBoundary } from '../feedback/ErrorBoundary';

const { Content } = Layout;

export function AppShell() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content
          style={{
            padding: 24,
            minHeight: 'calc(100vh - 64px)',
            background: '#f5f5f5',
            overflowY: 'auto',
          }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  );
}
