import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Select, Tag, Descriptions, Button, Space } from 'antd';
import { SearchOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { getStates, getStateById } from '../../services/stateMasterService';
import type { StateRecord } from '../../services/stateMasterService';
import { StateImportModal } from './StateImportModal';

const { Title } = Typography;

export function StateListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
    staleTime: 60_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['states', selectedId],
    queryFn: () => getStateById(selectedId as string),
    enabled: !!selectedId,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let rows = allData;

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.stateCode.toLowerCase().includes(q) ||
          s.stateName.toLowerCase().includes(q),
      );
    }

    if (statusFilter === 'active') rows = rows.filter((s) => s.isActive);
    else if (statusFilter === 'inactive') rows = rows.filter((s) => !s.isActive);

    return rows;
  }, [allData, search, statusFilter]);

  const pageData = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const columns: TableColumnsType<StateRecord> = [
    {
      title: 'Code',
      dataIndex: 'stateCode',
      width: 80,
      sorter: (a, b) => a.stateCode.localeCompare(b.stateCode),
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'State Name',
      dataIndex: 'stateName',
      ellipsis: true,
      sorter: (a, b) => a.stateName.localeCompare(b.stateName),
    },
    {
      title: 'NSE',
      dataIndex: 'nseCode',
      width: 70,
      sorter: (a, b) => (a.nseCode ?? 0) - (b.nseCode ?? 0),
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'BSE Name',
      dataIndex: 'bseName',
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'CVL',
      dataIndex: 'cvlCode',
      width: 70,
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'NSDL',
      dataIndex: 'nsdlCode',
      width: 70,
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 80,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            States
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<PlusOutlined />} disabled>
              Add State
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setImportOpen(true)}
            >
              Import CSV
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select
            style={{ width: '100%' }}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
        </Col>
      </Row>

      <DataTable<StateRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="stateId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100'],
          showTotal: (t) => `Showing ${t} state${t !== 1 ? 's' : ''}`,
        }}
        onRow={(record) => ({
          onClick: () => setSelectedId(record.stateId),
          style: { cursor: 'pointer' },
        })}
      />

      <SlideDrawer
        title={detail ? `${detail.stateCode} — ${detail.stateName}` : 'State Detail'}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        isLoading={detailLoading}
      >
        {detail && (
          <div style={{ padding: 24 }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="State Code">
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {detail.stateCode}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Country">{detail.countryId}</Descriptions.Item>
              <Descriptions.Item label="State Name" span={2}>
                {detail.stateName}
              </Descriptions.Item>
              <Descriptions.Item label="NSE Code">{detail.nseCode ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="BSE Name">{detail.bseName ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="CVL Code">{detail.cvlCode ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="NDML Code">{detail.ndmlCode ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="NCDEX Code">{detail.ncdexCode ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="NSEKRA Code">{detail.nseKraCode ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="NSDL Code">{detail.nsdlCode ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Active">
                <Tag color={detail.isActive ? 'green' : 'default'}>
                  {detail.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </SlideDrawer>

      <StateImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
