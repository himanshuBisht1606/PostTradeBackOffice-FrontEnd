import { Row, Col, Card, Statistic } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ReconStats } from '../services/reconciliationService';

interface ReconStatsBarProps {
  stats: ReconStats | undefined;
  loading: boolean;
}

export function ReconStatsBar({ stats, loading }: ReconStatsBarProps) {
  const cards = [
    {
      title: 'Matched',
      value: stats?.matched ?? 0,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Variated',
      value: stats?.variated ?? 0,
      icon: <ExclamationCircleOutlined />,
      color: (stats?.variated ?? 0) > 0 ? '#f5222d' : '#52c41a',
    },
    {
      title: 'Pending',
      value: stats?.pending ?? 0,
      icon: <ClockCircleOutlined />,
      color: (stats?.pending ?? 0) > 0 ? '#fa8c16' : '#52c41a',
    },
    {
      title: 'Open Exceptions',
      value: stats?.openExceptions ?? 0,
      icon: <WarningOutlined />,
      color: (stats?.openExceptions ?? 0) > 0 ? '#f5222d' : '#52c41a',
    },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      {cards.map((card) => (
        <Col span={6} key={card.title}>
          <Card loading={loading} style={{ borderTop: `3px solid ${card.color}` }}>
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
