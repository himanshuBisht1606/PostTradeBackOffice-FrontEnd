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
import dayjs from 'dayjs';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { formatDate } from '@utils/formatters';
import {
  getInstruments,
  getInstrumentById,
  createInstrument,
  getFoContracts,
} from '../../services/instrumentService';
import type { InstrumentRecord, FoContractRecord, CreateInstrumentPayload } from '../../services/instrumentService';
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

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  IDF: 'FUTIDX',
  STF: 'FUTSTK',
  IDO: 'OPTIDX',
  STO: 'OPTSTK',
};

const CONTRACT_TYPE_COLOR: Record<string, string> = {
  IDF: 'cyan',
  STF: 'geekblue',
  IDO: 'orange',
  STO: 'gold',
};

const OPTION_TYPE_COLOR: Record<string, string> = {
  CE: 'blue',
  PE: 'volcano',
};

/** Builds contract name like OPTIDXNIFTY25MAR2026 */
function buildContractName(finInstrmTp: string, symbol: string, expiryDate: string | null): string {
  const label = CONTRACT_TYPE_LABEL[finInstrmTp] ?? finInstrmTp;
  if (!expiryDate) return `${label}${symbol}`;
  const expiry = dayjs(expiryDate).format('DDMMMYYYY').toUpperCase();
  return `${label}${symbol}${expiry}`;
}

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

// ── FO Contracts Tab (read-only, like trade book) ─────────────────────────────

function FoContractsTab() {
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [exchange, setExchange] = useState<string | undefined>(undefined);
  const [tradingDate, setTradingDate] = useState<string | undefined>(undefined);
  const [contractType, setContractType] = useState<string | undefined>(undefined);
  const [optionType, setOptionType] = useState<string | undefined>(undefined);
  const [symbol, setSymbol] = useState('');
  const [selectedContract, setSelectedContract] = useState<FoContractRecord | null>(null);

  const resetPage = () => setPage(1);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['fo-contracts', exchange, tradingDate, contractType, optionType, symbol, page],
    queryFn: () => {
      const params: Parameters<typeof getFoContracts>[0] = { page, pageSize };
      if (exchange) params.exchange = exchange;
      if (tradingDate) params.tradingDate = tradingDate;
      if (contractType) params.contractType = contractType;
      if (optionType) params.optionType = optionType;
      if (symbol.trim()) params.symbol = symbol.trim();
      return getFoContracts(params);
    },
    staleTime: 30_000,
  });

  const columns: TableColumnsType<FoContractRecord> = [
    { title: 'TradingDate', dataIndex: 'tradingDate', width: 110 },
    { title: 'Exchange', dataIndex: 'exchange', width: 80 },
    { title: 'FinInstrmTp', dataIndex: 'finInstrmTp', width: 95 },
    { title: 'TckrSymb', dataIndex: 'tckrSymb', width: 130 },
    { title: 'FinInstrmNm', dataIndex: 'finInstrmNm', width: 200, ellipsis: true },
    { title: 'StockNm', dataIndex: 'stockNm', width: 160, ellipsis: true },
    { title: 'XpryDt', dataIndex: 'xpryDt', width: 110 },
    { title: 'StrkPric', dataIndex: 'strkPric', width: 100, align: 'right' as const },
    { title: 'OptnTp', dataIndex: 'optnTp', width: 75 },
    { title: 'SttlmMtd', dataIndex: 'sttlmMtd', width: 85 },
    { title: 'MinLot', dataIndex: 'minLot', width: 75, align: 'right' as const },
    { title: 'NewBrdLotQty', dataIndex: 'newBrdLotQty', width: 110, align: 'right' as const },
    { title: 'FinInstrmId', dataIndex: 'finInstrmId', width: 150, ellipsis: true,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> },
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
              onChange={(d) => {
                setTradingDate(d ? d.format('YYYY-MM-DD') : undefined);
                resetPage();
              }}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="Exchange"
              style={{ width: '100%' }}
              allowClear
              value={exchange ?? null}
              onChange={(v) => { setExchange(v ?? undefined); resetPage(); }}
              options={[
                { label: 'NFO (NSE F&O)', value: 'NFO' },
                { label: 'BFO (BSE F&O)', value: 'BFO' },
              ]}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Contract Type"
              style={{ width: '100%' }}
              allowClear
              value={contractType ?? null}
              onChange={(v) => { setContractType(v ?? undefined); resetPage(); }}
              options={CONTRACT_TYPE_OPTIONS}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="CE / PE"
              style={{ width: '100%' }}
              allowClear
              value={optionType ?? null}
              onChange={(v) => { setOptionType(v ?? undefined); resetPage(); }}
              options={[
                { label: 'CE (Call)', value: 'CE' },
                { label: 'PE (Put)', value: 'PE' },
              ]}
            />
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={10}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by symbol"
              value={symbol}
              allowClear
              onChange={(e) => { setSymbol(e.target.value); resetPage(); }}
            />
          </Col>
        </Row>
      </Space>

      <DataTable<FoContractRecord>
        columns={columns}
        dataSource={contracts}
        loading={isLoading}
        rowKey="contractRowId"
        size="small"
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize,
          total: (page - 1) * pageSize + contracts.length,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (t) => `${t}+ contracts`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedContract(record),
          style: { cursor: 'pointer' },
        })}
      />

      {/* Contract detail drawer */}
      <SlideDrawer
        title={selectedContract
          ? buildContractName(selectedContract.finInstrmTp, selectedContract.tckrSymb, selectedContract.expiryDate)
          : 'Contract Detail'}
        open={!!selectedContract}
        onClose={() => setSelectedContract(null)}
      >
        {selectedContract && (
          <div style={{ padding: 24 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, marginBottom: 16, color: '#1d3557' }}>
              {buildContractName(selectedContract.finInstrmTp, selectedContract.tckrSymb, selectedContract.expiryDate)}
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Symbol">
                <strong>{selectedContract.tckrSymb}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Stock Name">
                {selectedContract.finInstrmNm || selectedContract.stockNm || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Exchange">
                <Tag color={selectedContract.exchange === 'NFO' ? 'blue' : 'purple'}>
                  {selectedContract.exchange}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Instrument">
                <Tag color={CONTRACT_TYPE_COLOR[selectedContract.finInstrmTp] ?? 'default'}>
                  {CONTRACT_TYPE_LABEL[selectedContract.finInstrmTp] ?? selectedContract.finInstrmTp}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trading Date">
                {formatDate(selectedContract.tradingDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry">
                {selectedContract.expiryDate ? formatDate(selectedContract.expiryDate) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Strike Price">
                {selectedContract.strkPric > 0
                  ? selectedContract.strkPric.toLocaleString('en-IN')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Option Type">
                {selectedContract.optnTp ? (
                  <Tag color={OPTION_TYPE_COLOR[selectedContract.optnTp] ?? 'default'}>
                    {selectedContract.optnTp}
                  </Tag>
                ) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Lot Size">{selectedContract.newBrdLotQty.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="Fin Instrument ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selectedContract.finInstrmId}</span>
              </Descriptions.Item>
            </Descriptions>
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
