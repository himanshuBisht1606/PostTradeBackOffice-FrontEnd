import { useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Divider,
} from 'antd';
import dayjs from 'dayjs';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { BasicDetailsData } from '../../types/onboarding.types';

const { Text } = Typography;

const PREFIX_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'].map((v) => ({ value: v, label: v }));
const GENDER_OPTIONS = ['Male', 'Female', 'Other'].map((v) => ({ value: v, label: v }));
const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'].map((v) => ({
  value: v,
  label: v,
}));
const OCCUPATION_OPTIONS = [
  'Salaried',
  'Business',
  'Professional',
  'Retired',
  'Housewife',
  'Student',
  'Others',
].map((v) => ({ value: v, label: v }));
const INCOME_OPTIONS = [
  { value: 'Below1L', label: 'Below ₹1 Lakh' },
  { value: '1L-5L', label: '₹1–5 Lakhs' },
  { value: '5L-10L', label: '₹5–10 Lakhs' },
  { value: '10L-25L', label: '₹10–25 Lakhs' },
  { value: '25L-50L', label: '₹25–50 Lakhs' },
  { value: 'Above50L', label: 'Above ₹50 Lakhs' },
];
const CITIZENSHIP_OPTIONS = ['Indian', 'NRI', 'Foreign National'].map((v) => ({
  value: v,
  label: v,
}));
const RESIDENTIAL_OPTIONS = ['Resident', 'Non-Resident', 'Foreign National'].map((v) => ({
  value: v,
  label: v,
}));
const IDENTITY_PROOF_OPTIONS = [
  { value: 'Aadhaar', label: 'Aadhaar' },
  { value: 'Passport', label: 'Passport' },
  { value: 'VoterId', label: 'Voter ID' },
  { value: 'DrivingLicense', label: 'Driving License' },
];

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

type FormValues = Omit<BasicDetailsData, 'dob'> & { dob: dayjs.Dayjs | null };

export function BasicDetailsStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { basicDetails: saved, setBasicDetails } = useOnboardingStore();
  const [identityProofType, setIdentityProofType] = useState<string>(
    saved?.identityProofType ?? '',
  );

  const handleFinish = (values: FormValues) => {
    setBasicDetails({ ...values, dob: values.dob ? values.dob.format('YYYY-MM-DD') : '' });
    onNext();
  };

  const initial: Partial<FormValues> = saved
    ? { ...saved, dob: saved.dob ? dayjs(saved.dob) : null }
    : {};

  return (
    <Form form={form} layout="vertical" initialValues={initial} onFinish={handleFinish}>
      {/* Name Details */}
      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        Name Details
      </Text>
      <Row gutter={12}>
        <Col span={4}>
          <Form.Item label="Prefix" name="prefix">
            <Select options={PREFIX_OPTIONS} placeholder="—" />
          </Form.Item>
        </Col>
        <Col span={7}>
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Middle Name" name="middleName">
            <Input />
          </Form.Item>
        </Col>
        <Col span={7}>
          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item label="Father / Spouse Name" name="fatherSpouseName">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Mother Name" name="motherName">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '4px 0 16px' }} />

      {/* Personal Details */}
      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        Personal Details
      </Text>
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item
            label="Date of Birth"
            name="dob"
            rules={[
              { required: true, message: 'Required' },
              {
                validator: (_, value: dayjs.Dayjs | null) => {
                  if (!value) return Promise.resolve();
                  const minAge = dayjs().subtract(18, 'year');
                  return value.isBefore(minAge) || value.isSame(minAge, 'day')
                    ? Promise.resolve()
                    : Promise.reject(new Error('Client must be at least 18 years old'));
                },
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD-MMM-YYYY"
              disabledDate={(d) => d.isAfter(dayjs().subtract(18, 'year'))}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Gender" name="gender" rules={[{ required: true, message: 'Required' }]}>
            <Select options={GENDER_OPTIONS} placeholder="Select" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Marital Status" name="maritalStatus">
            <Select options={MARITAL_OPTIONS} placeholder="Select" />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '4px 0 16px' }} />

      {/* Occupation & Financial */}
      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        Occupation & Financial
      </Text>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            label="Occupation"
            name="occupation"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={OCCUPATION_OPTIONS} placeholder="Select" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Gross Annual Income" name="grossAnnualIncome">
            <Select options={INCOME_OPTIONS} placeholder="Select" />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '4px 0 16px' }} />

      {/* Identity & Residency */}
      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        Identity & Residency
      </Text>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item label="Citizenship Status" name="citizenshipStatus">
            <Select options={CITIZENSHIP_OPTIONS} placeholder="Select" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Residential Status" name="residentialStatus">
            <Select options={RESIDENTIAL_OPTIONS} placeholder="Select" allowClear />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item label="Identity Proof Type" name="identityProofType">
            <Select
              options={IDENTITY_PROOF_OPTIONS}
              placeholder="Select"
              allowClear
              onChange={(val: string) => {
                setIdentityProofType(val ?? '');
                if (!val) form.setFieldValue('identityProofNumber', undefined);
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Identity Proof Number"
            name="identityProofNumber"
            rules={[
              {
                required: !!identityProofType,
                message: 'Required when identity proof type is selected',
              },
            ]}
          >
            <Input
              placeholder="Enter proof number"
              disabled={!identityProofType}
            />
          </Form.Item>
        </Col>
      </Row>

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — Address
        </Button>
      </Space>
    </Form>
  );
}
