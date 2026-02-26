import { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBroker, updateBroker } from '../../services/brokerService';
import type { BrokerSummary, CreateBrokerPayload } from '../../services/brokerService';
import { EntityStatus } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface BrokerFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: BrokerSummary | undefined;
}

export function BrokerFormModal({ open, onClose, initialData }: BrokerFormModalProps) {
  const [form] = Form.useForm<CreateBrokerPayload & { status?: EntityStatus }>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: CreateBrokerPayload & { status?: EntityStatus }) => {
      if (initialData) {
        return updateBroker(initialData.brokerId, values);
      }
      return createBroker(values);
    },
    onSuccess: () => {
      notifySuccess(initialData ? 'Broker updated' : 'Broker created');
      void queryClient.invalidateQueries({ queryKey: ['brokers'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to save broker'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialData) {
        form.setFieldsValue({
          brokerName: initialData.brokerName,
          brokerCode: initialData.brokerCode,
          contactEmail: initialData.contactEmail,
          contactPhone: initialData.contactPhone,
          sebiRegistrationNo: initialData.sebiRegistrationNo ?? undefined,
          address: initialData.address ?? undefined,
          pan: initialData.pan ?? undefined,
          gst: initialData.gst ?? undefined,
          status: initialData.status,
        });
      }
    }
  }, [open, initialData, form]);

  return (
    <Modal
      title={initialData ? 'Edit Broker' : 'Add Broker'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="brokerName"
          label="Broker Name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. Zerodha Securities Ltd" />
        </Form.Item>

        <Form.Item
          name="brokerCode"
          label="Broker Code"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. BRK001" disabled={!!initialData} />
        </Form.Item>

        <Form.Item
          name="contactEmail"
          label="Contact Email"
          rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
        >
          <Input placeholder="ops@broker.com" />
        </Form.Item>

        <Form.Item
          name="contactPhone"
          label="Contact Phone"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="+91-9XXXXXXXXX" />
        </Form.Item>

        <Form.Item name="sebiRegistrationNo" label="SEBI Registration No">
          <Input placeholder="INZ000XXXXXX" />
        </Form.Item>

        <Form.Item name="pan" label="PAN">
          <Input placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item name="gst" label="GST No">
          <Input placeholder="22AAAAA0000A1Z5" />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input.TextArea rows={2} placeholder="Registered address" />
        </Form.Item>

        {initialData && (
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { label: 'Active', value: EntityStatus.Active },
                { label: 'Inactive', value: EntityStatus.Inactive },
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
