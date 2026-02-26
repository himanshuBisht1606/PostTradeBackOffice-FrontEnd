import { useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Input, DatePicker } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { postLedgerEntry } from '../../services/ledgerService';
import type { PostLedgerEntryPayload } from '../../services/ledgerService';
import { getClients } from '@modules/account-management/services/clientService';
import { getBrokers } from '@modules/account-management/services/brokerService';
import { LedgerType, EntryType } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface PostLedgerEntryModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = Omit<PostLedgerEntryPayload, 'postingDate' | 'valueDate'> & {
  postingDate: ReturnType<typeof dayjs>;
  valueDate: ReturnType<typeof dayjs>;
};

export function PostLedgerEntryModal({ open, onClose }: PostLedgerEntryModalProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ['clients', {}],
    queryFn: () => getClients({}),
    staleTime: 60_000,
  });
  const { data: brokers } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => getBrokers({}),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: PostLedgerEntryPayload = {
        ...values,
        postingDate: values.postingDate.format('YYYY-MM-DD'),
        valueDate: values.valueDate.format('YYYY-MM-DD'),
      };
      return postLedgerEntry(payload);
    },
    onSuccess: () => {
      notifySuccess('Ledger entry posted');
      void queryClient.invalidateQueries({ queryKey: ['ledger'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to post ledger entry'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ postingDate: dayjs(), valueDate: dayjs(), debit: 0, credit: 0 });
    }
  }, [open, form]);

  return (
    <Modal
      title="Post Ledger Entry"
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
          name="clientId"
          label="Client"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            showSearch
            placeholder="Select client"
            optionFilterProp="label"
            options={(clients ?? []).map((c) => ({
              label: `${c.clientCode} — ${c.clientName}`,
              value: c.clientId,
            }))}
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
          name="ledgerType"
          label="Ledger Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Client Ledger', value: LedgerType.ClientLedger },
              { label: 'Broker Ledger', value: LedgerType.BrokerLedger },
              { label: 'Cash Ledger', value: LedgerType.CashLedger },
              { label: 'Securities Ledger', value: LedgerType.SecuritiesLedger },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="entryType"
          label="Entry Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Payment', value: EntryType.Payment },
              { label: 'Receipt', value: EntryType.Receipt },
              { label: 'Adjustment', value: EntryType.Adjustment },
              { label: 'Trade', value: EntryType.Trade },
              { label: 'Charges', value: EntryType.Charges },
              { label: 'Corporate Action', value: EntryType.CorporateAction },
            ]}
          />
        </Form.Item>

        <Form.Item name="debit" label="Debit Amount" rules={[{ required: true, message: 'Required' }]}>
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>

        <Form.Item name="credit" label="Credit Amount" rules={[{ required: true, message: 'Required' }]}>
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>

        <Form.Item
          name="postingDate"
          label="Posting Date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="valueDate"
          label="Value Date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="referenceType"
          label="Reference Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. TRADE, PAYMENT" />
        </Form.Item>

        <Form.Item
          name="referenceId"
          label="Reference ID"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. Trade ID or Payment Ref" />
        </Form.Item>

        <Form.Item name="narration" label="Narration">
          <Input.TextArea rows={2} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
