import { useState, useCallback } from 'react';
import { Typography, Input, Row, Col, Tag, Button, Space, Empty } from 'antd';
import { SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { getBankMappingsByBankCode } from '../../services/bankMappingService';
import type { BankMappingRecord } from '../../services/bankMappingService';
import { BankMappingImportModal } from './BankMappingImportModal';

const { Title, Text } = Typography;

export function BankMappingListPage() {
  const [bankCode, setBankCode] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['bank-mappings', submittedCode],
    queryFn: () => getBankMappingsByBankCode(submittedCode),
    enabled: !!submittedCode,
    staleTime: 60_000,
  });

  const handleSearch = useCallback(() => {
    setSubmittedCode(bankCode.trim());
  }, [bankCode]);

  const columns: TableColumnsType<BankMappingRecord> = [
    {
      title: 'Bank Code',
      dataIndex: 'bankCode',
      width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'IFSC Code',
      dataIndex: 'ifscCode',
      width: 140,
      sorter: (a, b) => a.ifscCode.localeCompare(b.ifscCode),
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: 'MICR Code',
      dataIndex: 'micrCode',
      width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v || '—'}</span>,
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
            Bank Mappings (IFSC)
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
        <Col span={10}>
          <Input.Search
            prefix={<SearchOutlined />}
            placeholder="Enter bank code (e.g. HDFC)..."
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handleSearch}
            enterButton="Search"
            allowClear
          />
        </Col>
        {submittedCode && (
          <Col style={{ display: 'flex', alignItems: 'center' }}>
            <Text type="secondary">
              Showing up to 100 results for <strong>{submittedCode}</strong>
            </Text>
          </Col>
        )}
      </Row>

      {!submittedCode ? (
        <Empty
          description="Enter a bank code above and click Search to view IFSC mappings"
          style={{ marginTop: 80 }}
        />
      ) : (
        <DataTable<BankMappingRecord>
          columns={columns}
          dataSource={data}
          loading={isLoading}
          rowKey="mappingId"
          pagination={{ pageSize: 100, showTotal: (t) => `${t} mappings` }}
        />
      )}

      <BankMappingImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
