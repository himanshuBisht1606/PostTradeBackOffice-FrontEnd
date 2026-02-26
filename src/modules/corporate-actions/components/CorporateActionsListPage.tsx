import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Select, Button, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCorporateActions,
  processCorporateAction,
} from '../services/corporateActionService';
import type { CorporateAction } from '../services/corporateActionService';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { CorporateActionFormModal } from './CorporateActionFormModal';
import { formatDate, truncateId } from '@utils/formatters';
import { notifySuccess, notifyError } from '@utils/errorHandler';
import { CorporateActionType, CorporateActionStatus } from '@app-types/enums';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;

const CAN_CREATE_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.FinanceController];
const CAN_PROCESS_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.FinanceController];

export function CorporateActionsListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionType, setActionType] = useState<CorporateActionType | undefined>(undefined);
  const [status, setStatus] = useState<CorporateActionStatus | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { hasRole } = useAuthStore();
  const canCreate = hasRole(CAN_CREATE_ROLES);
  const canProcess = hasRole(CAN_PROCESS_ROLES);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['corporate-actions', { actionType, status }],
    queryFn: () => getCorporateActions({ actionType, status }),
    staleTime: 30_000,
  });

  const pageData = useMemo(
    () => (allData ?? []).slice((page - 1) * pageSize, page * pageSize),
    [allData, page, pageSize],
  );

  const processMutation = useMutation({
    mutationFn: (id: string) => processCorporateAction(id),
    onSuccess: () => {
      notifySuccess('Corporate action processing triggered');
      void queryClient.invalidateQueries({ queryKey: ['corporate-actions'] });
    },
    onError: (err) => notifyError(err, 'Failed to process corporate action'),
  });

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  const columns: TableColumnsType<CorporateAction> = [
    {
      title: 'Type',
      dataIndex: 'actionType',
      width: 110,
      render: (v: string) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'Record Date',
      dataIndex: 'recordDate',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Effective Date',
      dataIndex: 'effectiveDate',
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Dividend / Share',
      dataIndex: 'dividendPerShare',
      width: 140,
      align: 'right',
      render: (v: number | null) => (v != null ? `₹${v.toFixed(2)}` : '—'),
    },
    {
      title: 'Ratio',
      dataIndex: 'ratio',
      width: 80,
      align: 'right',
      render: (v: number | null) => (v != null ? v : '—'),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'ID',
      dataIndex: 'corporateActionId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    ...(canProcess
      ? [
          {
            title: '',
            key: 'actions',
            width: 90,
            render: (_: unknown, record: CorporateAction) =>
              record.status === CorporateActionStatus.Announced ? (
                <Button
                  size="small"
                  icon={<PlayCircleOutlined />}
                  loading={processMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    processMutation.mutate(record.corporateActionId);
                  }}
                >
                  Process
                </Button>
              ) : null,
          } as TableColumnsType<CorporateAction>[number],
        ]
      : []),
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Corporate Actions
          </Title>
        </Col>
        {canCreate && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Action
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select<CorporateActionType>
            placeholder="Action Type"
            style={{ width: '100%' }}
            allowClear
            value={actionType ?? null}
            onChange={(v) => {
              setActionType(v);
              setPage(1);
            }}
            options={[
              { label: 'Dividend', value: CorporateActionType.Dividend },
              { label: 'Bonus', value: CorporateActionType.Bonus },
              { label: 'Split', value: CorporateActionType.Split },
              { label: 'Rights', value: CorporateActionType.Rights },
              { label: 'Merger', value: CorporateActionType.Merger },
              { label: 'Demerger', value: CorporateActionType.Demerger },
            ]}
          />
        </Col>
        <Col span={6}>
          <Select<CorporateActionStatus>
            placeholder="Status"
            style={{ width: '100%' }}
            allowClear
            value={status ?? null}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { label: 'Announced', value: CorporateActionStatus.Announced },
              { label: 'Processing', value: CorporateActionStatus.Processing },
              { label: 'Completed', value: CorporateActionStatus.Completed },
              { label: 'Cancelled', value: CorporateActionStatus.Cancelled },
            ]}
          />
        </Col>
      </Row>

      <DataTable<CorporateAction>
        columns={columns}
        dataSource={pageData}
        loading={isLoading}
        rowKey="corporateActionId"
        pagination={{
          current: page,
          pageSize,
          total: allData?.length ?? 0,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (t) => `${t} actions`,
        }}
      />

      <CorporateActionFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
