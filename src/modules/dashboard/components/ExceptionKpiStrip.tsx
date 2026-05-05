import { Row, Col, Card, Statistic, Skeleton } from 'antd';
import {
  CheckCircleOutlined,
  DisconnectOutlined,
  AlertOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  FundOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { DashboardKpis } from '../services/dashboardService';

interface ExceptionKpiStripProps {
  kpis: DashboardKpis;
  loading?: boolean;
}

export function ExceptionKpiStrip({ kpis, loading = false }: ExceptionKpiStripProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Col span={6} key={i}>
            <Card>
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  const alertCards = [
    {
      title: 'Pending Approvals',
      value: kpis.pendingApprovals,
      suffix: '',
      icon: <CheckCircleOutlined />,
      color: kpis.pendingApprovals > 0 ? '#fa8c16' : '#52c41a',
      route: '/governance/approvals',
      sub: 'Awaiting checker sign-off',
    },
    {
      title: 'Recon Breaks',
      value: kpis.reconBreaks,
      suffix: '',
      icon: <DisconnectOutlined />,
      color: kpis.reconBreaks > 0 ? '#e63946' : '#52c41a',
      route: '/reconciliation',
      sub: 'Position mismatches',
    },
    {
      title: 'Margin Shortfall',
      value: kpis.marginShortfall,
      suffix: ' clients',
      icon: <AlertOutlined />,
      color: kpis.marginShortfall > 0 ? '#e63946' : '#52c41a',
      route: '/reconciliation',
      sub: 'Below VAR threshold',
    },
    {
      title: 'Settlement Failures',
      value: kpis.settlementFailures,
      suffix: '',
      icon: <CloseCircleOutlined />,
      color: kpis.settlementFailures > 0 ? '#e63946' : '#52c41a',
      route: '/clearing/settlement/batches',
      sub: 'Failed batches (NSE/BSE)',
    },
  ];

  const metricCards = [
    {
      title: "Today's Turnover",
      value: kpis.todayTurnover,
      prefix: '₹',
      suffix: ' Cr',
      icon: <SwapOutlined />,
      color: '#1d3557',
      route: '/clearing/trades',
      sub: 'Across all segments',
    },
    {
      title: 'Open Positions',
      value: kpis.openPositionsValue,
      prefix: '₹',
      suffix: ' Cr',
      icon: <FundOutlined />,
      color: '#457b9d',
      route: '/clearing/trades',
      sub: 'Mark-to-market value',
    },
    {
      title: 'T+1 Pending',
      value: kpis.t1PendingCount,
      prefix: '',
      suffix: ' batches',
      icon: <ClockCircleOutlined />,
      color: '#fa8c16',
      route: '/clearing/settlement/obligations',
      sub: 'Due for settlement today',
    },
    {
      title: 'Active Clients',
      value: kpis.activeClients,
      prefix: '',
      suffix: '',
      icon: <TeamOutlined />,
      color: '#2a9d8f',
      route: '/account-management/clients',
      sub: 'Traded this session',
    },
  ];

  return (
    <>
      {/* Row 1 — Exception / alert KPIs */}
      <Row gutter={[16, 0]} style={{ marginBottom: 12 }}>
        {alertCards.map((card) => (
          <Col span={6} key={card.title}>
            <Card
              hoverable
              onClick={() => void navigate(card.route)}
              style={{
                cursor: 'pointer',
                borderTop: `3px solid ${card.color}`,
                borderRadius: 8,
              }}
              bodyStyle={{ padding: '14px 18px' }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: 12, color: '#595959', fontWeight: 600 }}>
                    <span style={{ color: card.color, marginRight: 6 }}>{card.icon}</span>
                    {card.title}
                  </span>
                }
                value={card.value}
                suffix={<span style={{ fontSize: 13 }}>{card.suffix}</span>}
                valueStyle={{ color: card.color, fontSize: 26, fontWeight: 700 }}
              />
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{card.sub}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 2 — Operational metrics */}
      <Row gutter={[16, 0]} style={{ marginBottom: 20 }}>
        {metricCards.map((card) => (
          <Col span={6} key={card.title}>
            <Card
              hoverable
              onClick={() => void navigate(card.route)}
              style={{
                cursor: 'pointer',
                borderTop: `3px solid ${card.color}`,
                borderRadius: 8,
                background: '#fafbfc',
              }}
              bodyStyle={{ padding: '14px 18px' }}
            >
              <Statistic
                title={
                  <span style={{ fontSize: 12, color: '#595959', fontWeight: 600 }}>
                    <span style={{ color: card.color, marginRight: 6 }}>{card.icon}</span>
                    {card.title}
                  </span>
                }
                value={card.value}
                prefix={<span style={{ fontSize: 16, color: card.color }}>{card.prefix}</span>}
                suffix={<span style={{ fontSize: 13, color: '#777' }}>{card.suffix}</span>}
                valueStyle={{ color: card.color, fontSize: 24, fontWeight: 700 }}
                formatter={(v) => Number(v).toLocaleString('en-IN')}
              />
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{card.sub}</div>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
