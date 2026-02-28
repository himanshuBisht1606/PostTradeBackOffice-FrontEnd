import { useState } from 'react';
import {
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Divider,
  Space,
  Popconfirm,
  message,
  Tag,
  Typography,
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { useBrokerDetail } from '../../hooks/useBrokers';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission } from '@app-types/roles.types';
import { BrokerStatus } from '@app-types/enums';
import { updateBroker, changeBrokerStatus } from '../../services/brokerService';
import type { UpdateBrokerPayload, BrokerSummary } from '../../services/brokerService';

const { Text } = Typography;

const STATUS_OPTIONS = [
  { value: BrokerStatus.Active, label: 'Active' },
  { value: BrokerStatus.Inactive, label: 'Inactive' },
  { value: BrokerStatus.Suspended, label: 'Suspended' },
];

const STATUS_COLORS: Record<BrokerStatus, string> = {
  [BrokerStatus.Active]: 'green',
  [BrokerStatus.Inactive]: 'default',
  [BrokerStatus.Suspended]: 'orange',
};

interface EditFormValues {
  brokerName: string;
  contactEmail: string;
  contactPhone: string;
  sebiRegistrationNo?: string;
  address?: string;
  pan?: string;
  gst?: string;
}

interface BrokerDrawerProps {
  brokerId: string | null;
  onClose: () => void;
}

export function BrokerDrawer({ brokerId, onClose }: BrokerDrawerProps) {
  const qc = useQueryClient();
  const { data: broker, isLoading } = useBrokerDetail(brokerId);
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));

  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<EditFormValues>();
  const [pendingStatus, setPendingStatus] = useState<BrokerStatus | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['brokers'] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateBrokerPayload) => {
      if (!brokerId) return Promise.reject(new Error('No broker selected'));
      return updateBroker(brokerId, payload);
    },
    onSuccess: (updated) => {
      void qc.setQueryData(['brokers', brokerId], updated);
      invalidate();
      setEditOpen(false);
      void message.success('Broker updated');
    },
    onError: () => void message.error('Failed to update broker'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: BrokerStatus) => {
      if (!brokerId) return Promise.reject(new Error('No broker selected'));
      return changeBrokerStatus(brokerId, status);
    },
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({ queryKey: ['brokers', brokerId] });
      void message.success('Status updated');
      setPendingStatus(null);
    },
    onError: () => void message.error('Failed to update status'),
  });

  const openEdit = (b: BrokerSummary) => {
    const vals: EditFormValues = {
      brokerName: b.brokerName,
      contactEmail: b.contactEmail,
      contactPhone: b.contactPhone,
    };
    if (b.sebiRegistrationNo) vals.sebiRegistrationNo = b.sebiRegistrationNo;
    if (b.address) vals.address = b.address;
    if (b.pan) vals.pan = b.pan;
    if (b.gst) vals.gst = b.gst;
    editForm.setFieldsValue(vals);
    setEditOpen(true);
  };

  const handleEditSubmit = (values: EditFormValues) => {
    if (!broker) return;
    const payload: UpdateBrokerPayload = {
      brokerName: values.brokerName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      status: broker.status,
    };
    if (values.sebiRegistrationNo !== undefined) payload.sebiRegistrationNo = values.sebiRegistrationNo;
    if (values.address !== undefined) payload.address = values.address;
    if (values.pan !== undefined) payload.pan = values.pan;
    if (values.gst !== undefined) payload.gst = values.gst;
    updateMutation.mutate(payload);
  };

  return (
    <>
      <SlideDrawer
        title={
          <Space>
            <span>{broker?.brokerName ?? 'Broker Detail'}</span>
            {broker && (
              <Tag color={STATUS_COLORS[broker.status]} style={{ marginLeft: 4 }}>
                {broker.status}
              </Tag>
            )}
          </Space>
        }
        open={!!brokerId}
        onClose={onClose}
        isLoading={isLoading}
        extra={
          broker && (
            <Button icon={<EditOutlined />} onClick={() => openEdit(broker)}>
              Edit
            </Button>
          )
        }
      >
        {broker && (
          <div style={{ padding: '0 24px' }}>
            {/* Status change bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e9ecef',
              }}
            >
              <Text strong style={{ minWidth: 56 }}>Status</Text>
              <StatusBadge status={broker.status} />
              <Select
                value={pendingStatus ?? broker.status}
                options={STATUS_OPTIONS}
                style={{ width: 140 }}
                onChange={(v) => setPendingStatus(v)}
              />
              {pendingStatus && pendingStatus !== broker.status && (
                <>
                  {pendingStatus === BrokerStatus.Suspended ? (
                    <Popconfirm
                      title={`Change status to "Suspended"?`}
                      description="This may affect broker operations. Confirm?"
                      onConfirm={() => statusMutation.mutate(pendingStatus)}
                      onCancel={() => setPendingStatus(null)}
                      okText="Confirm"
                      okButtonProps={{ danger: true }}
                    >
                      <Button size="small" danger loading={statusMutation.isPending}>
                        Apply
                      </Button>
                    </Popconfirm>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      loading={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(pendingStatus)}
                    >
                      Apply
                    </Button>
                  )}
                  <Button size="small" onClick={() => setPendingStatus(null)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Broker Code">
                <span style={{ fontFamily: 'monospace' }}>{broker.brokerCode}</span>
              </Descriptions.Item>
              <Descriptions.Item label="SEBI Reg No">{broker.sebiRegistrationNo ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>{broker.brokerName}</Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>{broker.contactEmail}</Descriptions.Item>
              <Descriptions.Item label="Phone">{broker.contactPhone}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered column={1} size="small" style={{ marginTop: 12 }} title="Address">
              <Descriptions.Item label="Address">{broker.address ?? '—'}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered column={2} size="small" style={{ marginTop: 12 }} title="Tax & Compliance">
              <Descriptions.Item label="PAN">
                {canViewSensitive ? (broker.pan ?? '—') : <MaskedField />}
              </Descriptions.Item>
              <Descriptions.Item label="GST">
                {canViewSensitive ? (broker.gst ?? '—') : <MaskedField />}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </SlideDrawer>

      {/* Edit Modal */}
      <Modal
        title={`Edit Broker — ${broker?.brokerCode ?? ''}`}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: 8 }}
        >
          <Divider orientation="left" orientationMargin={0} style={{ marginTop: 0 }}>Contact</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Broker Name" name="brokerName" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Email" name="contactEmail" rules={[{ required: true }, { type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="contactPhone" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Regulatory</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="SEBI Registration No" name="sebiRegistrationNo">
                <Input placeholder="INZ000..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="PAN"
                name="pan"
                normalize={(v: string) => (v ?? '').toUpperCase()}
                rules={[{ pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Invalid PAN format' }]}
              >
                <Input maxLength={10} placeholder="AAAAA9999A" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="GST Number"
                name="gst"
                normalize={(v: string) => (v ?? '').toUpperCase()}
                rules={[{ pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, message: 'Invalid GST format' }]}
              >
                <Input maxLength={15} placeholder="22AAAAA0000A1Z5" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Address</Divider>
          <Form.Item label="Address" name="address">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Space style={{ marginTop: 8 }}>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
