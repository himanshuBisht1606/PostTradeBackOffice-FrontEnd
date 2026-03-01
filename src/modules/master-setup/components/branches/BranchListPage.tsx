import { useState, useCallback, useMemo } from 'react';
import {
  Typography,
  Input,
  Row,
  Col,
  Tag,
  Descriptions,
  Button,
  Modal,
  Form,
  Space,
  Switch,
  Popconfirm,
  message,
} from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../../services/branchService';
import type { BranchRecord, CreateBranchPayload } from '../../services/branchService';

const { Title } = Typography;

interface BranchFormValues {
  branchCode: string;
  branchName: string;
  address?: string;
  city?: string;
  stateCode: string;
  stateName: string;
  gstin?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
}

export function BranchListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm<BranchFormValues>();

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<BranchFormValues>();
  const [editingRecord, setEditingRecord] = useState<BranchRecord | null>(null);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['branches', selectedId],
    queryFn: () => getBranchById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateBranchPayload) => createBranch(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['branches'] });
      setCreateOpen(false);
      createForm.resetFields();
      void message.success('Branch created');
    },
    onError: () => void message.error('Failed to create branch'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateBranchPayload> }) =>
      updateBranch(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['branches'] });
      if (editingRecord) void qc.invalidateQueries({ queryKey: ['branches', editingRecord.branchId] });
      setEditOpen(false);
      setSelectedId(null);
      void message.success('Branch updated');
    },
    onError: () => void message.error('Failed to update branch'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['branches'] });
      setSelectedId(null);
      void message.success('Branch deleted');
    },
    onError: () => void message.error('Failed to delete branch'),
  });

  const handleCreate = (values: BranchFormValues) => {
    const payload: CreateBranchPayload = {
      branchCode: values.branchCode.toUpperCase().trim(),
      branchName: values.branchName.trim(),
      stateCode: values.stateCode.trim(),
      stateName: values.stateName.trim(),
      isActive: values.isActive,
    };
    if (values.address) payload.address = values.address.trim();
    if (values.city) payload.city = values.city.trim();
    if (values.gstin) payload.gstin = values.gstin.trim();
    if (values.contactPerson) payload.contactPerson = values.contactPerson.trim();
    if (values.contactPhone) payload.contactPhone = values.contactPhone.trim();
    if (values.contactEmail) payload.contactEmail = values.contactEmail.trim();
    createMutation.mutate(payload);
  };

  const openEdit = (record: BranchRecord) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      branchCode: record.branchCode,
      branchName: record.branchName,
      address: record.address ?? undefined,
      city: record.city ?? undefined,
      stateCode: record.stateCode,
      stateName: record.stateName,
      gstin: record.gstin ?? undefined,
      contactPerson: record.contactPerson ?? undefined,
      contactPhone: record.contactPhone ?? undefined,
      contactEmail: record.contactEmail ?? undefined,
      isActive: record.isActive,
    });
    setEditOpen(true);
  };

  const handleEdit = (values: BranchFormValues) => {
    if (!editingRecord) return;
    const payload: Partial<CreateBranchPayload> = {
      branchName: values.branchName.trim(),
      stateCode: values.stateCode.trim(),
      stateName: values.stateName.trim(),
      isActive: values.isActive,
      address: values.address?.trim(),
      city: values.city?.trim(),
      gstin: values.gstin?.trim(),
      contactPerson: values.contactPerson?.trim(),
      contactPhone: values.contactPhone?.trim(),
      contactEmail: values.contactEmail?.trim(),
    };
    updateMutation.mutate({ id: editingRecord.branchId, payload });
  };

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (b) =>
        b.branchCode.toLowerCase().includes(q) ||
        b.branchName.toLowerCase().includes(q) ||
        (b.city ?? '').toLowerCase().includes(q),
    );
  }, [allData, search]);

  const pageData = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const columns: TableColumnsType<BranchRecord> = [
    {
      title: 'Code',
      dataIndex: 'branchCode',
      width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Branch Name', dataIndex: 'branchName', ellipsis: true },
    { title: 'City', dataIndex: 'city', width: 120, render: (v: string | null) => v ?? '—' },
    { title: 'State', dataIndex: 'stateName', width: 140 },
    {
      title: 'Contact',
      dataIndex: 'contactPerson',
      width: 160,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Phone',
      dataIndex: 'contactPhone',
      width: 130,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
  ];

  const branchFormFields = (isCreate: boolean) => (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Branch Code"
            name="branchCode"
            rules={[{ required: true, message: 'Required' }, { max: 20, message: 'Max 20 chars' }]}
          >
            <Input
              placeholder="e.g. MUM01"
              disabled={!isCreate}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label="Branch Name"
            name="branchName"
            rules={[{ required: true, message: 'Required' }, { max: 200, message: 'Max 200 chars' }]}
          >
            <Input placeholder="e.g. Mumbai Main Branch" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Address" name="address">
            <Input placeholder="Street address" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="City" name="city">
            <Input placeholder="City" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="State Code"
            name="stateCode"
            rules={[{ required: true, message: 'Required' }, { len: 2, message: 'Must be 2 chars' }]}
          >
            <Input placeholder="e.g. MH" maxLength={2} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label="State Name"
            name="stateName"
            rules={[{ required: true, message: 'Required' }, { max: 100, message: 'Max 100 chars' }]}
          >
            <Input placeholder="e.g. Maharashtra" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="GSTIN" name="gstin">
            <Input placeholder="15-char GSTIN" maxLength={15} />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item label="Contact Person" name="contactPerson">
            <Input placeholder="Contact person name" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Contact Phone" name="contactPhone">
            <Input placeholder="Phone number" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Contact Email"
            name="contactEmail"
            rules={[{ type: 'email', message: 'Invalid email' }]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Active" name="isActive" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Branches
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }} align="middle">
        <Col span={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by code, name, or city"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              createForm.resetFields();
              createForm.setFieldsValue({ isActive: true });
              setCreateOpen(true);
            }}
          >
            Add New
          </Button>
        </Col>
      </Row>

      <DataTable<BranchRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="branchId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} branches`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedId(record.branchId),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Detail drawer */}
      <SlideDrawer
        title={detail?.branchName ?? 'Branch Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
        extra={
          detail && (
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => openEdit(detail)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete branch"
                description="Are you sure you want to delete this branch?"
                onConfirm={() => deleteMutation.mutate(detail.branchId)}
                okText="Delete"
                okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
                cancelText="Cancel"
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.branchCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.branchName}</Descriptions.Item>
              <Descriptions.Item label="City">{detail.city ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="State">
                {detail.stateName} ({detail.stateCode})
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {detail.address ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="GSTIN">{detail.gstin ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Contact Person">
                {detail.contactPerson ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">{detail.contactPhone ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{detail.contactEmail ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Active" span={2}>
                <Tag color={detail.isActive ? 'green' : 'default'}>
                  {detail.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </SlideDrawer>

      {/* Create modal */}
      <Modal
        title="Add Branch"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          style={{ marginTop: 16 }}
        >
          {branchFormFields(true)}
          <Space style={{ marginTop: 8 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Edit modal */}
      <Modal
        title={`Edit Branch — ${editingRecord?.branchCode ?? ''}`}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
          style={{ marginTop: 16 }}
        >
          {branchFormFields(false)}
          <Space style={{ marginTop: 8 }}>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              Save
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
