import { Form, Input, Select, DatePicker, Row, Col, Button, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { EntityDetailsData } from '../../types/onboarding.types';

const { Text } = Typography;

const ANNUAL_TURNOVER_OPTIONS = [
  { value: 'Below 1 Lakh', label: 'Below ₹1 Lakh' },
  { value: '1-5 Lakh', label: '₹1 – 5 Lakh' },
  { value: '5-10 Lakh', label: '₹5 – 10 Lakh' },
  { value: '10-25 Lakh', label: '₹10 – 25 Lakh' },
  { value: '25 Lakh-1 Crore', label: '₹25 Lakh – 1 Crore' },
  { value: '1-5 Crore', label: '₹1 – 5 Crore' },
  { value: '5-25 Crore', label: '₹5 – 25 Crore' },
  { value: 'Above 25 Crore', label: 'Above ₹25 Crore' },
];

const CONSTITUTION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  Company: [
    { value: 'Private Limited', label: 'Private Limited' },
    { value: 'Public Limited', label: 'Public Limited' },
    { value: 'LLP', label: 'LLP' },
    { value: 'OPC', label: 'One Person Company (OPC)' },
    { value: 'Section 8', label: 'Section 8 (NGO/Non-Profit)' },
  ],
  Firm: [
    { value: 'Partnership Firm', label: 'Partnership Firm' },
    { value: 'LLP', label: 'LLP' },
  ],
  Trust: [
    { value: 'Private Trust', label: 'Private Trust' },
    { value: 'Public Trust', label: 'Public Trust' },
    { value: 'Charitable Trust', label: 'Charitable Trust' },
    { value: 'Religious Trust', label: 'Religious Trust' },
  ],
  AOP: [
    { value: 'AOP', label: 'Association of Persons (AOP)' },
    { value: 'BOI', label: 'Body of Individuals (BOI)' },
  ],
  BOI: [
    { value: 'BOI', label: 'Body of Individuals (BOI)' },
    { value: 'AOP', label: 'Association of Persons (AOP)' },
  ],
};

// Whether to show Constitution Type dropdown
const SHOW_CONSTITUTION = new Set(['Company', 'Firm', 'Trust', 'AOP', 'BOI']);
// Whether to show Registration Number field (and its label/required-ness)
const REG_NUMBER_CONFIG: Record<
  string,
  { label: string; required: boolean } | undefined
> = {
  Company: { label: 'CIN', required: true },
  Firm: { label: 'Partnership Deed Reg. No.', required: false },
  Trust: { label: 'Trust Registration No.', required: true },
  AOP: { label: 'Reference Number', required: false },
  BOI: { label: 'Reference Number', required: false },
  'Local Authority': { label: 'Reference Number', required: false },
  Government: { label: 'Reference Number', required: false },
};

function getEntityLabel(clientType: string): string {
  switch (clientType) {
    case 'Company':
      return 'Company Name';
    case 'HUF':
      return 'HUF Name';
    case 'Trust':
      return 'Trust Name';
    case 'Firm':
      return 'Firm Name';
    case 'AOP':
      return 'AOP Name';
    case 'BOI':
      return 'BOI Name';
    case 'Local Authority':
      return 'Authority Name';
    case 'Government':
      return 'Government Entity Name';
    default:
      return 'Entity Name';
  }
}

interface FormValues {
  entityName: string;
  registrationNumber?: string;
  dateOfConstitution?: dayjs.Dayjs | null;
  constitutionType?: string;
  gstNumber?: string;
  annualTurnover?: string;
  kartaName?: string;
  kartaPan?: string;
}

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function EntityDetailsStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { pan, entityDetails: saved, setEntityDetails } = useOnboardingStore();

  const clientType = pan?.clientType ?? '';
  const isHUF = clientType === 'HUF';
  const showConstitution = SHOW_CONSTITUTION.has(clientType);
  const regConfig = REG_NUMBER_CONFIG[clientType];

  const constitutionOptions = CONSTITUTION_OPTIONS[clientType] ?? [];

  const initial: Partial<FormValues> = {
    entityName: saved?.entityName ?? '',
    dateOfConstitution: saved?.dateOfConstitution ? dayjs(saved.dateOfConstitution) : null,
  };
  if (saved?.constitutionType) initial.constitutionType = saved.constitutionType;
  if (saved?.gstNumber) initial.gstNumber = saved.gstNumber;
  if (saved?.annualTurnover) initial.annualTurnover = saved.annualTurnover;
  if (saved?.kartaName) initial.kartaName = saved.kartaName;
  if (saved?.kartaPan) initial.kartaPan = saved.kartaPan;
  if (saved?.registrationNumber) initial.registrationNumber = saved.registrationNumber;

  const handleFinish = (values: FormValues) => {
    const data: EntityDetailsData = {
      entityName: values.entityName,
    };
    if (values.dateOfConstitution) {
      data.dateOfConstitution = values.dateOfConstitution.format('YYYY-MM-DD');
    }
    if (values.constitutionType) data.constitutionType = values.constitutionType;
    if (values.registrationNumber) data.registrationNumber = values.registrationNumber;
    if (values.gstNumber) data.gstNumber = values.gstNumber;
    if (values.annualTurnover) data.annualTurnover = values.annualTurnover;
    if (values.kartaName) data.kartaName = values.kartaName;
    if (values.kartaPan) data.kartaPan = values.kartaPan;
    setEntityDetails(data);
    onNext();
  };

  return (
    <Form form={form} layout="vertical" initialValues={initial} onFinish={handleFinish}>
      <Text strong style={{ display: 'block', marginBottom: 16, color: '#1d3557' }}>
        Entity Details
      </Text>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={getEntityLabel(clientType)}
            name="entityName"
            rules={[{ required: true, message: 'Required' }, { max: 200, message: 'Max 200 chars' }]}
          >
            <Input placeholder="Enter full legal name" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Date of Constitution / Incorporation" name="dateOfConstitution">
            <DatePicker
              style={{ width: '100%' }}
              format="DD-MMM-YYYY"
              disabledDate={(d) => d.isAfter(dayjs())}
            />
          </Form.Item>
        </Col>
      </Row>

      {showConstitution && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Constitution Type" name="constitutionType">
              <Select options={constitutionOptions} placeholder="Select type" allowClear />
            </Form.Item>
          </Col>
        </Row>
      )}

      {regConfig && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={regConfig.label}
              name="registrationNumber"
              rules={regConfig.required ? [{ required: true, message: 'Required' }] : []}
            >
              <Input placeholder={regConfig.required ? 'Required' : 'Optional'} />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="GST Number"
            name="gstNumber"
            rules={[
              {
                pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: 'Invalid GST format (15 chars, e.g. 27ABCDE1234F1Z5)',
              },
            ]}
            normalize={(v: string) => (v ?? '').toUpperCase()}
          >
            <Input maxLength={15} placeholder="Optional — e.g. 27ABCDE1234F1Z5" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Annual Turnover" name="annualTurnover">
            <Select options={ANNUAL_TURNOVER_OPTIONS} placeholder="Select range" allowClear />
          </Form.Item>
        </Col>
      </Row>

      {isHUF && (
        <>
          <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
            Karta Details
          </Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Karta Name"
                name="kartaName"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Full name of Karta" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Karta PAN"
                name="kartaPan"
                rules={[
                  { required: true, message: 'Required' },
                  {
                    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
                    message: 'Invalid PAN format',
                  },
                ]}
                normalize={(v: string) => (v ?? '').toUpperCase()}
              >
                <Input maxLength={10} placeholder="AAAAA9999A" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — Authorized Signatories
        </Button>
      </Space>
    </Form>
  );
}
