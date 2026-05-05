import { useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { ExceptionKpiStrip } from './ExceptionKpiStrip';
import { MarketTickerStrip } from '@shared/components/charts/MarketTickerStrip';
import { RevenueChart } from '@shared/components/charts/RevenueChart';
import { SettlementAgingChart } from '@shared/components/charts/SettlementAgingChart';
import { ExposureChart } from '@shared/components/charts/ExposureChart';
import { LedgerImbalanceIndicator } from '@shared/components/charts/LedgerImbalanceIndicator';
import { SegmentBreakdownChart } from '@shared/components/charts/SegmentBreakdownChart';
import { getDashboardSummary } from '../services/dashboardService';
import { notifyError } from '@utils/errorHandler';

const { Text } = Typography;

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
    marginShortfall: 0,
    todayTurnover: 0,
    openPositionsValue: 0,
    t1PendingCount: 0,
    activeClients: 0,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0, color: '#1d3557' }}>
          Post-Trade Operations Dashboard
        </Typography.Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          NSE &middot; BSE &middot; MCX &middot; CDSL · NSDL
        </Text>
      </div>

      {/* Market Ticker */}
      <MarketTickerStrip />

      {/* Exception-first KPI strips */}
      <ExceptionKpiStrip kpis={kpis} loading={isLoading} />

      {/* Row 1 — Revenue trend + Segment breakdown */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <RevenueChart data={data?.revenueTrend ?? []} loading={isLoading} />
        </Col>
        <Col span={8}>
          <SegmentBreakdownChart data={data?.segmentBreakdown ?? []} loading={isLoading} />
        </Col>
      </Row>

      {/* Row 2 — Settlement aging + Exposure + Ledger */}
      <Row gutter={16}>
        <Col span={10}>
          <SettlementAgingChart data={data?.settlementAging ?? []} loading={isLoading} />
        </Col>
        <Col span={7}>
          <ExposureChart data={data?.exposureUtilization ?? []} loading={isLoading} />
        </Col>
        <Col span={7}>
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
