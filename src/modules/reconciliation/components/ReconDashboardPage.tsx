import { useState, useCallback, useMemo } from 'react';
import { Typography, Tabs, Row, Col, Select } from 'antd';
import type { TableColumnsType } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReconRecords,
  getReconStats,
  getReconExceptions,
  resolveException,
} from '../services/reconciliationService';
import { ReconStatsBar } from './ReconStatsBar';
import { ExceptionTable } from './ExceptionTable';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { formatCurrency, formatDate, truncateId } from '@utils/formatters';
import { notifyError, notifySuccess } from '@utils/errorHandler';
import { ReconStatus, ExceptionStatus } from '@types/enums';
import type { ReconRecord } from '../services/reconciliationService';

const { Title } = Typography;

export function ReconDashboardPage() {
  const [reconPage, setReconPage] = useState(1);
  const [reconPageSize, setReconPageSize] = useState(20);
  const [reconStatus, setReconStatus] = useState<ReconStatus | undefined>(undefined);

  const [excPage, setExcPage] = useState(1);
  const [excPageSize, setExcPageSize] = useState(20);
  const [excStatus, setExcStatus] = useState<ExceptionStatus | undefined>(ExceptionStatus.Open);

  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['recon-stats'],
    queryFn: getReconStats,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: allReconData, isLoading: reconLoading } = useQuery({
    queryKey: ['recon-records', { status: reconStatus }],
    queryFn: () => getReconRecords({ status: reconStatus }),
    staleTime: 30_000,
  });

  const { data: allExcData, isLoading: excLoading } = useQuery({
    queryKey: ['recon-exceptions', { status: excStatus }],
    queryFn: () => getReconExceptions({ status: excStatus }),
    staleTime: 30_000,
  });

  const reconPageData = useMemo(
    () => (allReconData ?? []).slice((reconPage - 1) * reconPageSize, reconPage * reconPageSize),
    [allReconData, reconPage, reconPageSize],
  );

  const excPageData = useMemo(
    () => (allExcData ?? []).slice((excPage - 1) * excPageSize, excPage * excPageSize),
    [allExcData, excPage, excPageSize],
  );

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveException(id, 'Resolved by operator'),
    onSuccess: () => {
      notifySuccess('Exception resolved');
      void queryClient.invalidateQueries({ queryKey: ['recon-exceptions'] });
      void queryClient.invalidateQueries({ queryKey: ['recon-stats'] });
    },
    onError: (err) => notifyError(err, 'Failed to resolve exception'),
  });

  const handleReconPageChange = useCallback((p: number, ps: number) => {
    setReconPage(p);
    setReconPageSize(ps);
  }, []);

  const handleExcPageChange = useCallback((p: number, ps: number) => {
    setExcPage(p);
    setExcPageSize(ps);
  }, []);

  const reconColumns: TableColumnsType<ReconRecord> = [
    {
      title: 'Settlement No',
      dataIndex: 'settlementNo',
      width: 160,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    { title: 'Type', dataIndex: 'reconType', width: 130 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'System Value',
      dataIndex: 'systemValue',
      width: 130,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Exchange Value',
      dataIndex: 'exchangeValue',
      width: 140,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Difference',
      dataIndex: 'difference',
      width: 120,
      align: 'right',
      render: (v: number) => (
        <span style={{ color: v !== 0 ? '#f5222d' : '#52c41a', fontWeight: 600 }}>
          {formatCurrency(Math.abs(v))}
        </span>
      ),
    },
    {
      title: 'Recon Date',
      dataIndex: 'reconDate',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'ID',
      dataIndex: 'reconId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'records',
      label: 'Reconciliation Records',
      children: (
        <>
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Select<ReconStatus>
                placeholder="Status"
                style={{ width: '100%' }}
                allowClear
                value={reconStatus}
                onChange={(v) => { setReconStatus(v); setReconPage(1); }}
                options={[
                  { label: 'Matched', value: ReconStatus.Matched },
                  { label: 'Variated', value: ReconStatus.Variated },
                  { label: 'Pending', value: ReconStatus.Pending },
                  { label: 'Resolved', value: ReconStatus.Resolved },
                ]}
              />
            </Col>
          </Row>
          <DataTable<ReconRecord>
            columns={reconColumns}
            dataSource={reconPageData}
            loading={reconLoading}
            rowKey="reconId"
            pagination={{
              current: reconPage,
              pageSize: reconPageSize,
              total: allReconData?.length ?? 0,
              onChange: handleReconPageChange,
              showSizeChanger: true,
              showTotal: (t) => `${t} records`,
            }}
          />
        </>
      ),
    },
    {
      key: 'exceptions',
      label: 'Exceptions',
      children: (
        <>
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Select<ExceptionStatus>
                placeholder="Status"
                style={{ width: '100%' }}
                allowClear
                value={excStatus}
                onChange={(v) => { setExcStatus(v); setExcPage(1); }}
                options={[
                  { label: 'Open', value: ExceptionStatus.Open },
                  { label: 'In Progress', value: ExceptionStatus.InProgress },
                  { label: 'Resolved', value: ExceptionStatus.Resolved },
                  { label: 'Closed', value: ExceptionStatus.Closed },
                ]}
              />
            </Col>
          </Row>
          <ExceptionTable
            data={excPageData}
            loading={excLoading}
            total={allExcData?.length ?? 0}
            page={excPage}
            pageSize={excPageSize}
            onPageChange={handleExcPageChange}
            onResolve={(id) => resolveMutation.mutate(id)}
          />
        </>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Reconciliation
      </Title>

      <ReconStatsBar stats={stats} loading={statsLoading} />

      <Tabs items={tabItems} />
    </div>
  );
}
