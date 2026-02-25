import { useState, useCallback, useMemo } from 'react';
import { Typography } from 'antd';
import { useClients } from '../../hooks/useClients';
import { ClientTable } from './ClientTable';
import { ClientFilters } from './ClientFilters';
import { ClientDrawer } from './ClientDrawer';
import type { ClientSummary } from '../../services/clientService';
import type { EntityStatus, ClientType } from '@app-types/enums';

const { Title } = Typography;

export function ClientListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<{
    search?: string | undefined;
    status?: EntityStatus | undefined;
    type?: ClientType | undefined;
  }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Clients
      </Title>

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
    </div>
  );
}
