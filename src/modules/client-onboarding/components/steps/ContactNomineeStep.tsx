import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Divider,
} from 'antd';
import dayjs from 'dayjs';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { ContactData, NomineeData } from '../../types/onboarding.types';

const { Text } = Typography;

const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Other',
].map((v) => ({ value: v, label: v }));

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

interface FormValues extends ContactData {
  nomineeName: string;
  relationship: string;
  nomineeDob: dayjs.Dayjs | null;
  nomineePan?: string;
  sharePercentage: number;
  nomineeMobile?: string;
  nomineeEmail?: string;
  nomineeAddress?: string;
}

export function ContactNomineeStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<FormValues>();
  const {
    contact: savedContact,
    nominee: savedNominee,
    setContact,
    setNominee,
  } = useOnboardingStore();

  const handleFinish = (values: FormValues) => {
    const contactData: ContactData = { mobile: values.mobile, email: values.email };
    if (values.alternateMobile) contactData.alternateMobile = values.alternateMobile;
    setContact(contactData);

    const nomineeData: NomineeData = {
      nomineeName: values.nomineeName,
      relationship: values.relationship,
      dob: values.nomineeDob ? values.nomineeDob.format('YYYY-MM-DD') : '',
      sharePercentage: values.sharePercentage ?? 100,
    };
    if (values.nomineePan) nomineeData.nomineePan = values.nomineePan;
    if (values.nomineeMobile) nomineeData.nomineeMobile = values.nomineeMobile;
    if (values.nomineeEmail) nomineeData.nomineeEmail = values.nomineeEmail;
    if (values.nomineeAddress) nomineeData.nomineeAddress = values.nomineeAddress;
    setNominee(nomineeData);

    onNext();
  };

  const initial: Partial<FormValues> = {
    ...(savedContact ?? {}),
    ...(savedNominee
      ? {
          nomineeName: savedNominee.nomineeName,
          relationship: savedNominee.relationship,
          nomineeDob: savedNominee.dob ? dayjs(savedNominee.dob) : null,
          sharePercentage: savedNominee.sharePercentage,
          ...(savedNominee.nomineePan ? { nomineePan: savedNominee.nomineePan } : {}),
          ...(savedNominee.nomineeMobile ? { nomineeMobile: savedNominee.nomineeMobile } : {}),
          ...(savedNominee.nomineeEmail ? { nomineeEmail: savedNominee.nomineeEmail } : {}),
          ...(savedNominee.nomineeAddress ? { nomineeAddress: savedNominee.nomineeAddress } : {}),
        }
      : { sharePercentage: 100 }),
  };

  return (
    <Form form={form} layout="vertical" initialValues={initial} onFinish={handleFinish}>
      {/* Contact Details */}
      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        Contact Details
      </Text>
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item
            label="Mobile"
            name="mobile"
            rules={[
              { required: true, message: 'Required' },
              { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
            ]}
          >
            <Input maxLength={10} placeholder="10-digit mobile" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Required' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Alternate Mobile"
            name="alternateMobile"
            rules={[{ pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' }]}
          >
            <Input maxLength={10} placeholder="Optional" />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '4px 0 16px' }} />

      {/* Nominee Details */}
      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        Nominee Details
      </Text>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            label="Nominee Name"
            name="nomineeName"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            label="Relationship"
            name="relationship"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={RELATIONSHIP_OPTIONS} placeholder="Select" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            label="Share %"
            name="sharePercentage"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} addonAfter="%" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={8}>
          <Form.Item label="Date of Birth" name="nomineeDob">
            <DatePicker
              style={{ width: '100%' }}
              format="DD-MMM-YYYY"
              disabledDate={(d) => d.isAfter(dayjs())}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Nominee PAN"
            name="nomineePan"
            normalize={(val: string) => (val ?? '').toUpperCase()}
          >
            <Input maxLength={10} placeholder="Optional" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Nominee Mobile"
            name="nomineeMobile"
            rules={[{ pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' }]}
          >
            <Input maxLength={10} placeholder="Optional" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            label="Nominee Email"
            name="nomineeEmail"
            rules={[{ type: 'email', message: 'Invalid email' }]}
          >
            <Input placeholder="Optional" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Nominee Address" name="nomineeAddress">
            <Input placeholder="Optional" />
          </Form.Item>
        </Col>
      </Row>

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — Bank Details
        </Button>
      </Space>
    </Form>
  );
}
