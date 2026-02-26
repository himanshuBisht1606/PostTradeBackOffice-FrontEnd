import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Tag, Select, Descriptions } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { getInstruments, getInstrumentById } from '../../services/instrumentService';
import type { InstrumentRecord } from '../../services/instrumentService';
import { InstrumentType, InstrumentStatus } from '@app-types/enums';

const { Title } = Typography;

export function InstrumentListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InstrumentType | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const columns: TableColumnsType<InstrumentRecord> = [
    {
      title: 'Code',
      dataIndex: 'instrumentCode',
      width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Symbol', dataIndex: 'symbol', width: 110 },
    { title: 'Name', dataIndex: 'instrumentName', ellipsis: true },
    { title: 'Type', dataIndex: 'instrumentType', width: 110 },
    { title: 'Lot Size', dataIndex: 'lotSize', width: 90, align: 'right' },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      width: 110,
      render: (v: string | null) => (v ? v.slice(0, 10) : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: (v: InstrumentStatus) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Instruments
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by code, symbol, or name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select<InstrumentType>
            placeholder="Instrument Type"
            style={{ width: '100%' }}
            allowClear
            value={typeFilter ?? null}
            onChange={(v) => {
              setTypeFilter(v ?? undefined);
              setPage(1);
            }}
            options={Object.values(InstrumentType).map((t) => ({ label: t, value: t }))}
          />
        </Col>
      </Row>

      <DataTable<InstrumentRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="instrumentId"
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
              <Descriptions.Item label="ISIN">{detail.isin ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Type">{detail.instrumentType}</Descriptions.Item>
              <Descriptions.Item label="Lot Size">{detail.lotSize}</Descriptions.Item>
              <Descriptions.Item label="Tick Size">{detail.tickSize}</Descriptions.Item>
              <Descriptions.Item label="Series">{detail.series ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                {detail.expiryDate ? detail.expiryDate.slice(0, 10) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Strike Price">
                {detail.strikePrice ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Option Type">{detail.optionType ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <StatusBadge status={detail.status} />
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </SlideDrawer>
    </div>
  );
}
