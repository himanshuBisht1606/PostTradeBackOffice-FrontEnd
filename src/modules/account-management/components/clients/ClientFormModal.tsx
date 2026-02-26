import { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createClient, updateClient } from '../../services/clientService';
import type { ClientSummary, CreateClientPayload } from '../../services/clientService';
import { getBrokers } from '../../services/brokerService';
import { ClientType, EntityStatus } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: ClientSummary | undefined;
}

export function ClientFormModal({ open, onClose, initialData }: ClientFormModalProps) {
  const [form] = Form.useForm<CreateClientPayload & { status?: EntityStatus }>();
  const queryClient = useQueryClient();

  const { data: brokers } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => getBrokers({}),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateClientPayload & { status?: EntityStatus }) => {
      if (initialData) {
        return updateClient(initialData.clientId, values);
      }
      return createClient(values);
    },
    onSuccess: () => {
      notifySuccess(initialData ? 'Client updated' : 'Client created');
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to save client'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialData) {
        form.setFieldsValue({
          clientName: initialData.clientName,
          clientCode: initialData.clientCode,
          clientType: initialData.clientType,
          email: initialData.email,
          phone: initialData.phone,
          brokerId: initialData.brokerId,
          pan: initialData.pan ?? undefined,
          address: initialData.address ?? undefined,
          bankAccountNo: initialData.bankAccountNo ?? undefined,
          bankName: initialData.bankName ?? undefined,
          status: initialData.status,
        });
      }
    }
  }, [open, initialData, form]);

  return (
    <Modal
      title={initialData ? 'Edit Client' : 'Add Client'}
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
          name="clientName"
          label="Client Name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. Acme Investments Pvt Ltd" />
        </Form.Item>

        <Form.Item
          name="clientCode"
          label="Client Code"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. CLI001" disabled={!!initialData} />
        </Form.Item>

        <Form.Item
          name="clientType"
          label="Client Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Individual', value: ClientType.Individual },
              { label: 'Corporate', value: ClientType.Corporate },
              { label: 'FII', value: ClientType.FII },
              { label: 'DII', value: ClientType.DII },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="brokerId"
          label="Broker"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            showSearch
            placeholder="Select broker"
            optionFilterProp="label"
            options={(brokers ?? []).map((b) => ({
              label: `${b.brokerCode} — ${b.brokerName}`,
              value: b.brokerId,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
        >
          <Input placeholder="client@example.com" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="+91-9XXXXXXXXX" />
        </Form.Item>

        <Form.Item name="pan" label="PAN">
          <Input placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item name="bankAccountNo" label="Bank Account No">
          <Input placeholder="Account number" />
        </Form.Item>

        <Form.Item name="bankName" label="Bank Name">
          <Input placeholder="e.g. HDFC Bank" />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input.TextArea rows={2} placeholder="Full address" />
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
