import { useState, useCallback, useMemo } from 'react';
import {
  Typography,
  Input,
  InputNumber,
  Row,
  Col,
  Select,
  Descriptions,
  Tabs,
  Button,
  Modal,
  Form,
  Tag,
  Space,
  DatePicker,
  message,
} from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { formatDate } from '@utils/formatters';
import {
  getInstruments,
  getInstrumentById,
  createInstrument,
  getFoContractsCurated,
  registerFoContractCurated,
} from '../../services/instrumentService';
import type { InstrumentRecord, FoContractCuratedRecord, CreateInstrumentPayload } from '../../services/instrumentService';
import type { InstrumentStatus } from '@app-types/enums';
import { InstrumentType, OptionType } from '@app-types/enums';
import { getExchangeSegments } from '../../services/exchangeSegmentService';

const { Title } = Typography;

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTRACT_TYPE_OPTIONS = [
  { label: 'FUTIDX — Index Future', value: 'IDF' },
  { label: 'FUTSTK — Stock Future', value: 'STF' },
  { label: 'OPTIDX — Index Option', value: 'IDO' },
  { label: 'OPTSTK — Stock Option', value: 'STO' },
];

// ── Instruments Tab ───────────────────────────────────────────────────────────

function InstrumentsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InstrumentType | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [contractTypeForCreate, setContractTypeForCreate] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['instruments'],
    queryFn: getInstruments,
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['instruments', selectedId],
    queryFn: () => getInstrumentById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const { data: exchangeSegments = [] } = useQuery({
    queryKey: ['exchange-segments'],
    queryFn: () => getExchangeSegments(),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createInstrument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instruments'] });
      setCreateOpen(false);
      form.resetFields();
      setContractTypeForCreate(undefined);
      void message.success('Instrument created');
    },
    onError: () => {
      void message.error('Failed to create instrument');
    },
  });

  const filtered = useMemo(() => {
    let data = allData;
    if (typeFilter) data = data.filter((i) => i.instrumentType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (i) =>
          i.instrumentCode.toLowerCase().includes(q) ||
          i.symbol.toLowerCase().includes(q) ||
          i.instrumentName.toLowerCase().includes(q),
      );
    }
    return data;
  }, [allData, search, typeFilter]);

  const pageData = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const isOption = contractTypeForCreate === 'IDO' || contractTypeForCreate === 'STO';

  const segmentOptions = exchangeSegments.map((es) => ({
    label: `${es.exchangeSegmentCode} — ${es.exchangeSegmentName}`,
    value: `${es.exchangeId}|${es.segmentId}`,
  }));

  const columns: TableColumnsType<InstrumentRecord> = [
    {
      title: 'Code',
      dataIndex: 'instrumentCode',
      width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Symbol', dataIndex: 'symbol', width: 110, render: (v: string) => <strong>{v}</strong> },
    { title: 'Name', dataIndex: 'instrumentName', ellipsis: true },
    { title: 'Type', dataIndex: 'instrumentType', width: 100 },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      width: 100,
      render: (v: string | null) => (v ? formatDate(v) : '—'),
    },
    {
      title: 'Strike',
      dataIndex: 'strikePrice',
      width: 90,
      align: 'right' as const,
      render: (v: number | null) => (v ? v.toLocaleString('en-IN') : '—'),
    },
    { title: 'Lot', dataIndex: 'lotSize', width: 70, align: 'right' as const },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 90,
      render: (v: InstrumentStatus) => <StatusBadge status={v} />,
    },
  ];

  const handleCreate = () => {
    form
      .validateFields()
      .then((vals) => {
        const raw = vals as unknown as Record<string, unknown>;
        const parts = (raw['exchangeSegment'] as string).split('|');
        const exchangeId = parts[0] as string;
        const segmentId = parts[1] as string;
        const ct = raw['contractType'] as string;
        const instType = ct === 'IDO' || ct === 'STO' ? InstrumentType.Options : InstrumentType.Futures;
        const sym = raw['symbol'] as string;
        const payload: CreateInstrumentPayload = {
          instrumentCode: sym,
          instrumentName: (raw['instrumentName'] as string | undefined) || sym,
          symbol: sym,
          exchangeId,
          segmentId,
          instrumentType: instType,
          lotSize: raw['lotSize'] as number,
          tickSize: 0.05,
          expiryDate: (raw['expiryDate'] as string | undefined) || null,
          strikePrice: isOption ? ((raw['strikePrice'] as number | undefined) ?? null) : null,
          optionType: isOption ? ((raw['optionType'] as OptionType | undefined) ?? null) : null,
        };
        createMutation.mutate(payload);
      })
      .catch(() => undefined);
  };

  return (
    <>
      <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
        <Row gutter={12} align="middle">
          <Col span={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by code, symbol, or name"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select<InstrumentType>
              placeholder="Instrument Type"
              style={{ width: '100%' }}
              allowClear
              value={typeFilter ?? null}
              onChange={(v) => { setTypeFilter(v ?? undefined); setPage(1); }}
              options={Object.values(InstrumentType).map((t) => ({ label: t, value: t }))}
            />
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Add Instrument
            </Button>
          </Col>
        </Row>
      </Space>

      <DataTable<InstrumentRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="instrumentId"
        size="small"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} instruments`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedId(record.instrumentId),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Detail drawer */}
      <SlideDrawer
        title={detail ? `${detail.symbol} — ${detail.instrumentName}` : 'Instrument Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.instrumentCode}</Descriptions.Item>
              <Descriptions.Item label="Symbol">{detail.symbol}</Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>{detail.instrumentName}</Descriptions.Item>
              <Descriptions.Item label="Type">{detail.instrumentType}</Descriptions.Item>
              <Descriptions.Item label="ISIN">{detail.isin ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Lot Size">{detail.lotSize}</Descriptions.Item>
              <Descriptions.Item label="Tick Size">{detail.tickSize}</Descriptions.Item>
              <Descriptions.Item label="Expiry">
                {detail.expiryDate ? formatDate(detail.expiryDate) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Strike">{detail.strikePrice ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Option Type">{detail.optionType ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Status"><StatusBadge status={detail.status} /></Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </SlideDrawer>

      {/* Add Instrument Modal */}
      <Modal
        title="Add Instrument"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); setContractTypeForCreate(undefined); }}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        destroyOnClose
        width={580}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item
                name="exchangeSegment"
                label="Exchange Segment"
                rules={[{ required: true, message: 'Select exchange segment' }]}
              >
                <Select
                  showSearch
                  placeholder="e.g. NSE-FO"
                  filterOption={(input, opt) =>
                    (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={segmentOptions}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="contractType"
                label="Contract Type"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="e.g. FUTIDX"
                  options={CONTRACT_TYPE_OPTIONS}
                  onChange={(v: string) => {
                    setContractTypeForCreate(v);
                    form.setFieldValue('optionType', undefined);
                    form.setFieldValue('strikePrice', undefined);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="symbol"
                label="Symbol"
                rules={[{ required: true, message: 'Enter symbol' }]}
                extra="e.g. NIFTY, BANKNIFTY, RELIANCE"
              >
                <Input style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="instrumentName" label="Instrument / Stock Name">
                <Input placeholder="Optional — defaults to symbol" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="expiryDate"
                label="Expiry Date"
                rules={[{ required: true, message: 'Select expiry date' }]}
                getValueFromEvent={(d: Dayjs | null) => d ? d.format('YYYY-MM-DD') : null}
              >
                <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lotSize"
                label="Lot Size"
                rules={[{ required: true, message: 'Enter lot size' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} precision={0} />
              </Form.Item>
            </Col>
          </Row>

          {/* Option-specific fields — shown only for OPTIDX / OPTSTK */}
          {isOption && (
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item
                  name="optionType"
                  label="Option Type"
                  rules={[{ required: true, message: 'Select CE or PE' }]}
                >
                  <Select
                    placeholder="CE / PE"
                    options={[
                      { label: 'CE (Call)', value: OptionType.Call },
                      { label: 'PE (Put)', value: OptionType.Put },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  name="strikePrice"
                  label="Strike Price"
                  rules={[{ required: true, message: 'Enter strike price' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} step={50} precision={2} />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </>
  );
}

// ── FO Contracts Tab — from FoContracts (curated) table ──────────────────────

const INSTR_TYPE_COLOR: Record<string, string> = {
  FUTIDX: 'cyan', FUTSTK: 'geekblue', OPTIDX: 'orange', OPTSTK: 'gold',
};

function FoContractsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [exchange, setExchange] = useState<string | undefined>(undefined);
  const [tradingDate, setTradingDate] = useState<string | undefined>(undefined);
  const [instrumentType, setInstrumentType] = useState<string | undefined>(undefined);
  const [optionType, setOptionType] = useState<string | undefined>(undefined);
  const [symbol, setSymbol] = useState('');
  const [selected, setSelected] = useState<FoContractCuratedRecord | null>(null);
  const resetPage = () => setPage(1);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['fo-contracts-curated', exchange, tradingDate, instrumentType, optionType, symbol, page],
    queryFn: () => getFoContractsCurated({
      exchange: exchange ?? undefined,
      tradingDate: tradingDate ?? undefined,
      instrumentType: instrumentType ?? undefined,
      optionType: optionType ?? undefined,
      symbol: symbol.trim() || undefined,
      page,
      pageSize,
    }),
    staleTime: 30_000,
  });

  const registerMutation = useMutation({
    mutationFn: (contractId: string) => registerFoContractCurated(contractId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['fo-contracts-curated'] });
      void queryClient.invalidateQueries({ queryKey: ['instruments'] });
      void message.success('Contract registered as instrument');
      setSelected(null);
    },
    onError: (err: Error) => {
      void message.error(err.message ?? 'Registration failed');
    },
  });

  const INSTR_TYPE_OPTIONS = [
    { label: 'FUTIDX — Index Future',  value: 'FUTIDX' },
    { label: 'FUTSTK — Stock Future',  value: 'FUTSTK' },
    { label: 'OPTIDX — Index Option',  value: 'OPTIDX' },
    { label: 'OPTSTK — Stock Option',  value: 'OPTSTK' },
  ];

  const columns: TableColumnsType<FoContractCuratedRecord> = [
    {
      title: 'Contract Name',
      dataIndex: 'contractName',
      width: 210,
      ellipsis: true,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'instrumentType',
      width: 90,
      render: (v: string) => <Tag color={INSTR_TYPE_COLOR[v] ?? 'default'}>{v}</Tag>,
    },
    { title: 'Symbol', dataIndex: 'symbol', width: 110, render: (v: string) => <strong>{v}</strong> },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      width: 105,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Strike (₹)',
      dataIndex: 'strikePrice',
      width: 100,
      align: 'right' as const,
      render: (v: number) => v > 0 ? v.toLocaleString('en-IN') : '—',
    },
    {
      title: 'Opt',
      dataIndex: 'optionType',
      width: 55,
      render: (v: string) => v === 'FX' ? '—' : <Tag color={v === 'CE' ? 'blue' : 'volcano'} style={{ margin: 0 }}>{v}</Tag>,
    },
    { title: 'Lot', dataIndex: 'lotSize', width: 65, align: 'right' as const },
    { title: 'F×', dataIndex: 'fMultiplier', width: 55, align: 'right' as const,
      render: (v: number) => v === 1 ? '1' : v },
    { title: 'Exchange', dataIndex: 'exchange', width: 75,
      render: (v: string) => <Tag color={v === 'NFO' ? 'blue' : 'purple'}>{v}</Tag> },
    {
      title: 'Status',
      dataIndex: 'registeredInstrumentId',
      width: 105,
      render: (v: string | null) =>
        v
          ? <Tag color="green">Registered</Tag>
          : <Tag color="default">Unregistered</Tag>,
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_: unknown, record: FoContractCuratedRecord) =>
        record.registeredInstrumentId ? null : (
          <Button
            size="small"
            type="primary"
            loading={registerMutation.isPending && registerMutation.variables === record.contractId}
            onClick={(e) => {
              e.stopPropagation();
              registerMutation.mutate(record.contractId);
            }}
          >
            Register
          </Button>
        ),
    },
  ];

  return (
    <>
      <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
        <Row gutter={12}>
          <Col span={5}>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Trading Date"
              format="DD-MMM-YYYY"
              allowClear
              onChange={(d) => { setTradingDate(d ? d.format('YYYY-MM-DD') : undefined); resetPage(); }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Exchange"
              style={{ width: '100%' }}
              allowClear
              value={exchange ?? null}
              onChange={(v) => { setExchange(v ?? undefined); resetPage(); }}
              options={[
                { label: 'NFO', value: 'NFO' },
                { label: 'BFO', value: 'BFO' },
              ]}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Instrument Type"
              style={{ width: '100%' }}
              allowClear
              value={instrumentType ?? null}
              onChange={(v) => { setInstrumentType(v ?? undefined); resetPage(); }}
              options={INSTR_TYPE_OPTIONS}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="CE / PE / FX"
              style={{ width: '100%' }}
              allowClear
              value={optionType ?? null}
              onChange={(v) => { setOptionType(v ?? undefined); resetPage(); }}
              options={[
                { label: 'CE (Call)', value: 'CE' },
                { label: 'PE (Put)', value: 'PE' },
                { label: 'FX (Futures)', value: 'FX' },
              ]}
            />
          </Col>
          <Col span={5}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Symbol"
              value={symbol}
              allowClear
              onChange={(e) => { setSymbol(e.target.value); resetPage(); }}
            />
          </Col>
        </Row>
      </Space>

      <DataTable<FoContractCuratedRecord>
        columns={columns}
        dataSource={contracts}
        loading={isLoading}
        rowKey="contractId"
        size="small"
        scroll={{ x: 960 }}
        pagination={{
          current: page,
          pageSize,
          total: (page - 1) * pageSize + contracts.length,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (t) => `${t}+ contracts`,
        }}
        onRow={(record) => ({
          onClick: () => setSelected(record),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Contract detail drawer */}
      <SlideDrawer
        title={selected?.contractName ?? 'Contract Detail'}
        open={!!selected}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div style={{ padding: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#1d3557' }}>
              {selected.contractName}
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Symbol"><strong>{selected.symbol}</strong></Descriptions.Item>
              <Descriptions.Item label="Underlying">{selected.underlyingSymbol || '—'}</Descriptions.Item>
              <Descriptions.Item label="Exchange">
                <Tag color={selected.exchange === 'NFO' ? 'blue' : 'purple'}>{selected.exchange}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={INSTR_TYPE_COLOR[selected.instrumentType] ?? 'default'}>{selected.instrumentType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trading Date">{formatDate(selected.tradingDate)}</Descriptions.Item>
              <Descriptions.Item label="Expiry Date">{formatDate(selected.expiryDate)}</Descriptions.Item>
              <Descriptions.Item label="Strike (₹)">
                {selected.strikePrice > 0 ? selected.strikePrice.toLocaleString('en-IN') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Option Type">
                {selected.optionType !== 'FX'
                  ? <Tag color={selected.optionType === 'CE' ? 'blue' : 'volcano'}>{selected.optionType}</Tag>
                  : '— (Futures)'}
              </Descriptions.Item>
              <Descriptions.Item label="Lot Size">{selected.lotSize.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="F-Multiplier">{selected.fMultiplier}</Descriptions.Item>
              <Descriptions.Item label="Tick Size">{selected.tickSize}</Descriptions.Item>
              <Descriptions.Item label="Settlement">{selected.sttlmMtd ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="ISIN" span={2}>{selected.isin ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Fin Instr ID" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.finInstrmId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                {selected.registeredInstrumentId
                  ? <Tag color="green">Registered as Instrument</Tag>
                  : <Tag color="orange">Not yet registered</Tag>}
              </Descriptions.Item>
            </Descriptions>
            {!selected.registeredInstrumentId && (
              <div style={{ marginTop: 20 }}>
                <Button
                  type="primary"
                  block
                  loading={registerMutation.isPending}
                  onClick={() => registerMutation.mutate(selected.contractId)}
                >
                  Register as Instrument
                </Button>
              </div>
            )}
          </div>
        )}
      </SlideDrawer>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function InstrumentListPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Instruments
      </Title>
      <Tabs
        defaultActiveKey="instruments"
        items={[
          { key: 'instruments', label: 'Instruments', children: <InstrumentsTab /> },
          { key: 'fo-contracts', label: 'FO Contracts', children: <FoContractsTab /> },
        ]}
      />
    </div>
  );
}
