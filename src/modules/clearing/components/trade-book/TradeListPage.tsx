import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Input, Select, DatePicker } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getTrades } from '../../services/tradeService';
import { TradeTable } from './TradeTable';
import { TradeDrawer } from './TradeDrawer';
import { TradeStatus, TradeSide } from '@types/enums';
import type { TradeSummary } from '../../services/tradeService';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export function TradeListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [side, setSide] = useState<TradeSide | undefined>(undefined);
  const [status, setStatus] = useState<TradeStatus | undefined>(undefined);
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['trades', { status, fromDate, toDate }],
    queryFn: () => getTrades({ status, fromDate, toDate }),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!allData) return [];
    const q = search.toLowerCase();
    return allData.filter((t) => {
      const matchSide = !side || t.side === side;
      const matchSearch =
        !q || t.tradeNo.toLowerCase().includes(q) || t.settlementNo.toLowerCase().includes(q);
      return matchSide && matchSearch;
    });
  }, [allData, search, side]);

  const pageData = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const handleRowClick = useCallback((trade: TradeSummary) => {
    setSelectedId(trade.tradeId);
  }, []);

  const handleDateChange = useCallback((dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates?.[0] && dates[1]) {
      setFromDate(dates[0].format('YYYY-MM-DD'));
      setToDate(dates[1].format('YYYY-MM-DD'));
    } else {
      setFromDate(undefined);
      setToDate(undefined);
    }
    setPage(1);
  }, []);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Trade Book
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={7}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by trade no or settlement no"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select<TradeSide>
            placeholder="Side"
            style={{ width: '100%' }}
            allowClear
            value={side}
            onChange={(v) => { setSide(v); setPage(1); }}
            options={[
              { label: 'Buy', value: TradeSide.Buy },
              { label: 'Sell', value: TradeSide.Sell },
            ]}
          />
        </Col>
        <Col span={5}>
          <Select<TradeStatus>
            placeholder="Status"
            style={{ width: '100%' }}
            allowClear
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: 'Booked', value: TradeStatus.Booked },
              { label: 'Confirmed', value: TradeStatus.Confirmed },
              { label: 'Settled', value: TradeStatus.Settled },
              { label: 'Cancelled', value: TradeStatus.Cancelled },
              { label: 'Rejected', value: TradeStatus.Rejected },
            ]}
          />
        </Col>
        <Col span={8}>
          <RangePicker style={{ width: '100%' }} onChange={handleDateChange} />
        </Col>
      </Row>

      <TradeTable
        data={pageData}
        loading={isLoading}
        total={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
      />

      <TradeDrawer tradeId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
