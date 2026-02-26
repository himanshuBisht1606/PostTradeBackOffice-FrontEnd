import { useState, useCallback, useMemo } from 'react';
import { Typography, Input, Row, Col, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getBrokers } from '../../services/brokerService';
import { BrokerTable } from './BrokerTable';
import { BrokerFormModal } from './BrokerFormModal';
import type { BrokerSummary } from '../../services/brokerService';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;

const CAN_CREATE_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.OperationsController];

export function BrokerListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BrokerSummary | undefined>(undefined);

  const { hasRole } = useAuthStore();
  const canCreate = hasRole(CAN_CREATE_ROLES);

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

  const handleRowClick = useCallback(
    (broker: BrokerSummary) => {
      if (canCreate) {
        setEditTarget(broker);
        setModalOpen(true);
      }
    },
    [canCreate],
  );

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditTarget(undefined);
  }, []);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Brokers
          </Title>
        </Col>
        {canCreate && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditTarget(undefined);
                setModalOpen(true);
              }}
            >
              Add Broker
            </Button>
          </Col>
        )}
      </Row>

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

      <BrokerFormModal
        open={modalOpen}
        onClose={handleModalClose}
        initialData={editTarget}
      />
    </div>
  );
}
