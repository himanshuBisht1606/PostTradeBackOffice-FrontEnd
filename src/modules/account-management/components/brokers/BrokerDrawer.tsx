import { useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { useBrokerDetail } from '../../hooks/useBrokers';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission } from '@app-types/roles.types';
import { BrokerEntityType, BrokerStatus, MembershipType } from '@app-types/enums';
import {
  changeBrokerStatus,
  deleteBrokerMembership,
  updateBroker,
  upsertBrokerMembership,
} from '../../services/brokerService';
import type {
  BrokerDetail,
  BrokerExchangeMembership,
  UpdateBrokerPayload,
  UpsertMembershipPayload,
} from '../../services/brokerService';
import { getExchangeSegments } from '@modules/master-setup/services/exchangeSegmentService';

const { Text, Title } = Typography;

// ── Constants ─────────────────────────────────────────────────────────────────

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

const ENTITY_TYPE_OPTIONS = [
  { value: BrokerEntityType.Proprietorship, label: 'Proprietorship' },
  { value: BrokerEntityType.Partnership, label: 'Partnership' },
  { value: BrokerEntityType.LLP, label: 'LLP' },
  { value: BrokerEntityType.PrivateLimited, label: 'Private Limited' },
  { value: BrokerEntityType.PublicLimited, label: 'Public Limited' },
  { value: BrokerEntityType.Other, label: 'Other' },
];

const MEMBERSHIP_TYPE_OPTIONS = [
  { value: MembershipType.TradingMember, label: 'Trading Member' },
  { value: MembershipType.ClearingMember, label: 'Clearing Member' },
  { value: MembershipType.SelfClearingMember, label: 'Self Clearing Member' },
  { value: MembershipType.TradingAndClearing, label: 'Trading & Clearing' },
];

const MEMBERSHIP_TYPE_LABELS: Record<MembershipType, string> = {
  [MembershipType.TradingMember]: 'TM',
  [MembershipType.ClearingMember]: 'CM',
  [MembershipType.SelfClearingMember]: 'SCM',
  [MembershipType.TradingAndClearing]: 'TM+CM',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Converts empty-string date values ("") to null before submitting to backend.
 *  ASP.NET Core cannot parse "" as DateOnly? — it must be null. */
function normalizePayload(vals: UpdateBrokerPayload): UpdateBrokerPayload {
  const nullIfEmpty = (v: string | null | undefined) =>
    v === '' || v === undefined ? null : v;
  return {
    ...vals,
    incorporationDate: nullIfEmpty(vals.incorporationDate),
    sebiRegistrationDate: nullIfEmpty(vals.sebiRegistrationDate),
    sebiRegistrationExpiry: nullIfEmpty(vals.sebiRegistrationExpiry),
    website: nullIfEmpty(vals.website),
    cin: nullIfEmpty(vals.cin),
    tan: nullIfEmpty(vals.tan),
    pan: nullIfEmpty(vals.pan),
    gst: nullIfEmpty(vals.gst),
    registeredAddressLine1: nullIfEmpty(vals.registeredAddressLine1),
    registeredAddressLine2: nullIfEmpty(vals.registeredAddressLine2),
    registeredCity: nullIfEmpty(vals.registeredCity),
    registeredState: nullIfEmpty(vals.registeredState),
    registeredPinCode: nullIfEmpty(vals.registeredPinCode),
    correspondenceAddressLine1: nullIfEmpty(vals.correspondenceAddressLine1),
    correspondenceAddressLine2: nullIfEmpty(vals.correspondenceAddressLine2),
    correspondenceCity: nullIfEmpty(vals.correspondenceCity),
    correspondenceState: nullIfEmpty(vals.correspondenceState),
    correspondencePinCode: nullIfEmpty(vals.correspondencePinCode),
    sebiRegistrationNo: nullIfEmpty(vals.sebiRegistrationNo),
    complianceOfficerName: nullIfEmpty(vals.complianceOfficerName),
    complianceOfficerEmail: nullIfEmpty(vals.complianceOfficerEmail),
    complianceOfficerPhone: nullIfEmpty(vals.complianceOfficerPhone),
    principalOfficerName: nullIfEmpty(vals.principalOfficerName),
    principalOfficerEmail: nullIfEmpty(vals.principalOfficerEmail),
    principalOfficerPhone: nullIfEmpty(vals.principalOfficerPhone),
    settlementBankName: nullIfEmpty(vals.settlementBankName),
    settlementBankAccountNo: nullIfEmpty(vals.settlementBankAccountNo),
    settlementBankIfsc: nullIfEmpty(vals.settlementBankIfsc),
    settlementBankBranch: nullIfEmpty(vals.settlementBankBranch),
  };
}

function normalizeMembershipPayload(vals: UpsertMembershipPayload): UpsertMembershipPayload {
  const toNull = (v: string | null | undefined): string | null =>
    !v ? null : v;
  return {
    ...vals,
    clearingMemberId: toNull(vals.clearingMemberId),
    expiryDate: toNull(vals.expiryDate),
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface BrokerDrawerProps {
  brokerId: string | null;
  onClose: () => void;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null | undefined }) {
  return <Descriptions.Item label={label}>{value ?? '—'}</Descriptions.Item>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BrokerDrawer({ brokerId, onClose }: BrokerDrawerProps) {
  const qc = useQueryClient();
  const { data: broker, isLoading } = useBrokerDetail(brokerId);
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));

  const [editOpen, setEditOpen] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<BrokerExchangeMembership | null>(null);
  const [pendingStatus, setPendingStatus] = useState<BrokerStatus | null>(null);
  const [corrSameAsReg, setCorrSameAsReg] = useState(true);

  const [editForm] = Form.useForm<UpdateBrokerPayload>();
  const [membershipForm] = Form.useForm<UpsertMembershipPayload>();

  // Exchange segments for membership dropdown
  const { data: exchangeSegments = [], isLoading: esLoading } = useQuery({
    queryKey: ['exchange-segments'],
    queryFn: () => getExchangeSegments(),
    staleTime: 5 * 60_000,
    enabled: membershipOpen,
  });

  const esOptions = exchangeSegments.map((es) => ({
    value: es.exchangeSegmentId,
    label: `${es.exchangeSegmentCode} — ${es.exchangeSegmentName}`,
  }));

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['brokers'] });
    void qc.invalidateQueries({ queryKey: ['brokers', brokerId] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateBrokerPayload) => updateBroker(brokerId!, payload),
    onSuccess: () => { invalidate(); setEditOpen(false); void message.success('Broker updated'); },
    onError: () => void message.error('Failed to update broker'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: BrokerStatus) => changeBrokerStatus(brokerId!, status),
    onSuccess: () => { invalidate(); void message.success('Status updated'); setPendingStatus(null); },
    onError: () => void message.error('Failed to update status'),
  });

  const membershipMutation = useMutation({
    mutationFn: (payload: UpsertMembershipPayload) => upsertBrokerMembership(brokerId!, payload),
    onSuccess: () => { invalidate(); setMembershipOpen(false); void message.success('Membership saved'); },
    onError: () => void message.error('Failed to save membership'),
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: (membershipId: string) => deleteBrokerMembership(brokerId!, membershipId),
    onSuccess: () => { invalidate(); void message.success('Membership removed'); },
    onError: () => void message.error('Failed to remove membership'),
  });

  const openEdit = (b: BrokerDetail) => {
    setCorrSameAsReg(b.correspondenceSameAsRegistered);
    editForm.setFieldsValue({
      brokerName: b.brokerName,
      entityType: b.entityType,
      website: b.website,
      contactEmail: b.contactEmail,
      contactPhone: b.contactPhone,
      cin: b.cin,
      tan: b.tan,
      pan: b.pan,
      gst: b.gst,
      incorporationDate: b.incorporationDate,
      registeredAddressLine1: b.registeredAddressLine1,
      registeredAddressLine2: b.registeredAddressLine2,
      registeredCity: b.registeredCity,
      registeredState: b.registeredState,
      registeredPinCode: b.registeredPinCode,
      registeredCountry: b.registeredCountry ?? 'India',
      correspondenceSameAsRegistered: b.correspondenceSameAsRegistered,
      correspondenceAddressLine1: b.correspondenceAddressLine1,
      correspondenceAddressLine2: b.correspondenceAddressLine2,
      correspondenceCity: b.correspondenceCity,
      correspondenceState: b.correspondenceState,
      correspondencePinCode: b.correspondencePinCode,
      sebiRegistrationNo: b.sebiRegistrationNo,
      sebiRegistrationDate: b.sebiRegistrationDate,
      sebiRegistrationExpiry: b.sebiRegistrationExpiry,
      complianceOfficerName: b.complianceOfficerName,
      complianceOfficerEmail: b.complianceOfficerEmail,
      complianceOfficerPhone: b.complianceOfficerPhone,
      principalOfficerName: b.principalOfficerName,
      principalOfficerEmail: b.principalOfficerEmail,
      principalOfficerPhone: b.principalOfficerPhone,
      settlementBankName: b.settlementBankName,
      settlementBankAccountNo: b.settlementBankAccountNo,
      settlementBankIfsc: b.settlementBankIfsc,
      settlementBankBranch: b.settlementBankBranch,
    });
    setEditOpen(true);
  };

  const openAddMembership = () => {
    setEditingMembership(null);
    membershipForm.resetFields();
    membershipForm.setFieldsValue({ isActive: true, membershipType: MembershipType.TradingMember });
    setMembershipOpen(true);
  };

  const openEditMembership = (m: BrokerExchangeMembership) => {
    setEditingMembership(m);
    membershipForm.setFieldsValue({
      exchangeSegmentId: m.exchangeSegmentId,
      tradingMemberId: m.tradingMemberId,
      clearingMemberId: m.clearingMemberId,
      membershipType: m.membershipType,
      effectiveDate: m.effectiveDate,
      expiryDate: m.expiryDate,
      isActive: m.isActive,
    });
    setMembershipOpen(true);
  };

  const membershipColumns: TableColumnsType<BrokerExchangeMembership> = [
    {
      title: 'Exchange-Segment',
      dataIndex: 'exchangeSegmentCode',
      render: (v: string, r: BrokerExchangeMembership) => (
        <div>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.exchangeSegmentName}</div>
        </div>
      ),
    },
    {
      title: 'TM ID',
      dataIndex: 'tradingMemberId',
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: 'CM ID',
      dataIndex: 'clearingMemberId',
      render: (v: string | null) => v ? <span style={{ fontFamily: 'monospace' }}>{v}</span> : '—',
    },
    {
      title: 'Type',
      dataIndex: 'membershipType',
      width: 80,
      render: (v: MembershipType) => <Tag>{MEMBERSHIP_TYPE_LABELS[v]}</Tag>,
    },
    {
      title: 'Effective',
      dataIndex: 'effectiveDate',
      width: 100,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 70,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 72,
      render: (_: unknown, record: BrokerExchangeMembership) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditMembership(record)} />
          <Popconfirm
            title="Remove this membership?"
            onConfirm={() => deleteMembershipMutation.mutate(record.brokerExchangeMembershipId)}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMembershipMutation.isPending} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
        width={860}
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
            {/* Status bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
              padding: '12px 16px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef',
            }}>
              <Text strong style={{ minWidth: 56 }}>Status</Text>
              <StatusBadge status={broker.status} />
              <Select value={pendingStatus ?? broker.status} options={STATUS_OPTIONS}
                style={{ width: 140 }} onChange={(v) => setPendingStatus(v)} />
              {pendingStatus && pendingStatus !== broker.status && (
                <>
                  {pendingStatus === BrokerStatus.Suspended ? (
                    <Popconfirm
                      title={`Change status to "Suspended"?`}
                      description="This may affect broker operations."
                      onConfirm={() => statusMutation.mutate(pendingStatus)}
                      onCancel={() => setPendingStatus(null)}
                      okText="Confirm" okButtonProps={{ danger: true }}
                    >
                      <Button size="small" danger loading={statusMutation.isPending}>Apply</Button>
                    </Popconfirm>
                  ) : (
                    <Button size="small" type="primary" loading={statusMutation.isPending}
                      onClick={() => statusMutation.mutate(pendingStatus)}>Apply</Button>
                  )}
                  <Button size="small" onClick={() => setPendingStatus(null)}>Cancel</Button>
                </>
              )}
            </div>

            {/* Company Details */}
            <Title level={5} style={{ color: '#1d3557', marginBottom: 8 }}>Company Details</Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <InfoRow label="Broker Code" value={broker.brokerCode} />
              <InfoRow label="Entity Type" value={broker.entityType} />
              <InfoRow label="Broker Name" value={broker.brokerName} />
              <InfoRow label="Website" value={broker.website} />
              <InfoRow label="CIN" value={broker.cin} />
              <InfoRow label="Incorporation Date" value={broker.incorporationDate} />
            </Descriptions>

            {/* SEBI Registration */}
            <Title level={5} style={{ color: '#1d3557', marginBottom: 8 }}>SEBI Registration</Title>
            <Descriptions bordered column={3} size="small" style={{ marginBottom: 16 }}>
              <InfoRow label="SEBI Reg No" value={broker.sebiRegistrationNo} />
              <InfoRow label="Registration Date" value={broker.sebiRegistrationDate} />
              <InfoRow label="Expiry Date" value={broker.sebiRegistrationExpiry} />
            </Descriptions>

            {/* Contact */}
            <Title level={5} style={{ color: '#1d3557', marginBottom: 8 }}>Contact</Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <InfoRow label="Email" value={broker.contactEmail} />
              <InfoRow label="Phone" value={broker.contactPhone} />
            </Descriptions>

            {/* Registered Address */}
            <Title level={5} style={{ color: '#1d3557', marginBottom: 8 }}>Registered Address</Title>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 4 }}>
              <InfoRow label="Address Line 1" value={broker.registeredAddressLine1} />
              <InfoRow label="Address Line 2" value={broker.registeredAddressLine2} />
            </Descriptions>
            <Descriptions bordered column={3} size="small" style={{ marginBottom: 16 }}>
              <InfoRow label="City" value={broker.registeredCity} />
              <InfoRow label="State" value={broker.registeredState} />
              <InfoRow label="Pin Code" value={broker.registeredPinCode} />
            </Descriptions>

            {/* Compliance Officers */}
            <Title level={5} style={{ color: '#1d3557', marginBottom: 8 }}>Compliance Officers</Title>
            <Descriptions bordered column={3} size="small" style={{ marginBottom: 16 }}>
              <InfoRow label="Compliance Officer" value={broker.complianceOfficerName} />
              <InfoRow label="CO Email" value={broker.complianceOfficerEmail} />
              <InfoRow label="CO Phone" value={broker.complianceOfficerPhone} />
              <InfoRow label="Principal Officer" value={broker.principalOfficerName} />
              <InfoRow label="PO Email" value={broker.principalOfficerEmail} />
              <InfoRow label="PO Phone" value={broker.principalOfficerPhone} />
            </Descriptions>

            {/* Tax & Compliance */}
            <Title level={5} style={{ color: '#1d3557', marginBottom: 8 }}>Tax & Compliance</Title>
            <Descriptions bordered column={3} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="PAN">
                {canViewSensitive ? (broker.pan ?? '—') : <MaskedField />}
              </Descriptions.Item>
              <Descriptions.Item label="GST">
                {canViewSensitive ? (broker.gst ?? '—') : <MaskedField />}
              </Descriptions.Item>
              <Descriptions.Item label="TAN">
                {canViewSensitive ? (broker.tan ?? '—') : <MaskedField />}
              </Descriptions.Item>
            </Descriptions>

            {/* Settlement Bank */}
            <Title level={5} style={{ color: '#1d3557', marginBottom: 8 }}>Settlement Bank</Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <InfoRow label="Bank Name" value={broker.settlementBankName} />
              <InfoRow label="IFSC" value={broker.settlementBankIfsc} />
              <Descriptions.Item label="Account No">
                {canViewSensitive ? (broker.settlementBankAccountNo ?? '—') : <MaskedField />}
              </Descriptions.Item>
              <InfoRow label="Branch" value={broker.settlementBankBranch} />
            </Descriptions>

            {/* Exchange Memberships */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Title level={5} style={{ color: '#1d3557', margin: 0 }}>Exchange Memberships</Title>
              <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openAddMembership}>
                Add
              </Button>
            </div>
            {broker.exchangeMemberships.length === 0 ? (
              <Alert
                message="No exchange memberships configured. Add at least one to enable trade processing."
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />
            ) : (
              <Table<BrokerExchangeMembership>
                columns={membershipColumns}
                dataSource={broker.exchangeMemberships}
                rowKey="brokerExchangeMembershipId"
                size="small"
                pagination={false}
                style={{ marginBottom: 24 }}
              />
            )}
          </div>
        )}
      </SlideDrawer>

      {/* ── Edit Broker Modal ── */}
      <Modal
        title={`Edit Broker — ${broker?.brokerCode ?? ''}`}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        width={760}
        destroyOnClose
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', paddingRight: 8 } }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(vals) => updateMutation.mutate(normalizePayload(vals))}
          style={{ marginTop: 8 }}
        >
          <Divider orientation="left" orientationMargin={0} style={{ marginTop: 0 }}>Company</Divider>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="Broker Name" name="brokerName" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Entity Type" name="entityType" rules={[{ required: true }]}>
                <Select options={ENTITY_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Website" name="website">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="CIN" name="cin">
                <Input maxLength={21} placeholder="U12345MH2010PTC123456" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="TAN" name="tan" normalize={(v: string) => (v ?? '').toUpperCase()}>
                <Input maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="PAN" name="pan"
                normalize={(v: string) => (v ?? '').toUpperCase()}
                rules={[{ pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Invalid PAN' }]}>
                <Input maxLength={10} placeholder="AAAAA9999A" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="GST" name="gst"
                normalize={(v: string) => (v ?? '').toUpperCase()}
                rules={[{ pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, message: 'Invalid GST' }]}>
                <Input maxLength={15} placeholder="22AAAAA0000A1Z5" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Incorporation Date" name="incorporationDate">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Contact</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Email" name="contactEmail" rules={[{ required: true }, { type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="contactPhone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>SEBI Registration</Divider>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item label="SEBI Reg No" name="sebiRegistrationNo">
                <Input placeholder="INZ000..." />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item label="Reg Date" name="sebiRegistrationDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item label="Expiry Date" name="sebiRegistrationExpiry">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Registered Address</Divider>
          <Form.Item label="Address Line 1" name="registeredAddressLine1">
            <Input />
          </Form.Item>
          <Form.Item label="Address Line 2" name="registeredAddressLine2">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="City" name="registeredCity">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="State" name="registeredState">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Pin Code" name="registeredPinCode">
                <Input maxLength={6} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Correspondence Address</Divider>
          <Form.Item
            label="Same as Registered Address"
            name="correspondenceSameAsRegistered"
            valuePropName="checked"
          >
            <Switch onChange={(v) => setCorrSameAsReg(v)} />
          </Form.Item>
          {!corrSameAsReg && (
            <>
              <Form.Item label="Address Line 1" name="correspondenceAddressLine1">
                <Input />
              </Form.Item>
              <Form.Item label="Address Line 2" name="correspondenceAddressLine2">
                <Input />
              </Form.Item>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="City" name="correspondenceCity">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="State" name="correspondenceState">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Pin Code" name="correspondencePinCode">
                    <Input maxLength={6} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Divider orientation="left" orientationMargin={0}>Compliance Officers</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Compliance Officer" name="complianceOfficerName">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="CO Email" name="complianceOfficerEmail" rules={[{ type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="CO Phone" name="complianceOfficerPhone">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Principal Officer" name="principalOfficerName">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="PO Email" name="principalOfficerEmail" rules={[{ type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="PO Phone" name="principalOfficerPhone">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Settlement Bank</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Bank Name" name="settlementBankName">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Account No" name="settlementBankAccountNo">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="IFSC" name="settlementBankIfsc"
                normalize={(v: string) => (v ?? '').toUpperCase()}
                rules={[{ pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC' }]}>
                <Input maxLength={11} placeholder="HDFC0001234" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="Branch" name="settlementBankBranch">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Space style={{ marginTop: 8, paddingBottom: 8 }}>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* ── Add/Edit Membership Modal ── */}
      <Modal
        title={editingMembership ? 'Edit Exchange Membership' : 'Add Exchange Membership'}
        open={membershipOpen}
        onCancel={() => setMembershipOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form
          form={membershipForm}
          layout="vertical"
          onFinish={(vals) => membershipMutation.mutate(normalizeMembershipPayload(vals))}
          style={{ marginTop: 8 }}
        >
          <Form.Item
            label="Exchange-Segment"
            name="exchangeSegmentId"
            rules={[{ required: true, message: 'Select an exchange-segment' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select exchange-segment (e.g. NSE CM)"
              options={esOptions}
              loading={esLoading}
              disabled={!!editingMembership}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Trading Member ID" name="tradingMemberId"
                rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. 12345" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Clearing Member ID" name="clearingMemberId"
                help="Leave blank if not a clearing member">
                <Input placeholder="e.g. NCL12345" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Membership Type" name="membershipType" rules={[{ required: true }]}>
            <Select options={MEMBERSHIP_TYPE_OPTIONS} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Effective Date" name="effectiveDate" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Expiry Date" name="expiryDate">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Space>
            <Button onClick={() => setMembershipOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={membershipMutation.isPending}>
              Save
            </Button>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
