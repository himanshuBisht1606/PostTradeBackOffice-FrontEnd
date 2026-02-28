import { useState, useMemo } from 'react';
import { Typography, Input, Row, Col, Tag, Button, Space } from 'antd';
import { SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { getNsdlDpMasters } from '../../services/dpMasterService';
import type { DpRecord } from '../../services/dpMasterService';
import { DpImportModal } from './DpImportModal';

const { Title } = Typography;

export function NsdlDpListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['nsdl-dps'],
    queryFn: getNsdlDpMasters,
    staleTime: 300_000,
  });

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (d) =>
        d.dpCode.toLowerCase().includes(q) ||
        d.dpName.toLowerCase().includes(q) ||
        (d.city ?? '').toLowerCase().includes(q) ||
        (d.state ?? '').toLowerCase().includes(q),
    );
  }, [allData, search]);

  const pageData = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const columns: TableColumnsType<DpRecord> = [
    {
      title: 'DP Code',
      dataIndex: 'dpCode',
      width: 110,
      sorter: (a, b) => a.dpCode.localeCompare(b.dpCode),
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'DP Name',
      dataIndex: 'dpName',
      ellipsis: true,
      sorter: (a, b) => a.dpName.localeCompare(b.dpName),
    },
    {
      title: 'City',
      dataIndex: 'city',
      width: 130,
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'State',
      dataIndex: 'state',
      width: 120,
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'memberStatus',
      width: 80,
      render: (v: string) => (
        <Tag color={v === 'AC' ? 'green' : 'default'}>{v}</Tag>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 70,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            NSDL DP Master
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by DP code, name, city or state..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
      </Row>

      <DataTable<DpRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="dpId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100'],
          showTotal: (t) => `Showing ${t} DP${t !== 1 ? 's' : ''}`,
        }}
      />

      <DpImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        depository="NSDL"
      />
    </div>
  );
}
