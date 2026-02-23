import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getSettlementObligations } from '../../services/settlementService';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { formatCurrency, formatDate, truncateId } from '@utils/formatters';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission } from '@app-types/roles.types';
import { ObligationStatus } from '@app-types/enums';
import type { SettlementObligation } from '../../services/settlementService';

const { Title } = Typography;

export function ObligationListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<ObligationStatus | undefined>(undefined);
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));

  const { data: allData, isLoading } = useQuery({
    queryKey: ['settlement-obligations', { status }],
    queryFn: () => getSettlementObligations({ status }),
    staleTime: 30_000,
  });

  const pageData = useMemo(
    () => (allData ?? []).slice((page - 1) * pageSize, page * pageSize),
    [allData, page, pageSize],
  );

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const columns: TableColumnsType<SettlementObligation> = [
    {
      title: 'Settlement No',
      dataIndex: 'settlementNo',
      width: 160,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: 'Net Funds Obligation',
      dataIndex: 'netFundsObligation',
      width: 170,
      align: 'right',
      render: (v: number) =>
        canViewSensitive ? (
          <span style={{ color: v >= 0 ? '#52c41a' : '#f5222d', fontWeight: 600 }}>
            {formatCurrency(v)}
          </span>
        ) : (
          <MaskedField />
        ),
    },
    {
      title: 'Net Securities Obligation',
      dataIndex: 'netSecuritiesObligation',
      width: 190,
      align: 'right',
      render: (v: number) =>
        canViewSensitive ? (
          <span style={{ color: v >= 0 ? '#52c41a' : '#f5222d', fontWeight: 600 }}>{v}</span>
        ) : (
          <MaskedField />
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'Settled At',
      dataIndex: 'settledAt',
      width: 140,
      render: (v: string | null) => (v ? formatDate(v) : '—'),
    },
    {
      title: 'ID',
      dataIndex: 'obligationId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Settlement Obligations
      </Title>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select<ObligationStatus>
            placeholder="Filter by status"
            style={{ width: '100%' }}
            allowClear
            value={status ?? null}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: 'Pending', value: ObligationStatus.Pending },
              { label: 'Partially Settled', value: ObligationStatus.PartiallySettled },
              { label: 'Settled', value: ObligationStatus.Settled },
              { label: 'Failed', value: ObligationStatus.Failed },
            ]}
          />
        </Col>
      </Row>

      <DataTable<SettlementObligation>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="obligationId"
        pagination={{
          current: page,
          pageSize,
          total: allData?.length ?? 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} obligations`,
        }}
      />
    </div>
  );
}
