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
  Switch,
  Space,
  message,
} from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import {
  getSegments,
  getSegmentById,
  createSegment,
  updateSegment,
} from '../../services/segmentService';
import type { SegmentRecord, CreateSegmentPayload } from '../../services/segmentService';

const { Title } = Typography;
const { TextArea } = Input;

interface SegmentFormValues {
  segmentCode: string;
  segmentName: string;
  description?: string;
  isActive: boolean;
}

export function SegmentListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm<SegmentFormValues>();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<SegmentFormValues>();
  const [editingRecord, setEditingRecord] = useState<SegmentRecord | null>(null);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['segments'],
    queryFn: getSegments,
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['segments', selectedId],
    queryFn: () => getSegmentById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSegmentPayload) => createSegment(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['segments'] });
      setCreateOpen(false);
      createForm.resetFields();
      void message.success('Segment created');
    },
    onError: () => void message.error('Failed to create segment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSegmentPayload> }) =>
      updateSegment(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['segments'] });
      if (editingRecord) void qc.invalidateQueries({ queryKey: ['segments', editingRecord.segmentId] });
      setEditOpen(false);
      setSelectedId(null);
      void message.success('Segment updated');
    },
    onError: () => void message.error('Failed to update segment'),
  });

  const handleCreate = (values: SegmentFormValues) => {
    const payload: CreateSegmentPayload = {
      segmentCode: values.segmentCode.toUpperCase().trim(),
      segmentName: values.segmentName.trim(),
      isActive: values.isActive,
    };
    if (values.description?.trim()) payload.description = values.description.trim();
    createMutation.mutate(payload);
  };

  const openEdit = (record: SegmentRecord) => {
    setEditingRecord(record);
    const vals: {
      segmentCode: string;
      segmentName: string;
      isActive: boolean;
      description?: string;
    } = {
      segmentCode: record.segmentCode,
      segmentName: record.segmentName,
      isActive: record.isActive,
    };
    if (record.description) vals.description = record.description;
    editForm.setFieldsValue(vals);
    setEditOpen(true);
  };

  const handleEdit = (values: SegmentFormValues) => {
    if (!editingRecord) return;
    const payload: Partial<CreateSegmentPayload> = {
      segmentName: values.segmentName.trim(),
      isActive: values.isActive,
    };
    if (values.description?.trim()) payload.description = values.description.trim();
    updateMutation.mutate({ id: editingRecord.segmentId, payload });
  };

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (s) => s.segmentCode.toLowerCase().includes(q) || s.segmentName.toLowerCase().includes(q),
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

  const columns: TableColumnsType<SegmentRecord> = [
    {
      title: 'Code',
      dataIndex: 'segmentCode',
      width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Segment Name', dataIndex: 'segmentName', ellipsis: true },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
  ];

  const segmentFormFields = (isCreate: boolean) => (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Segment Code"
            name="segmentCode"
            rules={[
              { required: true, message: 'Required' },
              { max: 20, message: 'Max 20 chars' },
            ]}
          >
            <Input
              placeholder="e.g. EQ"
              disabled={!isCreate}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label="Segment Name"
            name="segmentName"
            rules={[{ required: true, message: 'Required' }, { max: 200, message: 'Max 200 chars' }]}
          >
            <Input placeholder="e.g. Equity" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Description" name="description">
        <TextArea rows={2} placeholder="Optional description" />
      </Form.Item>
      <Form.Item label="Active" name="isActive" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Segments
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }} align="middle">
        <Col span={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by code or name"
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

      <DataTable<SegmentRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="segmentId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} segments`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedId(record.segmentId),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Detail drawer */}
      <SlideDrawer
        title={detail?.segmentName ?? 'Segment Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
        extra={
          detail && (
            <Button
              icon={<EditOutlined />}
              onClick={() => openEdit(detail)}
            >
              Edit
            </Button>
          )
        }
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.segmentCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.segmentName}</Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {detail.description ?? '—'}
              </Descriptions.Item>
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
        title="Add Segment"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          style={{ marginTop: 16 }}
        >
          {segmentFormFields(true)}
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
        title={`Edit Segment — ${editingRecord?.segmentCode ?? ''}`}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
          style={{ marginTop: 16 }}
        >
          {segmentFormFields(false)}
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
