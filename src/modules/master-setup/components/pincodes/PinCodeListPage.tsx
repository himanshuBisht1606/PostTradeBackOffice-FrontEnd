import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Tag, Button, Space } from 'antd';
import { SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { getPinCodes } from '../../services/pinCodeService';
import type { PinCodeRecord } from '../../services/pinCodeService';
import { PinCodeImportModal } from './PinCodeImportModal';

const { Title } = Typography;

export function PinCodeListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['pin-codes'],
    queryFn: () => getPinCodes(),
    staleTime: 300_000,
  });

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (p) =>
        p.pinCode.toLowerCase().includes(q) ||
        (p.district ?? '').toLowerCase().includes(q) ||
        p.stateCode.toLowerCase().includes(q),
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

  const columns: TableColumnsType<PinCodeRecord> = [
    {
      title: 'Pin Code',
      dataIndex: 'pinCode',
      width: 100,
      sorter: (a, b) => a.pinCode.localeCompare(b.pinCode),
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'District',
      dataIndex: 'district',
      ellipsis: true,
      sorter: (a, b) => (a.district ?? '').localeCompare(b.district ?? ''),
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'State',
      dataIndex: 'stateCode',
      width: 90,
      sorter: (a, b) => a.stateCode.localeCompare(b.stateCode),
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'MCX Code',
      dataIndex: 'mcxCode',
      width: 100,
      render: (v: string | null) => v ?? '—',
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Pin Code Master
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
        <Col span={12}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by pin code, district or state..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
      </Row>

      <DataTable<PinCodeRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="pinCodeId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100'],
          showTotal: (t) => `Showing ${t} pin code${t !== 1 ? 's' : ''}`,
        }}
      />

      <PinCodeImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
