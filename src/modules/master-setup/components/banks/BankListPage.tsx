import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Tag, Button, Space } from 'antd';
import { SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { getBankMasters } from '../../services/bankMasterService';
import type { BankRecord } from '../../services/bankMasterService';
import { BankImportModal } from './BankImportModal';

const { Title } = Typography;

export function BankListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['banks'],
    queryFn: getBankMasters,
    staleTime: 300_000,
  });

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(
      (b) =>
        b.bankCode.toLowerCase().includes(q) ||
        b.bankName.toLowerCase().includes(q) ||
        b.ifscPrefix.toLowerCase().includes(q),
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

  const columns: TableColumnsType<BankRecord> = [
    {
      title: 'Code',
      dataIndex: 'bankCode',
      width: 100,
      sorter: (a, b) => a.bankCode.localeCompare(b.bankCode),
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Bank Name',
      dataIndex: 'bankName',
      ellipsis: true,
      sorter: (a, b) => a.bankName.localeCompare(b.bankName),
    },
    {
      title: 'IFSC Prefix',
      dataIndex: 'ifscPrefix',
      width: 110,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
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
            Bank Master
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
            placeholder="Search by code, name or IFSC prefix..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
      </Row>

      <DataTable<BankRecord>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="bankId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          pageSizeOptions: ['25', '50', '100'],
          showTotal: (t) => `Showing ${t} bank${t !== 1 ? 's' : ''}`,
        }}
      />

      <BankImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
