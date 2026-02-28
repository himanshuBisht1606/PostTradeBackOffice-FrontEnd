import { useState, useEffect, useMemo } from 'react';
import { Form, Input, Select, Row, Col, Button, Space, Typography, Divider, Checkbox, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { AddressData } from '../../types/onboarding.types';
import { getStates } from '../../../master-setup/services/stateMasterService';
import { getPinCodeByCode } from '../../../master-setup/services/pinCodeService';

const { Text } = Typography;

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function AddressStep({ onNext, onPrev }: Props) {
  const [form] = Form.useForm<AddressData>();
  const { address: saved, setAddress } = useOnboardingStore();
  const [sameAsPerm, setSameAsPerm] = useState<boolean>(saved?.sameAsPermanent ?? false);

  // Tracked PIN values that trigger the lookup queries
  const [permPin, setPermPin] = useState<string>('');
  const [corrPin, setCorrPin] = useState<string>('');

  // Load state master
  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
    staleTime: 30 * 60 * 1000,
  });

  // stateCode (e.g. "MH") → stateName (e.g. "Maharashtra") map for PIN auto-fill
  const stateCodeMap = useMemo(
    () => new Map(states.map((s) => [s.stateCode, s.stateName])),
    [states],
  );

  const stateOptions = useMemo(
    () =>
      states
        .filter((s) => s.isActive)
        .map((s) => ({ value: s.stateName, label: s.stateName })),
    [states],
  );

  // PIN code lookups — fires when the user types a full 6-digit PIN
  const { data: permPinData, isFetching: permPinFetching } = useQuery({
    queryKey: ['pinCode', permPin],
    queryFn: () => getPinCodeByCode(permPin),
    enabled: permPin.length === 6,
    staleTime: 60 * 60 * 1000,
  });

  const { data: corrPinData, isFetching: corrPinFetching } = useQuery({
    queryKey: ['pinCode', corrPin],
    queryFn: () => getPinCodeByCode(corrPin),
    enabled: corrPin.length === 6 && !sameAsPerm,
    staleTime: 60 * 60 * 1000,
  });

  // Auto-fill permanent city + state when lookup resolves
  useEffect(() => {
    if (!permPinData) return;
    const stateName = stateCodeMap.get(permPinData.stateCode) ?? '';
    const city = permPinData.city ?? permPinData.district ?? '';
    const fields: Partial<AddressData> = {};
    if (city) fields.permanentCity = city;
    if (stateName) fields.permanentState = stateName;
    if (Object.keys(fields).length) form.setFieldsValue(fields);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permPinData]);

  // Auto-fill correspondence city + state when lookup resolves
  useEffect(() => {
    if (!corrPinData || sameAsPerm) return;
    const stateName = stateCodeMap.get(corrPinData.stateCode) ?? '';
    const city = corrPinData.city ?? corrPinData.district ?? '';
    const fields: Partial<AddressData> = {};
    if (city) fields.corrCity = city;
    if (stateName) fields.corrState = stateName;
    if (Object.keys(fields).length) form.setFieldsValue(fields);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corrPinData]);

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

  const initialValues: Partial<AddressData> = saved ?? {
    permanentCountry: 'India',
    corrCountry: 'India',
  };

  const pinLabel = (fetching: boolean, label: string) => (
    <span>
      {label}
      {fetching && <Spin size="small" style={{ marginLeft: 6 }} />}
      {fetching && (
        <span style={{ color: '#888', fontSize: 11, marginLeft: 4 }}>looking up…</span>
      )}
    </span>
  );

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish}>
      {/* ── Permanent Address ─────────────────────────────────────────── */}
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
        <Col span={4}>
          <Form.Item
            label={pinLabel(permPinFetching, 'PIN Code')}
            name="permanentPinCode"
            rules={[
              { required: true, message: 'Required' },
              { pattern: /^[1-9][0-9]{5}$/, message: 'Invalid PIN' },
            ]}
          >
            <Input
              maxLength={6}
              placeholder="6-digit PIN"
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setPermPin(digits.length === 6 ? digits : '');
              }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="City"
            name="permanentCity"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="Auto-filled from PIN or enter manually" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="State"
            name="permanentState"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              showSearch
              loading={statesLoading}
              placeholder={statesLoading ? 'Loading states…' : 'Select state'}
              options={stateOptions}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Country" name="permanentCountry">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '4px 0 16px' }} />

      {/* ── Correspondence Address ────────────────────────────────────── */}
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
        <Col span={4}>
          <Form.Item
            label={pinLabel(!sameAsPerm && corrPinFetching, 'PIN Code')}
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
            <Input
              maxLength={6}
              placeholder="6-digit PIN"
              disabled={sameAsPerm}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setCorrPin(digits.length === 6 ? digits : '');
              }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="City"
            name="corrCity"
            rules={sameAsPerm ? [] : [{ required: true, message: 'Required' }]}
          >
            <Input disabled={sameAsPerm} placeholder="Auto-filled from PIN or enter manually" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="State"
            name="corrState"
            rules={sameAsPerm ? [] : [{ required: true, message: 'Required' }]}
          >
            <Select
              showSearch
              loading={statesLoading}
              placeholder="Select state"
              options={stateOptions}
              disabled={sameAsPerm}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
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
