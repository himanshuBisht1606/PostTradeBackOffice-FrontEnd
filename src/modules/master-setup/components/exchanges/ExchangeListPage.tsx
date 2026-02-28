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
  TimePicker,
  message,
} from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import {
  getExchanges,
  getExchangeById,
  createExchange,
  updateExchange,
} from '../../services/exchangeService';
import type { ExchangeRecord, CreateExchangePayload } from '../../services/exchangeService';

const { Title } = Typography;

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'UTC', label: 'UTC' },
];

interface ExchangeFormValues {
  exchangeCode: string;
  exchangeName: string;
  country: string;
  timeZone?: string;
  tradingStartTime?: dayjs.Dayjs | null;
  tradingEndTime?: dayjs.Dayjs | null;
  isActive: boolean;
}

function toTimeString(d: dayjs.Dayjs | null | undefined): string | undefined {
  if (!d) return undefined;
  return d.format('HH:mm:ss');
}

function fromTimeString(t: string | null | undefined): dayjs.Dayjs | null {
  if (!t) return null;
  return dayjs(`1970-01-01T${t}`);
}

export function ExchangeListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm<ExchangeFormValues>();

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<ExchangeFormValues>();
  const [editingRecord, setEditingRecord] = useState<ExchangeRecord | null>(null);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['exchanges'],
    queryFn: getExchanges,
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['exchanges', selectedId],
    queryFn: () => getExchangeById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateExchangePayload) => createExchange(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['exchanges'] });
      setCreateOpen(false);
      createForm.resetFields();
      void message.success('Exchange created');
    },
    onError: () => void message.error('Failed to create exchange'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateExchangePayload> }) =>
      updateExchange(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['exchanges'] });
      if (editingRecord) void qc.invalidateQueries({ queryKey: ['exchanges', editingRecord.exchangeId] });
      setEditOpen(false);
      setSelectedId(null);
      void message.success('Exchange updated');
    },
    onError: () => void message.error('Failed to update exchange'),
  });

  const handleCreate = (values: ExchangeFormValues) => {
    const payload: CreateExchangePayload = {
      exchangeCode: values.exchangeCode.toUpperCase().trim(),
      exchangeName: values.exchangeName.trim(),
      country: values.country.trim(),
      isActive: values.isActive,
    };
    if (values.timeZone) payload.timeZone = values.timeZone;
    const st = toTimeString(values.tradingStartTime);
    if (st) payload.tradingStartTime = st;
    const et = toTimeString(values.tradingEndTime);
    if (et) payload.tradingEndTime = et;
    createMutation.mutate(payload);
  };

  const openEdit = (record: ExchangeRecord) => {
    setEditingRecord(record);
    const vals: {
      exchangeCode: string;
      exchangeName: string;
      country: string;
      isActive: boolean;
      tradingStartTime: dayjs.Dayjs | null;
      tradingEndTime: dayjs.Dayjs | null;
      timeZone?: string;
    } = {
      exchangeCode: record.exchangeCode,
      exchangeName: record.exchangeName,
      country: record.country,
      isActive: record.isActive,
      tradingStartTime: fromTimeString(record.tradingStartTime),
      tradingEndTime: fromTimeString(record.tradingEndTime),
    };
    if (record.timeZone) vals.timeZone = record.timeZone;
    editForm.setFieldsValue(vals);
    setEditOpen(true);
  };

  const handleEdit = (values: ExchangeFormValues) => {
    if (!editingRecord) return;
    const payload: Partial<CreateExchangePayload> = {
      exchangeName: values.exchangeName.trim(),
      country: values.country.trim(),
      isActive: values.isActive,
    };
    if (values.timeZone) payload.timeZone = values.timeZone;
    const st = toTimeString(values.tradingStartTime);
    if (st) payload.tradingStartTime = st;
    const et = toTimeString(values.tradingEndTime);
    if (et) payload.tradingEndTime = et;
    updateMutation.mutate({ id: editingRecord.exchangeId, payload });
  };

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (e) => e.exchangeCode.toLowerCase().includes(q) || e.exchangeName.toLowerCase().includes(q),
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

  const columns: TableColumnsType<ExchangeRecord> = [
    {
      title: 'Code',
      dataIndex: 'exchangeCode',
      width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Exchange Name', dataIndex: 'exchangeName', ellipsis: true },
    { title: 'Country', dataIndex: 'country', width: 120 },
    {
      title: 'Timezone',
      dataIndex: 'timeZone',
      width: 160,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Start Time',
      dataIndex: 'tradingStartTime',
      width: 110,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'End Time',
      dataIndex: 'tradingEndTime',
      width: 110,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
  ];

  const exchangeFormFields = (isCreate: boolean) => (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Exchange Code"
            name="exchangeCode"
            rules={[
              { required: true, message: 'Required' },
              { max: 20, message: 'Max 20 chars' },
            ]}
          >
            <Input
              placeholder="e.g. NSE"
              disabled={!isCreate}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item
            label="Exchange Name"
            name="exchangeName"
            rules={[{ required: true, message: 'Required' }, { max: 200, message: 'Max 200 chars' }]}
          >
            <Input placeholder="e.g. National Stock Exchange of India" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Country"
            name="country"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g. India" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Timezone" name="timeZone">
            <Select
              options={TIMEZONE_OPTIONS}
              placeholder="Select timezone"
              allowClear
              showSearch
              filterOption={(input, opt) =>
                (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Trading Start Time" name="tradingStartTime">
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Trading End Time" name="tradingEndTime">
            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} />
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
        Exchanges
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

      <DataTable<ExchangeRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="exchangeId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} exchanges`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedId(record.exchangeId),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Detail drawer */}
      <SlideDrawer
        title={detail?.exchangeName ?? 'Exchange Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
        extra={
          detail && (
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                openEdit(detail);
              }}
            >
              Edit
            </Button>
          )
        }
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.exchangeCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.exchangeName}</Descriptions.Item>
              <Descriptions.Item label="Country">{detail.country}</Descriptions.Item>
              <Descriptions.Item label="Timezone">{detail.timeZone ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Trading Start">
                {detail.tradingStartTime ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trading End">
                {detail.tradingEndTime ?? '—'}
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
        title="Add Exchange"
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
          {exchangeFormFields(true)}
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
        title={`Edit Exchange — ${editingRecord?.exchangeCode ?? ''}`}
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
          {exchangeFormFields(false)}
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
