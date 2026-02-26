import { useEffect } from 'react';
import { Modal, Form, Select, InputNumber, DatePicker } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { bookTrade } from '../../services/tradeService';
import type { BookTradePayload } from '../../services/tradeService';
import { getClients } from '@modules/account-management/services/clientService';
import { getBrokers } from '@modules/account-management/services/brokerService';
import { getInstruments } from '@modules/master-setup/services/instrumentService';
import { TradeSide, TradeSource } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface BookTradeModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = Omit<BookTradePayload, 'tradeDate'> & { tradeDate: ReturnType<typeof dayjs> };

export function BookTradeModal({ open, onClose }: BookTradeModalProps) {
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
  const { data: instruments } = useQuery({
    queryKey: ['instruments', {}],
    queryFn: () => getInstruments({}),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: BookTradePayload = {
        ...values,
        tradeDate: values.tradeDate.format('YYYY-MM-DD'),
      };
      return bookTrade(payload);
    },
    onSuccess: () => {
      notifySuccess('Trade booked successfully');
      void queryClient.invalidateQueries({ queryKey: ['trades'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to book trade'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ tradeDate: dayjs(), source: TradeSource.Manual });
    }
  }, [open, form]);

  return (
    <Modal
      title="Book Trade"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={620}
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
          name="side"
          label="Side"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Buy', value: TradeSide.Buy },
              { label: 'Sell', value: TradeSide.Sell },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 100" />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price"
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber min={0.01} precision={2} style={{ width: '100%' }} placeholder="e.g. 1500.50" />
        </Form.Item>

        <Form.Item
          name="tradeDate"
          label="Trade Date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="source" label="Source">
          <Select
            options={[
              { label: 'Manual', value: TradeSource.Manual },
              { label: 'API', value: TradeSource.API },
              { label: 'File Upload', value: TradeSource.FileUpload },
              { label: 'Exchange', value: TradeSource.Exchange },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
