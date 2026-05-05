import { Form, Select, Input, Radio, Row, Col, Button, Space, Typography, Divider, Collapse } from 'antd';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { FatcaData } from '../../types/onboarding.types';

const { Text } = Typography;

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore',
  'UAE', 'Germany', 'France', 'Japan', 'China', 'Hong Kong', 'Switzerland',
  'Netherlands', 'Sweden', 'Denmark', 'Norway', 'New Zealand', 'South Africa',
  'Brazil', 'Mexico', 'Saudi Arabia', 'Kuwait', 'Bahrain', 'Oman', 'Qatar',
  'Malaysia', 'Thailand', 'South Korea', 'Other',
].map((c) => ({ value: c, label: c }));

const WEALTH_OPTIONS = [
  { value: 'Salary', label: 'Salary / Employment Income' },
  { value: 'Business', label: 'Business Income' },
  { value: 'Investment', label: 'Investment Returns' },
  { value: 'Inheritance', label: 'Inheritance / Gift' },
  { value: 'Other', label: 'Other' },
];

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function FatcaStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<FatcaData>();
  const { fatca: saved, setFatca, pan, jointHolders } = useOnboardingStore();

  const isJoint = pan?.holderType === 'Joint';

  const handleFinish = (values: FatcaData) => {
    setFatca(values);
    onNext();
  };

  const primaryFatcaForm = (
    <Form
      form={form}
      layout="vertical"
      initialValues={saved ?? { isUsPerson: false }}
      onFinish={handleFinish}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Tax Residency Country"
            name="taxCountry"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              showSearch
              options={COUNTRIES}
              placeholder="Select country"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="TIN / Tax Identification Number" name="tin">
            <Input placeholder="Optional — enter if applicable" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Are you a US Person?"
            name="isUsPerson"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Radio.Group>
              <Radio value={false}>No</Radio>
              <Radio value={true}>Yes</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Source of Wealth"
            name="sourceOfWealth"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={WEALTH_OPTIONS} placeholder="Select source" />
          </Form.Item>
        </Col>
      </Row>

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — Declaration
        </Button>
      </Space>
    </Form>
  );

  if (!isJoint || jointHolders.length === 0) {
    return (
      <div>
        <Text strong style={{ display: 'block', marginBottom: 16, color: '#1d3557' }}>
          FATCA / CRS — Primary Holder
        </Text>
        {primaryFatcaForm}
      </div>
    );
  }

  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 16, color: '#1d3557' }}>
        FATCA / CRS Declaration
      </Text>

      <Collapse
        defaultActiveKey={['primary']}
        items={[
          {
            key: 'primary',
            label: 'Primary Holder',
            children: primaryFatcaForm,
          },
          ...jointHolders.map((h) => ({
            key: `holder-${h.holderNumber}`,
            label: `${h.holderNumber === 2 ? '2nd' : '3rd'} Holder — ${h.firstName} ${h.lastName}`,
            children: (
              <div>
                <Divider orientation="left" style={{ fontSize: 13, color: '#888' }}>
                  Joint holder FATCA will be captured at account activation
                </Divider>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  FATCA details for {h.firstName} {h.lastName} (PAN: {h.pan}) will be collected
                  separately during KYC completion.
                </Text>
              </div>
            ),
          })),
        ]}
      />
    </div>
  );
}
