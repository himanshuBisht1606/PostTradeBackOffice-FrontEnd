import { useEffect } from 'react';
import { Modal, Form, Input, Switch } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createExchange, updateExchange } from '../../services/exchangeService';
import type { Exchange, CreateExchangePayload } from '../../services/exchangeService';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface ExchangeFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Exchange | undefined;
}

export function ExchangeFormModal({ open, onClose, initialData }: ExchangeFormModalProps) {
  const [form] = Form.useForm<CreateExchangePayload>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: CreateExchangePayload) => {
      if (initialData) {
        return updateExchange(initialData.exchangeId, values);
      }
      return createExchange(values);
    },
    onSuccess: () => {
      notifySuccess(initialData ? 'Exchange updated' : 'Exchange created');
      void queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to save exchange'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialData) {
        form.setFieldsValue({
          exchangeCode: initialData.exchangeCode,
          exchangeName: initialData.exchangeName,
          country: initialData.country,
          currency: initialData.currency,
          isActive: initialData.isActive,
        });
      } else {
        form.setFieldsValue({ isActive: true });
      }
    }
  }, [open, initialData, form]);

  return (
    <Modal
      title={initialData ? 'Edit Exchange' : 'Add Exchange'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="exchangeCode"
          label="Exchange Code"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. NSE" disabled={!!initialData} style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item
          name="exchangeName"
          label="Exchange Name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. National Stock Exchange" />
        </Form.Item>

        <Form.Item
          name="country"
          label="Country"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. India" />
        </Form.Item>

        <Form.Item
          name="currency"
          label="Currency"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. INR" maxLength={3} style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
