import { useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { ExceptionKpiStrip } from './ExceptionKpiStrip';
import { RevenueChart } from '@shared/components/charts/RevenueChart';
import { SettlementAgingChart } from '@shared/components/charts/SettlementAgingChart';
import { ExposureChart } from '@shared/components/charts/ExposureChart';
import { LedgerImbalanceIndicator } from '@shared/components/charts/LedgerImbalanceIndicator';
import { getDashboardSummary } from '../services/dashboardService';
import { notifyError } from '@utils/errorHandler';

const { Title } = Typography;

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    staleTime: 0,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (error) notifyError(error, 'Failed to load dashboard');
  }, [error]);

  const kpis = data?.kpis ?? {
    pendingApprovals: 0,
    reconBreaks: 0,
    exposureBreaches: 0,
    settlementFailures: 0,
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#1d3557' }}>
        Operations Dashboard
      </Title>

      {/* Exception-first: anomaly KPIs always rendered first */}
      <ExceptionKpiStrip kpis={kpis} loading={isLoading} />

      <Row gutter={16}>
        <Col span={12}>
          <RevenueChart data={data?.revenueTrend ?? []} loading={isLoading} />
        </Col>
        <Col span={12}>
          <SettlementAgingChart data={data?.settlementAging ?? []} loading={isLoading} />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <ExposureChart data={data?.exposureUtilization ?? []} loading={isLoading} />
        </Col>
        <Col span={12}>
          <LedgerImbalanceIndicator
            imbalanceAmount={data?.ledgerImbalanceAmount ?? 0}
            affectedAccounts={data?.ledgerAffectedAccounts ?? 0}
            loading={isLoading}
          />
        </Col>
      </Row>
    </div>
  );
}
