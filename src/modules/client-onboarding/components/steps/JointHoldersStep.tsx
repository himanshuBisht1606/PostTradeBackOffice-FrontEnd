import { useState } from 'react';
import { Form, Input, DatePicker, Row, Col, Button, Space, Typography, Divider, Switch } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { JointHolderData } from '../../types/onboarding.types';

const { Text } = Typography;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface HolderFormValues {
  pan: string;
  firstName: string;
  lastName: string;
  dob: dayjs.Dayjs | null;
  relationship: string;
}

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

function holderFromSaved(saved: JointHolderData): HolderFormValues {
  return { ...saved, dob: saved.dob ? dayjs(saved.dob) : null };
}

export function JointHoldersStep({ onNext, onPrev }: Props) {
  const { jointHolders: saved, setJointHolders } = useOnboardingStore();

  const holder2Saved = saved.find((h) => h.holderNumber === 2);
  const holder3Saved = saved.find((h) => h.holderNumber === 3);

  const [form2] = Form.useForm<HolderFormValues>();
  const [form3] = Form.useForm<HolderFormValues>();
  const [showHolder3, setShowHolder3] = useState(!!holder3Saved);

  const handleSubmit = async () => {
    try {
      const v2 = await form2.validateFields();
      const result: JointHolderData[] = [
        {
          holderNumber: 2,
          pan: v2.pan.toUpperCase(),
          firstName: v2.firstName,
          lastName: v2.lastName,
          dob: v2.dob ? v2.dob.format('YYYY-MM-DD') : '',
          relationship: v2.relationship,
        },
      ];

      if (showHolder3) {
        const v3 = await form3.validateFields();
        result.push({
          holderNumber: 3,
          pan: v3.pan.toUpperCase(),
          firstName: v3.firstName,
          lastName: v3.lastName,
          dob: v3.dob ? v3.dob.format('YYYY-MM-DD') : '',
          relationship: v3.relationship,
        });
      }

      setJointHolders(result);
      onNext();
    } catch {
      // Validation failed — Ant Design shows inline errors
    }
  };

  const holderForm = (
    form: ReturnType<typeof Form.useForm<HolderFormValues>>[0],
    label: string,
    initialValues?: HolderFormValues,
    required = true,
  ) => (
    <Form form={form} layout="vertical" {...(initialValues ? { initialValues } : {})}>
      <Text strong style={{ display: 'block', marginBottom: 12, color: '#1d3557' }}>
        {label}
      </Text>
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item
            label="PAN"
            name="pan"
            normalize={(val: string) => (val ?? '').toUpperCase()}
            rules={
              required
                ? [
                    { required: true, message: 'Required' },
                    {
                      validator: (_, value: string) =>
                        PAN_REGEX.test((value ?? '').toUpperCase())
                          ? Promise.resolve()
                          : Promise.reject(new Error('Invalid PAN format')),
                    },
                  ]
                : []
            }
          >
            <Input placeholder="e.g. ABCDE1234F" maxLength={10} style={{ letterSpacing: 1 }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="First Name"
            name="firstName"
            rules={required ? [{ required: true, message: 'Required' }] : []}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Last Name"
            name="lastName"
            rules={required ? [{ required: true, message: 'Required' }] : []}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            label="Date of Birth"
            name="dob"
            rules={required ? [{ required: true, message: 'Required' }] : []}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD-MMM-YYYY"
              disabledDate={(d) => d.isAfter(dayjs())}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Relationship to Primary Holder"
            name="relationship"
            rules={required ? [{ required: true, message: 'Required' }] : []}
          >
            <Input placeholder="e.g. Spouse, Parent, Sibling" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );

  return (
    <div>
      {holderForm(
        form2,
        '2nd Holder Details (Required)',
        holder2Saved ? holderFromSaved(holder2Saved) : undefined,
        true,
      )}

      <Divider style={{ margin: '12px 0' }}>
        <Space>
          <UserAddOutlined />
          <Text type="secondary" style={{ fontSize: 13 }}>
            Add 3rd Holder
          </Text>
          <Switch
            size="small"
            checked={showHolder3}
            onChange={(checked) => {
              setShowHolder3(checked);
              if (!checked) form3.resetFields();
            }}
          />
        </Space>
      </Divider>

      {showHolder3 &&
        holderForm(
          form3,
          '3rd Holder Details (Optional)',
          holder3Saved ? holderFromSaved(holder3Saved) : undefined,
          true,
        )}

      <Space style={{ marginTop: 16 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" onClick={() => void handleSubmit()}>
          Next — Address
        </Button>
      </Space>
    </div>
  );
}
