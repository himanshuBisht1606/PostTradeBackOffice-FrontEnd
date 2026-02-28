import { Form, Input, Select, Row, Col, Button, Space } from 'antd';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { DematAccountData } from '../../types/onboarding.types';

const DEPOSITORY_OPTIONS = [
  { value: 'NSDL', label: 'NSDL' },
  { value: 'CDSL', label: 'CDSL' },
];

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function DematAccountStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<DematAccountData>();
  const { dematAccount: saved, setDematAccount } = useOnboardingStore();

  const handleFinish = (values: DematAccountData) => {
    setDematAccount(values);
    onNext();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      {...(saved ? { initialValues: saved } : {})}
      onFinish={handleFinish}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Depository"
            name="depository"
            rules={[{ required: true, message: 'Depository is required' }]}
          >
            <Select options={DEPOSITORY_OPTIONS} placeholder="Select depository" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="DP Name"
            name="dpName"
            rules={[{ required: true, message: 'DP Name is required' }]}
          >
            <Input placeholder="e.g. HDFC Securities" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="DP ID"
            name="dpId"
            rules={[{ required: true, message: 'DP ID is required' }]}
          >
            <Input placeholder="e.g. IN301549" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Client ID / Beneficiary ID"
            name="clientId"
            rules={[{ required: true, message: 'Client ID is required' }]}
          >
            <Input placeholder="e.g. 12345678" />
          </Form.Item>
        </Col>
      </Row>

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — Review
        </Button>
      </Space>
    </Form>
  );
}
