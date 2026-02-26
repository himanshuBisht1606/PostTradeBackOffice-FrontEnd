import { useEffect } from 'react';
import { Modal, Form, Select, Input, DatePicker } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { runReconciliation } from '../services/reconciliationService';
import type { RunReconPayload } from '../services/reconciliationService';
import { ReconType } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

interface RunReconModalProps {
  open: boolean;
  onClose: () => void;
}

type FormValues = Omit<RunReconPayload, 'reconDate'> & {
  reconDate: ReturnType<typeof dayjs>;
};

export function RunReconModal({ open, onClose }: RunReconModalProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: RunReconPayload = {
        ...values,
        reconDate: values.reconDate.format('YYYY-MM-DD'),
      };
      return runReconciliation(payload);
    },
    onSuccess: () => {
      notifySuccess('Reconciliation job triggered');
      void queryClient.invalidateQueries({ queryKey: ['recon-records'] });
      void queryClient.invalidateQueries({ queryKey: ['recon-stats'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to trigger reconciliation'),
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ reconDate: dayjs() });
    }
  }, [open, form]);

  return (
    <Modal
      title="Run Reconciliation"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={460}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="reconDate"
          label="Reconciliation Date"
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="reconType"
          label="Recon Type"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            options={[
              { label: 'Trade', value: ReconType.Trade },
              { label: 'Position', value: ReconType.Position },
              { label: 'Obligation', value: ReconType.Obligation },
              { label: 'Funds', value: ReconType.Funds },
              { label: 'Securities', value: ReconType.Securities },
            ]}
          />
        </Form.Item>

        <Form.Item name="settlementNo" label="Settlement No (optional)">
          <Input placeholder="Filter to specific settlement" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
