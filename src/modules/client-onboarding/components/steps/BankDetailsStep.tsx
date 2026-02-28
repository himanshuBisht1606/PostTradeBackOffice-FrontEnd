import { Form, Input, Select, Row, Col, Button, Space } from 'antd';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { BankDetailsData } from '../../types/onboarding.types';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' },
  { value: 'NRE', label: 'NRE' },
  { value: 'NRO', label: 'NRO' },
];

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function BankDetailsStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<BankDetailsData & { confirmAccountNumber: string }>();
  const { bankDetails: saved, setBankDetails } = useOnboardingStore();

  const handleFinish = (values: BankDetailsData & { confirmAccountNumber: string }) => {
    const data: BankDetailsData = {
      bankName: values.bankName,
      branchName: values.branchName,
      accountNumber: values.accountNumber,
      ifscCode: values.ifscCode.toUpperCase(),
      accountType: values.accountType,
    };
    setBankDetails(data);
    onNext();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      {...(saved ? { initialValues: { ...saved, confirmAccountNumber: saved.accountNumber } } : {})}
      onFinish={handleFinish}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Bank Name"
            name="bankName"
            rules={[{ required: true, message: 'Bank name is required' }]}
          >
            <Input placeholder="e.g. HDFC Bank" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Branch Name"
            name="branchName"
            rules={[{ required: true, message: 'Branch name is required' }]}
          >
            <Input placeholder="e.g. Connaught Place" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Account Number"
            name="accountNumber"
            rules={[
              { required: true, message: 'Account number is required' },
              { pattern: /^\d{9,18}$/, message: 'Enter a valid account number (9-18 digits)' },
            ]}
          >
            <Input placeholder="Enter account number" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Confirm Account Number"
            name="confirmAccountNumber"
            dependencies={['accountNumber']}
            rules={[
              { required: true, message: 'Please confirm account number' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('accountNumber') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Account numbers do not match'));
                },
              }),
            ]}
          >
            <Input placeholder="Re-enter account number" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="IFSC Code"
            name="ifscCode"
            normalize={(val: string) => (val ?? '').toUpperCase()}
            rules={[
              { required: true, message: 'IFSC code is required' },
              { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Enter a valid IFSC code' },
            ]}
          >
            <Input maxLength={11} placeholder="e.g. HDFC0001234" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Account Type"
            name="accountType"
            rules={[{ required: true, message: 'Account type is required' }]}
          >
            <Select options={ACCOUNT_TYPE_OPTIONS} placeholder="Select account type" />
          </Form.Item>
        </Col>
      </Row>

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — Demat Account
        </Button>
      </Space>
    </Form>
  );
}
