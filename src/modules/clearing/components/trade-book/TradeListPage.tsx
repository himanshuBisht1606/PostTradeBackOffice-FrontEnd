import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Input, Select, DatePicker, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getTrades } from '../../services/tradeService';
import { TradeTable } from './TradeTable';
import { TradeDrawer } from './TradeDrawer';
import { BookTradeModal } from './BookTradeModal';
import { TradeStatus, TradeSide } from '@app-types/enums';
import type { TradeSummary } from '../../services/tradeService';
import type { Dayjs } from 'dayjs';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const CAN_BOOK_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.OperationsController];

export function TradeListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [side, setSide] = useState<TradeSide | undefined>(undefined);
  const [status, setStatus] = useState<TradeStatus | undefined>(undefined);
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookModalOpen, setBookModalOpen] = useState(false);

  const { hasRole } = useAuthStore();
  const canBook = hasRole(CAN_BOOK_ROLES);

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
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Trade Book
          </Title>
        </Col>
        {canBook && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setBookModalOpen(true)}
            >
              Book Trade
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={7}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by trade no or settlement no"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select<TradeSide>
            placeholder="Side"
            style={{ width: '100%' }}
            allowClear
            value={side ?? null}
            onChange={(v) => {
              setSide(v);
              setPage(1);
            }}
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
            value={status ?? null}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { label: 'Pending', value: TradeStatus.Pending },
              { label: 'Validated', value: TradeStatus.Validated },
              { label: 'Settled', value: TradeStatus.Settled },
              { label: 'Rejected', value: TradeStatus.Rejected },
              { label: 'Amended', value: TradeStatus.Amended },
              { label: 'Cancelled', value: TradeStatus.Cancelled },
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

      <BookTradeModal open={bookModalOpen} onClose={() => setBookModalOpen(false)} />
    </div>
  );
}
