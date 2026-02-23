import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Select, Input, Alert } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getApprovals,
  approveRecord,
  rejectRecord,
} from '../../services/approvalService';
import { ApprovalTable } from './ApprovalTable';
import { ApprovalDrawer } from './ApprovalDrawer';
import { notifyError, notifySuccess } from '@utils/errorHandler';
import type { ApprovalRecord } from '../../services/approvalService';

const { Title } = Typography;

export function ApprovalQueuePage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<'Pending' | 'Approved' | 'Rejected' | undefined>('Pending');
  const [entityType, setEntityType] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<ApprovalRecord | null>(null);
  const queryClient = useQueryClient();

  const { data: allData, isLoading, isError } = useQuery({
    queryKey: ['approvals', { status, entityType }],
    queryFn: () => getApprovals({ status, entityType }),
    staleTime: 0,
    refetchInterval: 30_000,
    retry: false, // Don't retry — endpoint may not exist yet
  });

  const pageData = useMemo(
    () => (allData ?? []).slice((page - 1) * pageSize, page * pageSize),
    [allData, page, pageSize],
  );

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRecord(id),
    onSuccess: () => {
      notifySuccess('Action approved');
      void queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
    onError: (err) => notifyError(err, 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectRecord(id, 'Rejected by approver'),
    onSuccess: () => {
      notifySuccess('Action rejected');
      void queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
    onError: (err) => notifyError(err, 'Rejection failed'),
  });

  const handlePageChange = useCallback((p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  }, []);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16, color: '#1d3557' }}>
        Approval Queue
      </Title>

      {isError && (
        <Alert
          type="warning"
          message="Approval queue endpoint not yet available"
          description="The backend approval workflow API is under development. This page will be functional once the backend team implements the /api/approvals endpoints."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Select<'Pending' | 'Approved' | 'Rejected'>
            placeholder="Status"
            style={{ width: '100%' }}
            allowClear
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: 'Pending', value: 'Pending' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' },
            ]}
          />
        </Col>
        <Col span={6}>
          <Input
            placeholder="Entity Type (e.g. SettlementBatch)"
            value={entityType ?? ''}
            onChange={(e) => { setEntityType(e.target.value || undefined); setPage(1); }}
            allowClear
          />
        </Col>
      </Row>

      <ApprovalTable
        data={pageData}
        loading={isLoading}
        total={allData?.length ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onApprove={(id) => approveMutation.mutate(id)}
        onReject={(id) => rejectMutation.mutate(id)}
        onRowClick={setSelected}
      />

      <ApprovalDrawer record={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
