import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '@utils/errorHandler';
import type { LoginRequest } from '../types/auth.types';

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
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
      size="large"
    >
      {mutation.isError && (
        <Form.Item>
          <Alert
            type="error"
            message={getErrorMessage(mutation.error)}
            showIcon
            closable
          />
        </Form.Item>
      )}

      <Form.Item
        name="tenantCode"
        label="Tenant Code"
        rules={[{ required: true, message: 'Please enter your tenant code' }]}
      >
        <Input
          prefix={<BankOutlined />}
          placeholder="e.g. BROKER01"
          autoComplete="organization"
        />
      </Form.Item>

      <Form.Item
        name="username"
        label="Username"
        rules={[{ required: true, message: 'Please enter your username' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Username"
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: 'Please enter your password' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          autoComplete="current-password"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={mutation.isPending}
          block
          style={{ height: 44 }}
        >
          Sign In
        </Button>
      </Form.Item>
    </Form>
  );
}
