import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getBrokers } from '../../services/brokerService';
import { BrokerTable } from './BrokerTable';
import { BrokerDrawer } from './BrokerDrawer';
import type { BrokerSummary } from '../../services/brokerService';

const { Title } = Typography;

export function BrokerListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['brokers'],
    queryFn: () => getBrokers({}),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!allData) return [];
    const q = search.toLowerCase();
    if (!q) return allData;
    return allData.filter(
      (b) => b.brokerName.toLowerCase().includes(q) || b.brokerCode.toLowerCase().includes(q),
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

  const handleRowClick = useCallback((broker: BrokerSummary) => {
    setSelectedBrokerId(broker.brokerId);
  }, []);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Brokers
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by name or code"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
      </Row>

      <BrokerTable
        data={pageData}
        loading={isLoading}
        total={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
      />

      <BrokerDrawer
        brokerId={selectedBrokerId}
        onClose={() => setSelectedBrokerId(null)}
      />
    </div>
  );
}
