import { useState, useCallback } from 'react';
import { Typography, Row, Col, Input, Select, DatePicker, Space, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { TradeTable } from './TradeTable';
import { TradeDrawer } from './TradeDrawer';
import { getFoTradeBook } from '../../services/foTradeBookService';
import type { FoTradeBookItem } from '../../services/foTradeBookService';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const today = dayjs().format('YYYY-MM-DD');

export function TradeListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [dateFrom, setDateFrom] = useState<string>(today);
  const [dateTo, setDateTo] = useState<string>(today);
  const [exchange, setExchange] = useState<string | undefined>(undefined);
  const [contractType, setContractType] = useState<string | undefined>(undefined);
  const [optionType, setOptionType] = useState<string | undefined>(undefined);
  const [side, setSide] = useState<string | undefined>(undefined);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [clientCodeSearch, setClientCodeSearch] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<FoTradeBookItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['fo-trade-book', dateFrom, dateTo, exchange, contractType, optionType, side, symbolSearch, clientCodeSearch, page, pageSize],
    queryFn: () =>
      getFoTradeBook({
        dateFrom,
        dateTo,
        exchange: exchange || undefined,
        contractType: contractType || undefined,
        optionType: optionType || undefined,
        side: side || undefined,
        symbol: symbolSearch.trim() || undefined,
        clientCode: clientCodeSearch.trim() || undefined,
        page,
        pageSize,
      }),
    staleTime: 30_000,
  });

  const handleDateChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      if (dates?.[0] && dates[1]) {
        setDateFrom(dates[0].format('YYYY-MM-DD'));
        setDateTo(dates[1].format('YYYY-MM-DD'));
      } else {
        setDateFrom(today);
        setDateTo(today);
      }
      setPage(1);
    },
    [],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const resetPage = () => setPage(1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
          FO Trade Book
        </Title>
        {data && (
          <Tag color="blue">{data.totalCount.toLocaleString('en-IN')} records</Tag>
        )}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
        <Row gutter={12}>
          <Col span={8}>
            <RangePicker
              style={{ width: '100%' }}
              defaultValue={[dayjs(today), dayjs(today)]}
              onChange={handleDateChange}
              allowClear={false}
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
                { label: 'NFO (NSE F&O)', value: 'NFO' },
                { label: 'BFO (BSE F&O)', value: 'BFO' },
              ]}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="Contract Type"
              style={{ width: '100%' }}
              allowClear
              value={contractType ?? null}
              onChange={(v) => { setContractType(v ?? undefined); resetPage(); }}
              options={[
                { label: 'FUTIDX — Index Future', value: 'FUTIDX' },
                { label: 'FUTSTK — Stock Future', value: 'FUTSTK' },
                { label: 'OPTIDX — Index Option', value: 'OPTIDX' },
                { label: 'OPTSTK — Stock Option', value: 'OPTSTK' },
              ]}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Option Type"
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
          <Col span={3}>
            <Select
              placeholder="Side"
              style={{ width: '100%' }}
              allowClear
              value={side ?? null}
              onChange={(v) => { setSide(v ?? undefined); resetPage(); }}
              options={[
                { label: 'Buy', value: 'B' },
                { label: 'Sell', value: 'S' },
              ]}
            />
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search symbol or instrument name"
              value={symbolSearch}
              allowClear
              onChange={(e) => { setSymbolSearch(e.target.value); resetPage(); }}
            />
          </Col>
          <Col span={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search client code"
              value={clientCodeSearch}
              allowClear
              onChange={(e) => { setClientCodeSearch(e.target.value); resetPage(); }}
            />
          </Col>
        </Row>
      </Space>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <TradeTable
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.totalCount ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onRowClick={setSelectedTrade}
      />

      <TradeDrawer trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
    </div>
  );
}
