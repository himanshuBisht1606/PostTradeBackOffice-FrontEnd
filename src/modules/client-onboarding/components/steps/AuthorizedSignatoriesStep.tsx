import { useState } from 'react';
import { Form, Input, Button, Space, Typography, Card, Divider, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { AuthorizedSignatoryData } from '../../types/onboarding.types';

const { Text } = Typography;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const DIN_REGEX = /^\d{8}$/;

const makeEmptySig = (): AuthorizedSignatoryData => ({
  name: '',
  designation: '',
  pan: '',
});

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function AuthorizedSignatoriesStep({ onNext, onPrev }: Props) {
  const { pan, authorizedSignatories: saved, setAuthorizedSignatories } = useOnboardingStore();
  const isCompany = pan?.clientType === 'Company';

  const [signatories, setSignatories] = useState<AuthorizedSignatoryData[]>(
    saved.length > 0 ? saved : [makeEmptySig()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateSignatory = (index: number, field: keyof AuthorizedSignatoryData, value: string) => {
    setSignatories((prev) =>
      prev.map((s, i): AuthorizedSignatoryData => {
        if (i !== index) return s;
        const next: AuthorizedSignatoryData = {
          name: field === 'name' ? value : s.name,
          designation: field === 'designation' ? value : s.designation,
          pan: field === 'pan' ? value : s.pan,
        };
        const dinVal = field === 'din' ? value : s.din;
        if (dinVal) next.din = dinVal;
        const mobileVal = field === 'mobile' ? value : s.mobile;
        if (mobileVal) next.mobile = mobileVal;
        const emailVal = field === 'email' ? value : s.email;
        if (emailVal) next.email = emailVal;
        return next;
      }),
    );
    // Clear error on change
    const key = `${index}.${field}`;
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const addSignatory = () => {
    if (signatories.length < 3) {
      setSignatories((prev) => [...prev, makeEmptySig()]);
    }
  };

  const removeSignatory = (index: number) => {
    setSignatories((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    signatories.forEach((s, i) => {
      if (!s.name.trim()) newErrors[`${i}.name`] = 'Required';
      if (!s.designation.trim()) newErrors[`${i}.designation`] = 'Required';
      if (!s.pan.trim()) {
        newErrors[`${i}.pan`] = 'Required';
      } else if (!PAN_REGEX.test(s.pan.trim().toUpperCase())) {
        newErrors[`${i}.pan`] = 'Invalid PAN format (e.g. ABCDE1234F)';
      }
      if (isCompany && s.din && !DIN_REGEX.test(s.din.trim())) {
        newErrors[`${i}.din`] = 'DIN must be 8 digits';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const cleaned = signatories.map((s) => {
      const out: AuthorizedSignatoryData = {
        name: s.name.trim(),
        designation: s.designation.trim(),
        pan: s.pan.trim().toUpperCase(),
      };
      if (isCompany && s.din) out.din = s.din.trim();
      if (s.mobile) out.mobile = s.mobile.trim();
      if (s.email) out.email = s.email.trim();
      return out;
    });
    setAuthorizedSignatories(cleaned);
    onNext();
  };

  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 16, color: '#1d3557' }}>
        Authorized Signatories (at least 1 required, max 3)
      </Text>

      {signatories.map((sig, index) => (
        <Card
          key={index}
          size="small"
          style={{ marginBottom: 16 }}
          title={<Text strong>Signatory {index + 1}</Text>}
          extra={
            index > 0 && (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeSignatory(index)}
              >
                Remove
              </Button>
            )
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Full Name"
                required
                validateStatus={errors[`${index}.name`] ? 'error' : ''}
                help={errors[`${index}.name`]}
              >
                <Input
                  value={sig.name}
                  onChange={(e) => updateSignatory(index, 'name', e.target.value)}
                  placeholder="Full legal name"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Designation"
                required
                validateStatus={errors[`${index}.designation`] ? 'error' : ''}
                help={errors[`${index}.designation`]}
              >
                <Input
                  value={sig.designation}
                  onChange={(e) => updateSignatory(index, 'designation', e.target.value)}
                  placeholder="e.g. Director, Trustee, Partner"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={isCompany ? 8 : 12}>
              <Form.Item
                label="PAN"
                required
                validateStatus={errors[`${index}.pan`] ? 'error' : ''}
                help={errors[`${index}.pan`]}
              >
                <Input
                  value={sig.pan}
                  onChange={(e) => updateSignatory(index, 'pan', e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="AAAAA9999A"
                />
              </Form.Item>
            </Col>

            {isCompany && (
              <Col span={8}>
                <Form.Item
                  label="DIN (Director Identification No.)"
                  validateStatus={errors[`${index}.din`] ? 'error' : ''}
                  help={errors[`${index}.din`]}
                >
                  <Input
                    value={sig.din ?? ''}
                    onChange={(e) => updateSignatory(index, 'din', e.target.value)}
                    maxLength={8}
                    placeholder="8-digit DIN (optional)"
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={isCompany ? 8 : 12}>
              <Form.Item label="Mobile (optional)">
                <Input
                  value={sig.mobile ?? ''}
                  onChange={(e) => updateSignatory(index, 'mobile', e.target.value)}
                  maxLength={10}
                  placeholder="10-digit mobile"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Email (optional)">
                <Input
                  value={sig.email ?? ''}
                  onChange={(e) => updateSignatory(index, 'email', e.target.value)}
                  placeholder="email@example.com"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}

      {signatories.length < 3 && (
        <>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Button
            icon={<PlusOutlined />}
            onClick={addSignatory}
            style={{ marginBottom: 24 }}
          >
            Add Signatory
          </Button>
        </>
      )}

      <Space style={{ marginTop: 8 }}>
        <Button onClick={onPrev}>Back</Button>
        <Button type="primary" onClick={handleSubmit}>
          Next — Address
        </Button>
      </Space>
    </div>
  );
}
