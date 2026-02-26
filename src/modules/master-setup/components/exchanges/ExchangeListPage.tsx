import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Tag, Descriptions } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { getExchanges, getExchangeById } from '../../services/exchangeService';
import type { ExchangeRecord } from '../../services/exchangeService';

const { Title } = Typography;

export function ExchangeListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (e) =>
        e.exchangeCode.toLowerCase().includes(q) || e.exchangeName.toLowerCase().includes(q),
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
    { title: 'Timezone', dataIndex: 'timeZone', width: 160, render: (v: string | null) => v ?? '—' },
    { title: 'Start Time', dataIndex: 'tradingStartTime', width: 110, render: (v: string | null) => v ?? '—' },
    { title: 'End Time', dataIndex: 'tradingEndTime', width: 110, render: (v: string | null) => v ?? '—' },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Exchanges
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }}>
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

      <SlideDrawer
        title={detail?.exchangeName ?? 'Exchange Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.exchangeCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.exchangeName}</Descriptions.Item>
              <Descriptions.Item label="Country">{detail.country}</Descriptions.Item>
              <Descriptions.Item label="Timezone">{detail.timeZone ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Trading Start">{detail.tradingStartTime ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Trading End">{detail.tradingEndTime ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Active" span={2}>
                <Tag color={detail.isActive ? 'green' : 'default'}>
                  {detail.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </SlideDrawer>
    </div>
  );
}
