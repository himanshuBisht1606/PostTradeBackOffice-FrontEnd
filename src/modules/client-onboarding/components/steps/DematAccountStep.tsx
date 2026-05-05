import { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  Space,
  Checkbox,
  Typography,
  Divider,
  Spin,
  Tag,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { DematAccountData } from '../../types/onboarding.types';
import {
  getNsdlDpMasters,
  getCdslDpMasters,
} from '../../../master-setup/services/dpMasterService';
import { getSegments } from '../../../master-setup/services/segmentService';

const { Text } = Typography;

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

  const [depository, setDepository] = useState<string | null>(saved?.depository ?? null);

  // Load active segments from master
  const { data: segments = [], isLoading: segmentsLoading } = useQuery({
    queryKey: ['segments'],
    queryFn: getSegments,
    staleTime: 30 * 60 * 1000,
  });

  const segmentOptions = segments
    .filter((s) => s.isActive)
    .map((s) => ({ label: `${s.segmentName} (${s.segmentCode})`, value: s.segmentCode }));

  // DP lists — loaded lazily when depository is selected
  const { data: nsdlDps = [], isFetching: nsdlLoading } = useQuery({
    queryKey: ['nsdlDps'],
    queryFn: getNsdlDpMasters,
    enabled: depository === 'NSDL',
    staleTime: 10 * 60 * 1000,
  });

  const { data: cdslDps = [], isFetching: cdslLoading } = useQuery({
    queryKey: ['cdslDps'],
    queryFn: getCdslDpMasters,
    enabled: depository === 'CDSL',
    staleTime: 10 * 60 * 1000,
  });

  const dpList = depository === 'NSDL' ? nsdlDps : depository === 'CDSL' ? cdslDps : [];
  const dpLoading = nsdlLoading || cdslLoading;

  const dpOptions = dpList
    .filter((d) => d.isActive)
    .map((d) => ({
      value: d.dpCode,
      label: `${d.dpName} (${d.dpCode})`,
      dpName: d.dpName,
    }));

  const handleDepositoryChange = (value: string) => {
    setDepository(value);
    form.setFieldsValue({ dpId: '', dpName: '' });
  };

  const handleDpSelect = (
    dpCode: string,
    option: { dpName?: string } | { dpName?: string }[],
  ) => {
    const opt = Array.isArray(option) ? option[0] : option;
    form.setFieldsValue({
      dpId: dpCode,
      dpName: opt?.dpName ?? '',
    });
  };

  const handleFinish = (values: DematAccountData) => {
    setDematAccount(values);
    onNext();
  };

  const dpLabel = (
    <span>
      Select DP from Master
      {dpLoading && <Spin size="small" style={{ marginLeft: 8 }} />}
      {!dpLoading && depository && dpOptions.length > 0 && (
        <Tag color="blue" style={{ marginLeft: 8, fontWeight: 400 }}>
          {dpOptions.length} DPs loaded
        </Tag>
      )}
    </span>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={saved ?? { segments: [] }}
      onFinish={handleFinish}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Depository"
            name="depository"
            rules={[{ required: true, message: 'Depository is required' }]}
          >
            <Select
              options={DEPOSITORY_OPTIONS}
              placeholder="Select depository"
              onChange={handleDepositoryChange}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* DP lookup — auto-fills dpId and dpName */}
      <Row gutter={16}>
        <Col span={16}>
          <Form.Item label={dpLabel}>
            <Select
              showSearch
              allowClear
              disabled={!depository}
              loading={dpLoading}
              placeholder={
                !depository
                  ? 'Select depository first'
                  : dpLoading
                    ? 'Loading DPs…'
                    : 'Search DP by name or code'
              }
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={dpOptions}
              onSelect={handleDpSelect}
              onClear={() => form.setFieldsValue({ dpId: '', dpName: '' })}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="DP ID"
            name="dpId"
            rules={[{ required: true, message: 'DP ID is required' }]}
            tooltip="Auto-filled from DP selection above, or enter manually"
          >
            <Input placeholder="e.g. IN301549" />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label="DP Name"
            name="dpName"
            rules={[{ required: true, message: 'DP Name is required' }]}
            tooltip="Auto-filled from DP selection above, or enter manually"
          >
            <Input placeholder="e.g. HDFC Securities Ltd." />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Client ID / Beneficiary ID"
            name="clientId"
            rules={[{ required: true, message: 'Client ID is required' }]}
            tooltip={
              depository === 'NSDL'
                ? '8-digit beneficiary ID assigned by your DP'
                : depository === 'CDSL'
                  ? '8-digit BO ID assigned by your DP'
                  : 'Account number assigned by your DP'
            }
          >
            <Input
              placeholder={
                depository === 'NSDL'
                  ? '8-digit beneficiary ID'
                  : depository === 'CDSL'
                    ? '8-digit BO ID'
                    : 'Enter client ID'
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '4px 0 16px' }} />

      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        Trading Segments
        {segmentsLoading && <Spin size="small" style={{ marginLeft: 8 }} />}
      </Text>

      <Form.Item
        name="segments"
        rules={[
          {
            validator: (_, value: string[]) =>
              value && value.length > 0
                ? Promise.resolve()
                : Promise.reject(new Error('Select at least one trading segment')),
          },
        ]}
      >
        {segmentsLoading ? (
          <Spin size="small" />
        ) : (
          <Checkbox.Group options={segmentOptions} />
        )}
      </Form.Item>

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — FATCA
        </Button>
      </Space>
    </Form>
  );
}
