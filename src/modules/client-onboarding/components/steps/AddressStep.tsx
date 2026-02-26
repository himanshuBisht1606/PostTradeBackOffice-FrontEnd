import { useState } from 'react';
import { Form, Input, Select, Row, Col, Button, Space, Typography, Divider, Checkbox } from 'antd';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { AddressData } from '../../types/onboarding.types';

const { Text } = Typography;

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu & Kashmir',
  'Ladakh',
].map((s) => ({ value: s, label: s }));

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function AddressStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<AddressData>();
  const { address: saved, setAddress } = useOnboardingStore();
  const [sameAsPerm, setSameAsPerm] = useState<boolean>(saved?.sameAsPermanent ?? false);

  const handleFinish = (values: AddressData) => {
    setAddress({ ...values, sameAsPermanent: sameAsPerm });
    onNext();
  };

  const handleSameCheck = (checked: boolean) => {
    setSameAsPerm(checked);
    if (checked) {
      const v = form.getFieldsValue();
      const corrFields: Partial<AddressData> = {
        corrLine1: v.permanentLine1,
        corrCity: v.permanentCity,
        corrState: v.permanentState,
        corrCountry: v.permanentCountry ?? 'India',
        corrPinCode: v.permanentPinCode,
      };
      if (v.permanentLine2) corrFields.corrLine2 = v.permanentLine2;
      form.setFieldsValue(corrFields);
    }
  };

  const initialValues: Partial<AddressData> = saved ?? { permanentCountry: 'India', corrCountry: 'India' };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish}>
      {/* Permanent Address */}
      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        Permanent Address
      </Text>

      <Form.Item
        label="Address Line 1"
        name="permanentLine1"
        rules={[{ required: true, message: 'Required' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label="Address Line 2" name="permanentLine2">
        <Input />
      </Form.Item>

      <Row gutter={12}>
        <Col span={8}>
          <Form.Item
            label="City"
            name="permanentCity"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="State"
            name="permanentState"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={INDIAN_STATES} showSearch placeholder="Select state" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label="PIN Code"
            name="permanentPinCode"
            rules={[
              { required: true, message: 'Required' },
              { pattern: /^[1-9][0-9]{5}$/, message: 'Invalid PIN' },
            ]}
          >
            <Input maxLength={6} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Country" name="permanentCountry">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '4px 0 16px' }} />

      {/* Correspondence Address */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Text strong style={{ color: '#1d3557' }}>
          Correspondence Address
        </Text>
        <Checkbox checked={sameAsPerm} onChange={(e) => handleSameCheck(e.target.checked)}>
          Same as Permanent
        </Checkbox>
      </div>

      <Form.Item
        label="Address Line 1"
        name="corrLine1"
        rules={sameAsPerm ? [] : [{ required: true, message: 'Required' }]}
      >
        <Input disabled={sameAsPerm} />
      </Form.Item>

      <Form.Item label="Address Line 2" name="corrLine2">
        <Input disabled={sameAsPerm} />
      </Form.Item>

      <Row gutter={12}>
        <Col span={8}>
          <Form.Item
            label="City"
            name="corrCity"
            rules={sameAsPerm ? [] : [{ required: true, message: 'Required' }]}
          >
            <Input disabled={sameAsPerm} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="State"
            name="corrState"
            rules={sameAsPerm ? [] : [{ required: true, message: 'Required' }]}
          >
            <Select
              options={INDIAN_STATES}
              showSearch
              placeholder="Select state"
              disabled={sameAsPerm}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label="PIN Code"
            name="corrPinCode"
            rules={
              sameAsPerm
                ? []
                : [
                    { required: true, message: 'Required' },
                    { pattern: /^[1-9][0-9]{5}$/, message: 'Invalid PIN' },
                  ]
            }
          >
            <Input maxLength={6} disabled={sameAsPerm} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Country" name="corrCountry">
            <Input disabled={sameAsPerm} />
          </Form.Item>
        </Col>
      </Row>

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" htmlType="submit">
          Next — Contact & Nominee
        </Button>
      </Space>
    </Form>
  );
}
