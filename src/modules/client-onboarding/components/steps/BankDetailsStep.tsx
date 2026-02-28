import { useState, useEffect, useMemo } from 'react';
import { Form, Input, Select, Row, Col, Button, Space, Spin, AutoComplete } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { BankDetailsData } from '../../types/onboarding.types';
import { getBankMasters } from '../../../master-setup/services/bankMasterService';
import { getBankMappingsByBankCode } from '../../../master-setup/services/bankMappingService';

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
  const [selectedBankCode, setSelectedBankCode] = useState<string | null>(null);

  // Load all bank masters
  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ['bankMasters'],
    queryFn: getBankMasters,
    staleTime: 10 * 60 * 1000,
  });

  // Load IFSC mappings when bank code is known
  const { data: bankMappings = [], isFetching: mappingsFetching } = useQuery({
    queryKey: ['bankMappings', selectedBankCode],
    queryFn: () => getBankMappingsByBankCode(selectedBankCode!),
    enabled: !!selectedBankCode,
    staleTime: 5 * 60 * 1000,
  });

  // bankName → bankCode lookup map
  const bankCodeMap = useMemo(
    () => new Map(banks.map((b) => [b.bankName, b.bankCode])),
    [banks],
  );

  // Restore bank code from saved data once banks have loaded
  useEffect(() => {
    if (saved?.bankName && banks.length > 0) {
      const code = bankCodeMap.get(saved.bankName);
      if (code) setSelectedBankCode(code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banks.length]);

  const bankOptions = banks
    .filter((b) => b.isActive)
    .map((b) => ({ value: b.bankName, label: `${b.bankName} (${b.bankCode})` }));

  const ifscOptions = bankMappings.map((m) => ({ value: m.ifscCode, label: m.ifscCode }));

  const handleBankChange = (value: string) => {
    const code = bankCodeMap.get(value) ?? null;
    setSelectedBankCode(code);
    form.setFieldValue('ifscCode', '');
  };

  const handleBankClear = () => {
    setSelectedBankCode(null);
    form.setFieldValue('ifscCode', '');
  };

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

  const ifscLabel = (
    <span>
      IFSC Code
      {mappingsFetching && <Spin size="small" style={{ marginLeft: 8 }} />}
      {selectedBankCode && !mappingsFetching && ifscOptions.length > 0 && (
        <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>
          — {ifscOptions.length} branch{ifscOptions.length > 1 ? 'es' : ''} available
        </span>
      )}
    </span>
  );

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
            <Select
              showSearch
              allowClear
              loading={banksLoading}
              placeholder={banksLoading ? 'Loading banks…' : 'Search and select bank'}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={bankOptions}
              onChange={handleBankChange}
              onClear={handleBankClear}
            />
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
            label={ifscLabel}
            name="ifscCode"
            normalize={(val: string) => (val ?? '').toUpperCase()}
            rules={[
              { required: true, message: 'IFSC code is required' },
              { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Enter a valid IFSC code' },
            ]}
          >
            <AutoComplete
              options={ifscOptions}
              filterOption={(input, option) =>
                (option?.value ?? '').toUpperCase().includes(input.toUpperCase())
              }
              placeholder={
                selectedBankCode && ifscOptions.length > 0
                  ? 'Search IFSC or type manually'
                  : 'e.g. HDFC0001234'
              }
            >
              <Input maxLength={11} />
            </AutoComplete>
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

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Account Number"
            name="accountNumber"
            rules={[
              { required: true, message: 'Account number is required' },
              { pattern: /^\d{9,18}$/, message: 'Enter a valid account number (9–18 digits)' },
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

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — Demat Account
        </Button>
      </Space>
    </Form>
  );
}
