import { useState, useCallback, useMemo } from 'react';
import { Typography, Button, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useClients } from '../../hooks/useClients';
import { ClientTable } from './ClientTable';
import { ClientFilters } from './ClientFilters';
import { ClientDrawer } from './ClientDrawer';
import { ClientFormModal } from './ClientFormModal';
import type { ClientSummary } from '../../services/clientService';
import type { EntityStatus, ClientType } from '@app-types/enums';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;

const CAN_CREATE_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.OperationsController];

export function ClientListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<{
    search?: string | undefined;
    status?: EntityStatus | undefined;
    type?: ClientType | undefined;
  }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { hasRole } = useAuthStore();
  const canCreate = hasRole(CAN_CREATE_ROLES);

  const { data: allData, isLoading } = useClients({
    status: filters.status,
    clientType: filters.type,
  });

  // Client-side search filter + pagination (backend returns full list)
  const filtered = useMemo(() => {
    if (!allData) return [];
    const q = filters.search?.toLowerCase();
    if (!q) return allData;
    return allData.filter(
      (c) => c.clientName.toLowerCase().includes(q) || c.clientCode.toLowerCase().includes(q),
    );
  }, [allData, filters.search]);

  const pageData = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const handleFiltersChange = useCallback(
    (f: {
      search?: string | undefined;
      status?: EntityStatus | undefined;
      type?: ClientType | undefined;
    }) => {
      setFilters(f);
      setPage(1);
    },
    [],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const handleRowClick = useCallback((client: ClientSummary) => {
    setSelectedId(client.clientId);
  }, []);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Clients
          </Title>
        </Col>
        {canCreate && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              Add Client
            </Button>
          </Col>
        )}
      </Row>

      <ClientFilters onChange={handleFiltersChange} />

      <ClientTable
        data={pageData}
        loading={isLoading}
        total={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
      />

      <ClientDrawer clientId={selectedId} onClose={() => setSelectedId(null)} />

      <ClientFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
