import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Tag, Descriptions } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { getExchangeSegments, getExchangeSegmentById } from '../../services/exchangeSegmentService';
import type { ExchangeSegmentRecord } from '../../services/exchangeSegmentService';
import { truncateId } from '@utils/formatters';

const { Title } = Typography;

export function ExchangeSegmentListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      width: 160,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Name', dataIndex: 'exchangeSegmentName', ellipsis: true },
    { title: 'Settlement Type', dataIndex: 'settlementType', width: 140 },
    {
      title: 'Exchange ID',
      dataIndex: 'exchangeId',
      width: 100,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    {
      title: 'Segment ID',
      dataIndex: 'segmentId',
      width: 100,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
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
        Exchange Segments
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

      <SlideDrawer
        title={detail?.exchangeSegmentName ?? 'Exchange Segment Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.exchangeSegmentCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.exchangeSegmentName}</Descriptions.Item>
              <Descriptions.Item label="Settlement Type">{detail.settlementType}</Descriptions.Item>
              <Descriptions.Item label="Active">
                <Tag color={detail.isActive ? 'green' : 'default'}>
                  {detail.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Exchange ID" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{detail.exchangeId}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Segment ID" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{detail.segmentId}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </SlideDrawer>
    </div>
  );
}
