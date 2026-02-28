import { Form, Input, Button, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '@utils/errorHandler';
import type { LoginRequest } from '../types/auth.types';

const { Text } = Typography;

export function LoginForm() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();
  const [form] = Form.useForm<LoginRequest>();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      storeLogin(data.token, data.expiresAt, data.username);
      void navigate('/dashboard', { replace: true });
    },
  });

  const handleSubmit = (values: LoginRequest): void => {
    mutation.mutate(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off" size="large">
      {mutation.isError && (
        <Form.Item>
          <Alert
            type="error"
            message={getErrorMessage(mutation.error)}
            showIcon
            closable
            style={{ borderRadius: 6 }}
          />
        </Form.Item>
      )}

      <Form.Item
        name="tenantCode"
        label={
          <span>
            Broker / Entity Code
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 6, fontWeight: 400 }}>
              (SEBI-registered entity)
            </Text>
          </span>
        }
        rules={[{ required: true, message: 'Please enter your broker or entity code' }]}
      >
        <Input
          prefix={<BankOutlined style={{ color: '#94a3b8' }} />}
          placeholder="e.g. BROKER01, NSE-MEMBER"
          autoComplete="organization"
        />
      </Form.Item>

      <Form.Item
        name="username"
        label="User ID / Employee Code"
        rules={[{ required: true, message: 'Please enter your User ID' }]}
      >
        <Input
          prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
          placeholder="User ID or employee code"
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: 'Please enter your password' }]}
        style={{ marginBottom: 20 }}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={mutation.isPending}
          block
          style={{
            height: 44,
            background: '#1d3557',
            borderColor: '#1d3557',
            fontWeight: 600,
            letterSpacing: '0.3px',
            borderRadius: 8,
          }}
        >
          {mutation.isPending ? 'Signing In…' : 'Sign In to Backoffice'}
        </Button>
      </Form.Item>
    </Form>
  );
}
