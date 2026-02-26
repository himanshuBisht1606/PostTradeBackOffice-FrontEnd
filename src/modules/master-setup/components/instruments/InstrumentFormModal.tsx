import { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker } from 'antd';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { createInstrument, updateInstrument } from '../../services/instrumentService';
import type { Instrument, CreateInstrumentPayload } from '../../services/instrumentService';
import { getExchanges } from '../../services/exchangeService';
import { InstrumentType, OptionType, InstrumentStatus } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface InstrumentFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: Instrument | undefined;
}

type FormValues = Omit<CreateInstrumentPayload, 'expiryDate'> & {
  expiryDate?: ReturnType<typeof dayjs> | undefined;
  status?: InstrumentStatus | undefined;
};

export function InstrumentFormModal({ open, onClose, initialData }: InstrumentFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const { data: exchanges } = useQuery({
    queryKey: ['exchanges'],
    queryFn: getExchanges,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CreateInstrumentPayload = {
        ...values,
        expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
      };
      if (initialData) {
        return updateInstrument(initialData.instrumentId, { ...payload, status: values.status });
      }
      return createInstrument(payload);
    },
    onSuccess: () => {
      notifySuccess(initialData ? 'Instrument updated' : 'Instrument created');
      void queryClient.invalidateQueries({ queryKey: ['instruments'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to save instrument'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialData) {
        form.setFieldsValue({
          isin: initialData.isin,
          symbol: initialData.symbol,
          instrumentName: initialData.instrumentName,
          instrumentType: initialData.instrumentType,
          exchangeId: initialData.exchangeId,
          lotSize: initialData.lotSize,
          tickSize: initialData.tickSize,
          currency: initialData.currency,
          segmentId: initialData.segmentId ?? undefined,
          expiryDate: initialData.expiryDate ? dayjs(initialData.expiryDate) : undefined,
          strikePrice: initialData.strikePrice ?? undefined,
          optionType: initialData.optionType ?? undefined,
          status: initialData.status,
        });
      } else {
        form.setFieldsValue({ lotSize: 1, tickSize: 0.05, currency: 'INR' });
      }
    }
  }, [open, initialData, form]);

  return (
    <Modal
      title={initialData ? 'Edit Instrument' : 'Add Instrument'}
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
          name="symbol"
          label="Symbol"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. RELIANCE" style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item
          name="instrumentName"
          label="Instrument Name"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. Reliance Industries Ltd" />
        </Form.Item>

        <Form.Item
          name="isin"
          label="ISIN"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. INE002A01018" maxLength={12} />
        </Form.Item>

        <Form.Item
          name="instrumentType"
          label="Instrument Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Equity', value: InstrumentType.Equity },
              { label: 'Derivative', value: InstrumentType.Derivative },
              { label: 'Future', value: InstrumentType.Future },
              { label: 'Option', value: InstrumentType.Option },
              { label: 'Currency', value: InstrumentType.Currency },
              { label: 'Commodity', value: InstrumentType.Commodity },
            ]}
          />
        </Form.Item>

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
          name="currency"
          label="Currency"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input placeholder="e.g. INR" maxLength={3} style={{ textTransform: 'uppercase' }} />
        </Form.Item>

        <Form.Item
          name="lotSize"
          label="Lot Size"
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="tickSize"
          label="Tick Size"
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber min={0.0001} precision={4} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="expiryDate" label="Expiry Date (derivatives)">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="strikePrice" label="Strike Price (options)">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>

        <Form.Item name="optionType" label="Option Type">
          <Select
            allowClear
            placeholder="Call / Put"
            options={[
              { label: 'Call', value: OptionType.Call },
              { label: 'Put', value: OptionType.Put },
            ]}
          />
        </Form.Item>

        {initialData && (
          <Form.Item name="status" label="Status">
            <Select
              options={[
                { label: 'Active', value: InstrumentStatus.Active },
                { label: 'Suspended', value: InstrumentStatus.Suspended },
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
