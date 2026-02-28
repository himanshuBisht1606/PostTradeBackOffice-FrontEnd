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
  Select,
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
  getExchangeSegments,
  getExchangeSegmentById,
  createExchangeSegment,
  updateExchangeSegment,
} from '../../services/exchangeSegmentService';
import type {
  ExchangeSegmentRecord,
  CreateExchangeSegmentPayload,
} from '../../services/exchangeSegmentService';
import { getExchanges } from '../../services/exchangeService';
import { getSegments } from '../../services/segmentService';
import { SettlementType } from '@app-types/enums';

const { Title } = Typography;

const SETTLEMENT_OPTIONS = [
  { value: SettlementType.T1, label: 'T+1' },
  { value: SettlementType.T2, label: 'T+2' },
  { value: SettlementType.Intraday, label: 'Intraday' },
];

interface ExchangeSegmentFormValues {
  exchangeId: string;
  segmentId: string;
  exchangeSegmentCode: string;
  exchangeSegmentName: string;
  settlementType: SettlementType;
  isActive: boolean;
}

export function ExchangeSegmentListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm<ExchangeSegmentFormValues>();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<ExchangeSegmentFormValues>();
  const [editingRecord, setEditingRecord] = useState<ExchangeSegmentRecord | null>(null);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['exchange-segments'],
    queryFn: () => getExchangeSegments(),
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['exchange-segments', selectedId],
    queryFn: () => getExchangeSegmentById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const { data: exchanges = [] } = useQuery({
    queryKey: ['exchanges'],
    queryFn: getExchanges,
    staleTime: 60_000,
  });

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: getSegments,
    staleTime: 60_000,
  });

  // Lookup maps for display
  const exchangeMap = useMemo(
    () => new Map(exchanges.map((e) => [e.exchangeId, e])),
    [exchanges],
  );
  const segmentMap = useMemo(
    () => new Map(segments.map((s) => [s.segmentId, s])),
    [segments],
  );

  const exchangeOptions = useMemo(
    () =>
      exchanges
        .filter((e) => e.isActive)
        .map((e) => ({ value: e.exchangeId, label: `${e.exchangeCode} — ${e.exchangeName}` })),
    [exchanges],
  );

  const segmentOptions = useMemo(
    () =>
      segments
        .filter((s) => s.isActive)
        .map((s) => ({ value: s.segmentId, label: `${s.segmentCode} — ${s.segmentName}` })),
    [segments],
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateExchangeSegmentPayload) => createExchangeSegment(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['exchange-segments'] });
      setCreateOpen(false);
      createForm.resetFields();
      void message.success('Exchange segment created');
    },
    onError: () => void message.error('Failed to create exchange segment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateExchangeSegmentPayload>;
    }) => updateExchangeSegment(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['exchange-segments'] });
      if (editingRecord)
        void qc.invalidateQueries({
          queryKey: ['exchange-segments', editingRecord.exchangeSegmentId],
        });
      setEditOpen(false);
      setSelectedId(null);
      void message.success('Exchange segment updated');
    },
    onError: () => void message.error('Failed to update exchange segment'),
  });

  const handleCreate = (values: ExchangeSegmentFormValues) => {
    createMutation.mutate({
      exchangeId: values.exchangeId,
      segmentId: values.segmentId,
      exchangeSegmentCode: values.exchangeSegmentCode.toUpperCase().trim(),
      exchangeSegmentName: values.exchangeSegmentName.trim(),
      settlementType: values.settlementType,
      isActive: values.isActive,
    });
  };

  const openEdit = (record: ExchangeSegmentRecord) => {
    setEditingRecord(record);
    editForm.setFieldsValue({
      exchangeId: record.exchangeId,
      segmentId: record.segmentId,
      exchangeSegmentCode: record.exchangeSegmentCode,
      exchangeSegmentName: record.exchangeSegmentName,
      settlementType: record.settlementType,
      isActive: record.isActive,
    });
    setEditOpen(true);
  };

  const handleEdit = (values: ExchangeSegmentFormValues) => {
    if (!editingRecord) return;
    updateMutation.mutate({
      id: editingRecord.exchangeSegmentId,
      payload: {
        exchangeSegmentName: values.exchangeSegmentName.trim(),
        settlementType: values.settlementType,
        isActive: values.isActive,
      },
    });
  };

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (es) =>
        es.exchangeSegmentCode.toLowerCase().includes(q) ||
        es.exchangeSegmentName.toLowerCase().includes(q),
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

  const columns: TableColumnsType<ExchangeSegmentRecord> = [
    {
      title: 'Code',
      dataIndex: 'exchangeSegmentCode',
      width: 140,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Name', dataIndex: 'exchangeSegmentName', ellipsis: true },
    {
      title: 'Exchange',
      dataIndex: 'exchangeId',
      width: 80,
      render: (v: string) => exchangeMap.get(v)?.exchangeCode ?? v,
    },
    {
      title: 'Segment',
      dataIndex: 'segmentId',
      width: 80,
      render: (v: string) => segmentMap.get(v)?.segmentCode ?? v,
    },
    { title: 'Settlement', dataIndex: 'settlementType', width: 110 },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
  ];

  const createFormFields = () => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Exchange"
            name="exchangeId"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              showSearch
              options={exchangeOptions}
              placeholder="Select exchange"
              filterOption={(input, opt) =>
                (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Segment"
            name="segmentId"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              showSearch
              options={segmentOptions}
              placeholder="Select segment"
              filterOption={(input, opt) =>
                (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Code"
            name="exchangeSegmentCode"
            rules={[{ required: true, message: 'Required' }, { max: 30, message: 'Max 30 chars' }]}
          >
            <Input placeholder="e.g. NSE-EQ" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label="Name"
            name="exchangeSegmentName"
            rules={[{ required: true, message: 'Required' }, { max: 200, message: 'Max 200 chars' }]}
          >
            <Input placeholder="e.g. NSE Equity" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Settlement Type"
            name="settlementType"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={SETTLEMENT_OPTIONS} placeholder="Select settlement" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const editFormFields = () => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Exchange" name="exchangeId">
            <Select options={exchangeOptions} disabled />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Segment" name="segmentId">
            <Select options={segmentOptions} disabled />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="Code" name="exchangeSegmentCode">
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label="Name"
            name="exchangeSegmentName"
            rules={[{ required: true, message: 'Required' }, { max: 200, message: 'Max 200 chars' }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Settlement Type"
            name="settlementType"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={SETTLEMENT_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Exchange Segments
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
              createForm.setFieldsValue({ isActive: true, settlementType: SettlementType.T1 });
              setCreateOpen(true);
            }}
          >
            Add New
          </Button>
        </Col>
      </Row>

      <DataTable<ExchangeSegmentRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="exchangeSegmentId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} exchange segments`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedId(record.exchangeSegmentId),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Detail drawer */}
      <SlideDrawer
        title={detail?.exchangeSegmentName ?? 'Exchange Segment Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
        extra={
          detail && (
            <Button icon={<EditOutlined />} onClick={() => openEdit(detail)}>
              Edit
            </Button>
          )
        }
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.exchangeSegmentCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.exchangeSegmentName}</Descriptions.Item>
              <Descriptions.Item label="Exchange">
                {exchangeMap.get(detail.exchangeId)?.exchangeName ?? detail.exchangeId}
              </Descriptions.Item>
              <Descriptions.Item label="Segment">
                {segmentMap.get(detail.segmentId)?.segmentName ?? detail.segmentId}
              </Descriptions.Item>
              <Descriptions.Item label="Settlement Type">{detail.settlementType}</Descriptions.Item>
              <Descriptions.Item label="Active">
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
        title="Add Exchange Segment"
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
          {createFormFields()}
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
        title={`Edit — ${editingRecord?.exchangeSegmentCode ?? ''}`}
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
          {editFormFields()}
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
