import { Card, Typography, Alert } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import config from '@core/config/env';

const { Title, Text } = Typography;

const SESSION_MESSAGES: Record<string, string> = {
  session_expired: 'Your session has expired. Please sign in again.',
  unauthorized: 'You must be signed in to access that page.',
};

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const sessionMessage = reason ? SESSION_MESSAGES[reason] : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1d3557 0%, #457b9d 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ color: '#1d3557', margin: 0 }}>
            {config.appName}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Post-Trade & Clearing Operations
          </Text>
        </div>

        {sessionMessage && (
          <Alert type="warning" message={sessionMessage} showIcon style={{ marginBottom: 24 }} />
        )}

        <LoginForm />
      </Card>
    </div>
  );
}
