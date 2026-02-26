import { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createSegment, updateSegment } from '../../services/segmentService';
import type { Segment, CreateSegmentPayload } from '../../services/segmentService';
import { getExchanges } from '../../services/exchangeService';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface SegmentFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Segment | undefined;
}

export function SegmentFormModal({ open, onClose, initialData }: SegmentFormModalProps) {
  const [form] = Form.useForm<CreateSegmentPayload>();
  const queryClient = useQueryClient();

  const { data: exchanges } = useQuery({
    queryKey: ['exchanges'],
    queryFn: getExchanges,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateSegmentPayload) => {
      if (initialData) {
        return updateSegment(initialData.segmentId, values);
      }
      return createSegment(values);
    },
    onSuccess: () => {
      notifySuccess(initialData ? 'Segment updated' : 'Segment created');
      void queryClient.invalidateQueries({ queryKey: ['segments'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to save segment'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialData) {
        form.setFieldsValue({
          segmentCode: initialData.segmentCode,
          segmentName: initialData.segmentName,
          exchangeId: initialData.exchangeId,
          isActive: initialData.isActive,
        });
      } else {
        form.setFieldsValue({ isActive: true });
      }
    }
  }, [open, initialData, form]);

  return (
    <Modal
      title={initialData ? 'Edit Segment' : 'Add Segment'}
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
          name="segmentCode"
          label="Segment Code"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. EQ" disabled={!!initialData} style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item
          name="segmentName"
          label="Segment Name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. Equity Cash" />
        </Form.Item>

        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
