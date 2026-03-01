import { useState } from 'react';
import {
  Descriptions,
  Tabs,
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
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { ClientSegmentsTab } from '@modules/master-setup/components/client-segments/ClientSegmentsTab';
import { useClientDetail } from '../../hooks/useClients';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission } from '@app-types/roles.types';
import { ClientStatus, KYCStatus, RiskCategory, Depository } from '@app-types/enums';
import { updateClient, changeClientStatus, deleteClient } from '../../services/clientService';
import type { UpdateClientPayload, ClientDetail } from '../../services/clientService';

const { Text } = Typography;

const STATUS_OPTIONS = [
  { value: ClientStatus.Registered, label: 'Registered' },
  { value: ClientStatus.Active, label: 'Active' },
  { value: ClientStatus.Inactive, label: 'Inactive' },
  { value: ClientStatus.Suspended, label: 'Suspended' },
  { value: ClientStatus.Closed, label: 'Closed' },
];

const STATUS_COLORS: Record<ClientStatus, string> = {
  [ClientStatus.Registered]: 'blue',
  [ClientStatus.Active]: 'green',
  [ClientStatus.Inactive]: 'default',
  [ClientStatus.Suspended]: 'orange',
  [ClientStatus.Closed]: 'red',
};

const KYC_OPTIONS = [
  { value: KYCStatus.Pending, label: 'Pending' },
  { value: KYCStatus.Verified, label: 'Verified' },
  { value: KYCStatus.Expired, label: 'Expired' },
];

const RISK_OPTIONS = [
  { value: RiskCategory.Conservative, label: 'Conservative' },
  { value: RiskCategory.Moderate, label: 'Moderate' },
  { value: RiskCategory.Aggressive, label: 'Aggressive' },
];

const DEPOSITORY_OPTIONS = [
  { value: Depository.NSDL, label: 'NSDL' },
  { value: Depository.CDSL, label: 'CDSL' },
];

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' },
  { value: 'NRE', label: 'NRE' },
  { value: 'NRO', label: 'NRO' },
];

interface EditFormValues {
  clientName: string;
  email: string;
  phone: string;
  alternateMobile?: string;
  gender?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  occupation?: string;
  grossAnnualIncome?: string;
  fatherSpouseName?: string;
  motherName?: string;
  pan?: string;
  aadhaar?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  stateName?: string;
  correspondenceAddress?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIFSC?: string;
  accountType?: string;
  branchName?: string;
  depository?: Depository;
  dpId?: string;
  dematAccountNo?: string;
  kycStatus: KYCStatus;
  riskCategory: RiskCategory;
}

interface ClientDrawerProps {
  clientId: string | null;
  onClose: () => void;
}

export function ClientDrawer({ clientId, onClose }: ClientDrawerProps) {
  const qc = useQueryClient();
  const { data: client, isLoading } = useClientDetail(clientId);
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));

  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<EditFormValues>();
  const [pendingStatus, setPendingStatus] = useState<ClientStatus | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['clients'] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateClientPayload) => {
      if (!clientId) return Promise.reject(new Error('No client selected'));
      return updateClient(clientId, payload);
    },
    onSuccess: (updated) => {
      void qc.setQueryData(['clients', clientId], updated);
      invalidate();
      setEditOpen(false);
      void message.success('Client updated');
    },
    onError: () => void message.error('Failed to update client'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ClientStatus) => {
      if (!clientId) return Promise.reject(new Error('No client selected'));
      return changeClientStatus(clientId, status);
    },
    onSuccess: () => {
      invalidate();
      void qc.invalidateQueries({ queryKey: ['clients', clientId] });
      void message.success('Status updated');
      setPendingStatus(null);
    },
    onError: () => void message.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!clientId) return Promise.reject(new Error('No client selected'));
      return deleteClient(clientId);
    },
    onSuccess: () => {
      invalidate();
      onClose();
      void message.success('Client deleted');
    },
    onError: () => void message.error('Failed to delete client'),
  });

  const openEdit = (c: ClientDetail) => {
    const vals: EditFormValues = {
      clientName: c.clientName,
      email: c.email,
      phone: c.phone,
      kycStatus: c.kycStatus,
      riskCategory: c.riskCategory,
    };
    if (c.alternateMobile) vals.alternateMobile = c.alternateMobile;
    if (c.gender) vals.gender = c.gender;
    if (c.dateOfBirth) vals.dateOfBirth = c.dateOfBirth;
    if (c.maritalStatus) vals.maritalStatus = c.maritalStatus;
    if (c.occupation) vals.occupation = c.occupation;
    if (c.grossAnnualIncome) vals.grossAnnualIncome = c.grossAnnualIncome;
    if (c.fatherSpouseName) vals.fatherSpouseName = c.fatherSpouseName;
    if (c.motherName) vals.motherName = c.motherName;
    if (c.pan) vals.pan = c.pan;
    if (c.aadhaar) vals.aadhaar = c.aadhaar;
    if (c.address) vals.address = c.address;
    if (c.city) vals.city = c.city;
    if (c.pinCode) vals.pinCode = c.pinCode;
    if (c.stateName) vals.stateName = c.stateName;
    if (c.correspondenceAddress) vals.correspondenceAddress = c.correspondenceAddress;
    if (c.bankName) vals.bankName = c.bankName;
    if (c.bankAccountNo) vals.bankAccountNo = c.bankAccountNo;
    if (c.bankIFSC) vals.bankIFSC = c.bankIFSC;
    if (c.accountType) vals.accountType = c.accountType;
    if (c.branchName) vals.branchName = c.branchName;
    if (c.depository) vals.depository = c.depository;
    if (c.dpId) vals.dpId = c.dpId;
    if (c.dematAccountNo) vals.dematAccountNo = c.dematAccountNo;
    editForm.setFieldsValue(vals);
    setEditOpen(true);
  };

  const handleEditSubmit = (values: EditFormValues) => {
    if (!client) return;
    const payload: UpdateClientPayload = {
      clientName: values.clientName,
      email: values.email,
      phone: values.phone,
      status: client.status,
      kycStatus: values.kycStatus,
      riskCategory: values.riskCategory,
    };
    if (values.alternateMobile !== undefined) payload.alternateMobile = values.alternateMobile;
    if (values.gender !== undefined) payload.gender = values.gender;
    if (values.dateOfBirth !== undefined) payload.dateOfBirth = values.dateOfBirth;
    if (values.maritalStatus !== undefined) payload.maritalStatus = values.maritalStatus;
    if (values.occupation !== undefined) payload.occupation = values.occupation;
    if (values.grossAnnualIncome !== undefined) payload.grossAnnualIncome = values.grossAnnualIncome;
    if (values.fatherSpouseName !== undefined) payload.fatherSpouseName = values.fatherSpouseName;
    if (values.motherName !== undefined) payload.motherName = values.motherName;
    if (values.pan !== undefined) payload.pan = values.pan;
    if (values.aadhaar !== undefined) payload.aadhaar = values.aadhaar;
    if (values.address !== undefined) payload.address = values.address;
    if (values.city !== undefined) payload.city = values.city;
    if (values.pinCode !== undefined) payload.pinCode = values.pinCode;
    if (values.stateName !== undefined) payload.stateName = values.stateName;
    if (values.correspondenceAddress !== undefined) payload.correspondenceAddress = values.correspondenceAddress;
    if (values.bankName !== undefined) payload.bankName = values.bankName;
    if (values.bankAccountNo !== undefined) payload.bankAccountNo = values.bankAccountNo;
    if (values.bankIFSC !== undefined) payload.bankIFSC = values.bankIFSC;
    if (values.accountType !== undefined) payload.accountType = values.accountType;
    if (values.branchName !== undefined) payload.branchName = values.branchName;
    if (values.depository !== undefined) payload.depository = values.depository;
    if (values.dpId !== undefined) payload.dpId = values.dpId;
    if (values.dematAccountNo !== undefined) payload.dematAccountNo = values.dematAccountNo;
    updateMutation.mutate(payload);
  };

  const isDestructive = (s: ClientStatus) =>
    s === ClientStatus.Closed || s === ClientStatus.Suspended;

  return (
    <>
      <SlideDrawer
        title={
          <Space>
            <span>{client?.clientName ?? 'Client Detail'}</span>
            {client && (
              <Tag color={STATUS_COLORS[client.status]} style={{ marginLeft: 4 }}>
                {client.status}
              </Tag>
            )}
          </Space>
        }
        open={!!clientId}
        onClose={onClose}
        isLoading={isLoading}
        extra={
          client && (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => openEdit(client)}>
                Edit
              </Button>
              <Popconfirm
                title="Delete client"
                description={`Permanently remove "${client.clientName}" from the system?`}
                onConfirm={() => deleteMutation.mutate()}
                okText="Delete"
                okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
                cancelText="Cancel"
              >
                <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {client && (
          <Tabs
            defaultActiveKey="details"
            style={{ padding: '0 24px' }}
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <div>
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
                      <StatusBadge status={client.status} />
                      <Select
                        value={pendingStatus ?? client.status}
                        options={STATUS_OPTIONS}
                        style={{ width: 150 }}
                        onChange={(v) => setPendingStatus(v)}
                      />
                      {pendingStatus && pendingStatus !== client.status && (
                        <>
                          {isDestructive(pendingStatus) ? (
                            <Popconfirm
                              title={`Change status to "${pendingStatus}"?`}
                              description="This may affect client access. Confirm?"
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
                      <Descriptions.Item label="Client Code">{client.clientCode}</Descriptions.Item>
                      <Descriptions.Item label="Type">{client.clientType}</Descriptions.Item>
                      <Descriptions.Item label="Name" span={2}>{client.clientName}</Descriptions.Item>
                      <Descriptions.Item label="Email" span={2}>{client.email}</Descriptions.Item>
                      <Descriptions.Item label="Phone">{client.phone}</Descriptions.Item>
                      <Descriptions.Item label="Alt. Mobile">{client.alternateMobile ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="PAN">
                        {canViewSensitive ? (client.pan ?? '—') : <MaskedField />}
                      </Descriptions.Item>
                      <Descriptions.Item label="Aadhaar">
                        {canViewSensitive ? (client.aadhaar ?? '—') : <MaskedField />}
                      </Descriptions.Item>
                      {client.dateOfBirth && (
                        <Descriptions.Item label="Date of Birth">
                          {dayjs(client.dateOfBirth).format('DD MMM YYYY')}
                        </Descriptions.Item>
                      )}
                      {client.gender && (
                        <Descriptions.Item label="Gender">{client.gender}</Descriptions.Item>
                      )}
                      {client.occupation && (
                        <Descriptions.Item label="Occupation">{client.occupation}</Descriptions.Item>
                      )}
                    </Descriptions>

                    <Descriptions bordered column={2} size="small" style={{ marginTop: 12 }} title="Address">
                      <Descriptions.Item label="Permanent" span={2}>{client.address ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="City">{client.city ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="PIN">{client.pinCode ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="State">{client.stateName ?? '—'}</Descriptions.Item>
                    </Descriptions>

                    <Descriptions bordered column={2} size="small" style={{ marginTop: 12 }} title="Bank & Demat">
                      <Descriptions.Item label="Bank">{client.bankName ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="Account No">
                        {canViewSensitive ? (client.bankAccountNo ?? '—') : <MaskedField />}
                      </Descriptions.Item>
                      <Descriptions.Item label="IFSC">{client.bankIFSC ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="Acct Type">{client.accountType ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="Depository">{client.depository ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="DP ID">{client.dpId ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="Demat Acct" span={2}>{client.dematAccountNo ?? '—'}</Descriptions.Item>
                    </Descriptions>

                    <Descriptions bordered column={2} size="small" style={{ marginTop: 12 }} title="KYC & Risk">
                      <Descriptions.Item label="KYC Status">{client.kycStatus}</Descriptions.Item>
                      <Descriptions.Item label="Risk Category">{client.riskCategory}</Descriptions.Item>
                    </Descriptions>
                  </div>
                ),
              },
              {
                key: 'segments',
                label: 'Segments',
                children: <ClientSegmentsTab clientId={client.clientId} />,
              },
            ]}
          />
        )}
      </SlideDrawer>

      {/* Edit Modal */}
      <Modal
        title={`Edit Client — ${client?.clientCode ?? ''}`}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        width={800}
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
            <Col span={12}>
              <Form.Item label="Full Name" name="clientName" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true }, { type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Alternate Mobile" name="alternateMobile">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Personal</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Gender" name="gender">
                <Select options={GENDER_OPTIONS} allowClear placeholder="Select" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Date of Birth" name="dateOfBirth">
                <Input placeholder="YYYY-MM-DD" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Marital Status" name="maritalStatus">
                <Select
                  allowClear
                  placeholder="Select"
                  options={[
                    { value: 'Single', label: 'Single' },
                    { value: 'Married', label: 'Married' },
                    { value: 'Divorced', label: 'Divorced' },
                    { value: 'Widowed', label: 'Widowed' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Occupation" name="occupation"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Annual Income" name="grossAnnualIncome"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Father/Spouse Name" name="fatherSpouseName"><Input /></Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Identity</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="PAN" name="pan"
                normalize={(v: string) => (v ?? '').toUpperCase()}
                rules={[{ pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Invalid PAN format' }]}
              >
                <Input maxLength={10} placeholder="AAAAA9999A" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Aadhaar" name="aadhaar" rules={[{ len: 12, message: '12 digits required' }]}>
                <Input maxLength={12} placeholder="12-digit Aadhaar" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Address</Divider>
          <Form.Item label="Permanent Address" name="address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="City" name="city"><Input /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="PIN Code" name="pinCode"><Input maxLength={6} /></Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="State" name="stateName"><Input /></Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Bank Details</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Bank Name" name="bankName"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Branch Name" name="branchName"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Account Number" name="bankAccountNo"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="IFSC Code" name="bankIFSC"
                normalize={(v: string) => (v ?? '').toUpperCase()}
              >
                <Input maxLength={11} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Account Type" name="accountType">
                <Select options={ACCOUNT_TYPE_OPTIONS} allowClear placeholder="Select" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>Demat Account</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Depository" name="depository">
                <Select options={DEPOSITORY_OPTIONS} allowClear placeholder="Select" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="DP ID" name="dpId"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Demat Account No" name="dematAccountNo"><Input /></Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>KYC & Risk</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="KYC Status" name="kycStatus" rules={[{ required: true }]}>
                <Select options={KYC_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Risk Category" name="riskCategory" rules={[{ required: true }]}>
                <Select options={RISK_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

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
