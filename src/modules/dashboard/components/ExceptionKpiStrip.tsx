import { Row, Col, Card, Statistic } from 'antd';
import {
  CheckCircleOutlined,
  DisconnectOutlined,
  AlertOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { DashboardKpis } from '../services/dashboardService';

interface ExceptionKpiStripProps {
  kpis: DashboardKpis;
  loading?: boolean;
}

interface KpiCardConfig {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  route: string;
}

export function ExceptionKpiStrip({ kpis, loading = false }: ExceptionKpiStripProps) {
  const navigate = useNavigate();

  const cards: KpiCardConfig[] = [
    {
      title: 'Pending Approvals',
      value: kpis.pendingApprovals,
      icon: <CheckCircleOutlined />,
      color: kpis.pendingApprovals > 0 ? '#fa8c16' : '#52c41a',
      route: '/governance/approvals',
    },
    {
      title: 'Recon Breaks',
      value: kpis.reconBreaks,
      icon: <DisconnectOutlined />,
      color: kpis.reconBreaks > 0 ? '#f5222d' : '#52c41a',
      route: '/reconciliation',
    },
    {
      title: 'Exposure Breaches',
      value: kpis.exposureBreaches,
      icon: <AlertOutlined />,
      color: kpis.exposureBreaches > 0 ? '#f5222d' : '#52c41a',
      route: '/reconciliation',
    },
    {
      title: 'Settlement Failures',
      value: kpis.settlementFailures,
      icon: <CloseCircleOutlined />,
      color: kpis.settlementFailures > 0 ? '#f5222d' : '#52c41a',
      route: '/clearing/settlement/batches',
    },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {cards.map((card) => (
        <Col span={6} key={card.title}>
          <Card
            hoverable
            loading={loading}
            onClick={() => void navigate(card.route)}
            style={{ cursor: 'pointer', borderTop: `3px solid ${card.color}` }}
          >
            <Statistic
              title={<span style={{ fontSize: 13, color: '#595959' }}>{card.title}</span>}
              value={card.value}
              prefix={<span style={{ color: card.color, marginRight: 6 }}>{card.icon}</span>}
              valueStyle={{ color: card.color, fontSize: 28, fontWeight: 700 }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
