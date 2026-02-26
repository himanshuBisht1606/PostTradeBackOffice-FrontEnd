import { useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, DatePicker } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { createCorporateAction } from '../services/corporateActionService';
import type { CreateCorporateActionPayload } from '../services/corporateActionService';
import { getInstruments } from '@modules/master-setup/services/instrumentService';
import { CorporateActionType } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface CorporateActionFormModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = Omit<CreateCorporateActionPayload, 'recordDate' | 'effectiveDate'> & {
  recordDate: ReturnType<typeof dayjs>;
  effectiveDate: ReturnType<typeof dayjs>;
};

export function CorporateActionFormModal({ open, onClose }: CorporateActionFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const { data: instruments } = useQuery({
    queryKey: ['instruments', {}],
    queryFn: () => getInstruments({}),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CreateCorporateActionPayload = {
        ...values,
        recordDate: values.recordDate.format('YYYY-MM-DD'),
        effectiveDate: values.effectiveDate.format('YYYY-MM-DD'),
      };
      return createCorporateAction(payload);
    },
    onSuccess: () => {
      notifySuccess('Corporate action created');
      void queryClient.invalidateQueries({ queryKey: ['corporate-actions'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to create corporate action'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ recordDate: dayjs(), effectiveDate: dayjs().add(7, 'day') });
    }
  }, [open, form]);

  return (
    <Modal
      title="Create Corporate Action"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={580}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="instrumentId"
          label="Instrument"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            showSearch
            placeholder="Select instrument"
            optionFilterProp="label"
            options={(instruments ?? []).map((i) => ({
              label: `${i.symbol} — ${i.instrumentName}`,
              value: i.instrumentId,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="actionType"
          label="Action Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Dividend', value: CorporateActionType.Dividend },
              { label: 'Bonus', value: CorporateActionType.Bonus },
              { label: 'Split', value: CorporateActionType.Split },
              { label: 'Rights', value: CorporateActionType.Rights },
              { label: 'Merger', value: CorporateActionType.Merger },
              { label: 'Demerger', value: CorporateActionType.Demerger },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="recordDate"
          label="Record Date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="effectiveDate"
          label="Effective Date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="dividendPerShare" label="Dividend Per Share">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="e.g. 5.00" />
        </Form.Item>

        <Form.Item name="ratio" label="Ratio (Bonus / Split)">
          <InputNumber min={0} precision={4} style={{ width: '100%' }} placeholder="e.g. 1.5 (3:2 bonus)" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Optional notes" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
