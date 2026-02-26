import { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Switch } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { createChargeConfig } from '../../services/chargesService';
import type { CreateChargePayload } from '../../services/chargesService';
import { ChargeType, CalculationType } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface ChargeConfigFormModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = Omit<CreateChargePayload, 'effectiveFrom' | 'effectiveTo'> & {
  effectiveFrom: ReturnType<typeof dayjs>;
  effectiveTo?: ReturnType<typeof dayjs> | undefined;
};

export function ChargeConfigFormModal({ open, onClose }: ChargeConfigFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CreateChargePayload = {
        ...values,
        effectiveFrom: values.effectiveFrom.format('YYYY-MM-DD'),
        effectiveTo: values.effectiveTo?.format('YYYY-MM-DD'),
      };
      return createChargeConfig(payload);
    },
    onSuccess: () => {
      notifySuccess('Charge configuration added');
      void queryClient.invalidateQueries({ queryKey: ['charges-config'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to create charge config'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ effectiveFrom: dayjs(), isActive: true });
    }
  }, [open, form]);

  return (
    <Modal
      title="Add Charge Configuration"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="chargeName"
          label="Charge Name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. Standard Brokerage" />
        </Form.Item>

        <Form.Item
          name="chargeType"
          label="Charge Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Brokerage', value: ChargeType.Brokerage },
              { label: 'STT', value: ChargeType.STT },
              { label: 'GST', value: ChargeType.GST },
              { label: 'Exchange Txn', value: ChargeType.ExchangeTxn },
              { label: 'SEBI', value: ChargeType.SEBI },
              { label: 'Stamp Duty', value: ChargeType.StampDuty },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="calculationType"
          label="Calculation Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Percentage', value: CalculationType.Percentage },
              { label: 'Flat', value: CalculationType.Flat },
              { label: 'Slab', value: CalculationType.Slab },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="rate"
          label="Rate"
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber min={0} precision={4} style={{ width: '100%' }} placeholder="e.g. 0.0005" />
        </Form.Item>

        <Form.Item name="minAmount" label="Min Amount">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="Optional" />
        </Form.Item>

        <Form.Item name="maxAmount" label="Max Amount">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="Optional" />
        </Form.Item>

        <Form.Item
          name="effectiveFrom"
          label="Effective From"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="effectiveTo" label="Effective To (optional)">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
