import { useState } from 'react';
import { Form, Input, Button, Typography, Tag, Space, Alert, Radio } from 'antd';
import { IdcardOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useOnboardingStore } from '../../store/onboardingStore';

const { Text } = Typography;

const PAN_CHAR_TO_TYPE: Record<string, string> = {
  P: 'Individual',
  C: 'Company',
  H: 'HUF',
  F: 'Firm / Partnership',
  A: 'AOP / BOI',
  T: 'Trust',
  B: 'BOI',
  L: 'Local Authority',
  J: 'AJP',
  G: 'Government',
};

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function detectClientType(pan: string): string {
  const clean = (pan ?? '').trim().toUpperCase();
  if (clean.length < 4) return '';
  return PAN_CHAR_TO_TYPE[clean.charAt(3)] ?? 'Unknown';
}

interface Props {
  onNext: () => void;
}

type FormValues = { pan: string; holderType: 'Single' | 'Joint' };

export function PanVerificationStep({ onNext }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { pan: saved, setPan } = useOnboardingStore();
  const [detectedType, setDetectedType] = useState<string>(saved?.clientType ?? '');

  const isIndividual = detectedType === 'Individual';

  const handleValuesChange = (_: unknown, all: Partial<FormValues>) => {
    const type = detectClientType(all.pan ?? '');
    setDetectedType(type);
    // Non-individual PANs are always Single
    if (type !== 'Individual' && type !== '') {
      form.setFieldValue('holderType', 'Single');
    }
  };

  const handleFinish = (values: FormValues) => {
    const pan = values.pan.toUpperCase();
    const clientType = detectClientType(pan);
    const holderType = clientType === 'Individual' ? values.holderType : 'Single';
    setPan({ pan, clientType, holderType });
    onNext();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ pan: saved?.pan ?? '', holderType: saved?.holderType ?? 'Single' }}
      onValuesChange={handleValuesChange}
      onFinish={handleFinish}
      style={{ maxWidth: 520 }}
    >
      <Form.Item
        label="PAN Number"
        name="pan"
        normalize={(val: string) => (val ?? '').toUpperCase()}
        rules={[
          { required: true, message: 'PAN is required' },
          {
            validator: (_, value: string) =>
              PAN_REGEX.test((value ?? '').toUpperCase())
                ? Promise.resolve()
                : Promise.reject(new Error('Enter a valid 10-character PAN (e.g. ABCDE1234F)')),
          },
        ]}
      >
        <Input
          prefix={<IdcardOutlined />}
          placeholder="e.g. ABCDE1234F"
          maxLength={10}
          style={{ letterSpacing: 2, fontWeight: 600, width: 240 }}
        />
      </Form.Item>

      {detectedType && (
        <Form.Item>
          <Space>
            <Text type="secondary">Detected client type:</Text>
            <Tag
              color={detectedType === 'Unknown' ? 'red' : 'blue'}
              style={{ fontWeight: 600, fontSize: 13 }}
            >
              {detectedType}
            </Tag>
          </Space>
        </Form.Item>
      )}

      {isIndividual && (
        <Form.Item
          label="Account Holder Type"
          name="holderType"
          rules={[{ required: true, message: 'Please select holder type' }]}
        >
          <Radio.Group>
            <Radio.Button value="Single">
              <Space>
                <UserOutlined />
                Single Holder
              </Space>
            </Radio.Button>
            <Radio.Button value="Joint">
              <Space>
                <TeamOutlined />
                Joint Holders
              </Space>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
      )}

      <Alert
        type="info"
        showIcon
        message="PAN is used to determine the client type and is mandatory for KYC compliance."
        style={{ marginBottom: 24 }}
      />

      <Button type="primary" htmlType="submit">
        Next — Basic Details
      </Button>
    </Form>
  );
}
