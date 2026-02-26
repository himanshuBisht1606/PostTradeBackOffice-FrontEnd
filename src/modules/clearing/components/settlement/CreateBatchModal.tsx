import { useEffect } from 'react';
import { Modal, Form, Input, DatePicker } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import dayjs from 'dayjs';
import { createSettlementBatch } from '../../services/settlementService';
import type { CreateBatchPayload } from '../../services/settlementService';
import { getExchanges } from '@modules/master-setup/services/exchangeService';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface CreateBatchModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = Omit<CreateBatchPayload, 'tradeDate' | 'settlementDate'> & {
  tradeDate: ReturnType<typeof dayjs>;
  settlementDate: ReturnType<typeof dayjs>;
};

export function CreateBatchModal({ open, onClose }: CreateBatchModalProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const { data: exchanges } = useQuery({
    queryKey: ['exchanges'],
    queryFn: getExchanges,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CreateBatchPayload = {
        ...values,
        tradeDate: values.tradeDate.format('YYYY-MM-DD'),
        settlementDate: values.settlementDate.format('YYYY-MM-DD'),
      };
      return createSettlementBatch(payload);
    },
    onSuccess: () => {
      notifySuccess('Settlement batch created');
      void queryClient.invalidateQueries({ queryKey: ['settlement-batches'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to create batch'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ tradeDate: dayjs(), settlementDate: dayjs().add(2, 'day') });
    }
  }, [open, form]);

  return (
    <Modal
      title="Create Settlement Batch"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="exchangeId"
          label="Exchange"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            showSearch
            placeholder="Select exchange"
            optionFilterProp="label"
            options={(exchanges ?? []).map((e) => ({
              label: `${e.exchangeCode} — ${e.exchangeName}`,
              value: e.exchangeId,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="tradeDate"
          label="Trade Date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="settlementDate"
          label="Settlement Date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="settlementNo" label="Settlement No (optional)">
          <Input placeholder="Auto-generated if blank" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
