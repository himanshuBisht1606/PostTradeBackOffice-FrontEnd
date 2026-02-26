import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Input, Button, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getExchanges } from '../../services/exchangeService';
import type { Exchange } from '../../services/exchangeService';
import { DataTable } from '@shared/components/data-display/DataTable';
import { ExchangeFormModal } from './ExchangeFormModal';
import { truncateId } from '@utils/formatters';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;

const CAN_MANAGE_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner];

export function ExchangeListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Exchange | undefined>(undefined);

  const { hasRole } = useAuthStore();
  const canManage = hasRole(CAN_MANAGE_ROLES);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['exchanges'],
    queryFn: getExchanges,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!allData) return [];
    const q = search.toLowerCase();
    if (!q) return allData;
    return allData.filter(
      (e) =>
        e.exchangeCode.toLowerCase().includes(q) || e.exchangeName.toLowerCase().includes(q),
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

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditTarget(undefined);
  }, []);

  const columns: TableColumnsType<Exchange> = [
    {
      title: 'Code',
      dataIndex: 'exchangeCode',
      width: 100,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    { title: 'Name', dataIndex: 'exchangeName', ellipsis: true },
    { title: 'Country', dataIndex: 'country', width: 120 },
    { title: 'Currency', dataIndex: 'currency', width: 100 },
    {
      title: 'Active',
      dataIndex: 'isActive',
      width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'ID',
      dataIndex: 'exchangeId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    ...(canManage
      ? [
          {
            title: '',
            key: 'actions',
            width: 70,
            render: (_: unknown, record: Exchange) => (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTarget(record);
                  setModalOpen(true);
                }}
              >
                Edit
              </Button>
            ),
          } as TableColumnsType<Exchange>[number],
        ]
      : []),
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Exchanges
          </Title>
        </Col>
        {canManage && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditTarget(undefined);
                setModalOpen(true);
              }}
            >
              Add Exchange
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by code or name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
          />
        </Col>
      </Row>

      <DataTable<Exchange>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="exchangeId"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} exchanges`,
        }}
      />

      <ExchangeFormModal
        open={modalOpen}
        onClose={handleModalClose}
        initialData={editTarget}
      />
    </div>
  );
}
