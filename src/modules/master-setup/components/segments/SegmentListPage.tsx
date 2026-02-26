import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Tag, Descriptions } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { getSegments, getSegmentById } from '../../services/segmentService';
import type { SegmentRecord } from '../../services/segmentService';

const { Title } = Typography;

export function SegmentListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['segments'],
    queryFn: getSegments,
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['segments', selectedId],
    queryFn: () => getSegmentById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (s) => s.segmentCode.toLowerCase().includes(q) || s.segmentName.toLowerCase().includes(q),
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

  const columns: TableColumnsType<SegmentRecord> = [
    {
      title: 'Code',
      dataIndex: 'segmentCode',
      width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Segment Name', dataIndex: 'segmentName', ellipsis: true },
    { title: 'Description', dataIndex: 'description', ellipsis: true, render: (v: string | null) => v ?? '—' },
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
        Segments
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

      <DataTable<SegmentRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="segmentId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} segments`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedId(record.segmentId),
          style: { cursor: 'pointer' },
        })}
      />

      <SlideDrawer
        title={detail?.segmentName ?? 'Segment Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.segmentCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.segmentName}</Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {detail.description ?? '—'}
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
    </div>
  );
}
