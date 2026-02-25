import { useState, useCallback, useMemo } from 'react';
import { Typography, Row, Col, Select } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettlementBatches, processSettlementBatch } from '../../services/settlementService';
import { BatchTable } from './BatchTable';
import { notifyError, notifySuccess } from '@utils/errorHandler';
import { SettlementStatus } from '@app-types/enums';

const { Title } = Typography;

export function BatchListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<SettlementStatus | undefined>(SettlementStatus.Pending);
  const queryClient = useQueryClient();

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
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Settlement Batches
      </Title>

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
    </div>
  );
}
