import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettlementBatches, processSettlementBatch } from '../../services/settlementService';
import { BatchTable } from './BatchTable';
import { CreateBatchModal } from './CreateBatchModal';
import { notifyError, notifySuccess } from '@utils/errorHandler';
import { SettlementStatus } from '@app-types/enums';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Role } from '@app-types/roles.types';

const { Title } = Typography;

const CAN_CREATE_ROLES = [
  Role.PlatformSuperAdmin,
  Role.TenantOwner,
  Role.OperationsController,
  Role.FinanceController,
];

export function BatchListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<SettlementStatus | undefined>(SettlementStatus.Pending);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { hasRole } = useAuthStore();
  const canCreate = hasRole(CAN_CREATE_ROLES);

  const { data: allData, isLoading } = useQuery({
    queryKey: ['settlement-batches', { status }],
    queryFn: () => getSettlementBatches({ status }),
    staleTime: 0,
  });

  const pageData = useMemo(
    () => (allData ?? []).slice((page - 1) * pageSize, page * pageSize),
    [allData, page, pageSize],
  );

  const processMutation = useMutation({
    mutationFn: (id: string) => processSettlementBatch(id),
    onSuccess: () => {
      notifySuccess('Settlement batch queued for processing');
      void queryClient.invalidateQueries({ queryKey: ['settlement-batches'] });
    },
    onError: (err) => notifyError(err, 'Failed to process batch'),
  });

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0, color: '#1d3557' }}>
            Settlement Batches
          </Title>
        </Col>
        {canCreate && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Batch
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select<SettlementStatus>
            placeholder="Filter by status"
            style={{ width: '100%' }}
            allowClear
            value={status ?? null}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { label: 'Pending', value: SettlementStatus.Pending },
              { label: 'Processing', value: SettlementStatus.Processing },
              { label: 'Completed', value: SettlementStatus.Completed },
              { label: 'Failed', value: SettlementStatus.Failed },
            ]}
          />
        </Col>
      </Row>

      <BatchTable
        data={pageData}
        loading={isLoading}
        total={allData?.length ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onProcess={(id) => processMutation.mutate(id)}
      />

      <CreateBatchModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
