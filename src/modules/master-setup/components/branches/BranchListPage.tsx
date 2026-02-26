import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Tag, Descriptions } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { getBranches, getBranchById } from '../../services/branchService';
import type { BranchRecord } from '../../services/branchService';

const { Title } = Typography;

export function BranchListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    staleTime: 30_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['branches', selectedId],
    queryFn: () => getBranchById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (b) =>
        b.branchCode.toLowerCase().includes(q) ||
        b.branchName.toLowerCase().includes(q) ||
        (b.city ?? '').toLowerCase().includes(q),
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

  const columns: TableColumnsType<BranchRecord> = [
    {
      title: 'Code',
      dataIndex: 'branchCode',
      width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Branch Name', dataIndex: 'branchName', ellipsis: true },
    { title: 'City', dataIndex: 'city', width: 120, render: (v: string | null) => v ?? '—' },
    { title: 'State', dataIndex: 'stateName', width: 140 },
    { title: 'Contact', dataIndex: 'contactPerson', width: 160, render: (v: string | null) => v ?? '—' },
    { title: 'Phone', dataIndex: 'contactPhone', width: 130, render: (v: string | null) => v ?? '—' },
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
        Branches
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by code, name, or city"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
      </Row>

      <DataTable<BranchRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="branchId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} branches`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedId(record.branchId),
          style: { cursor: 'pointer' },
        })}
      />

      <SlideDrawer
        title={detail?.branchName ?? 'Branch Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Code">{detail.branchCode}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.branchName}</Descriptions.Item>
              <Descriptions.Item label="City">{detail.city ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="State">{detail.stateName} ({detail.stateCode})</Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>{detail.address ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="GSTIN">{detail.gstin ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Contact Person">{detail.contactPerson ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{detail.contactPhone ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{detail.contactEmail ?? '—'}</Descriptions.Item>
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
