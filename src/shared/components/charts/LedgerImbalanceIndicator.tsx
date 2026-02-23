import { Card, Statistic, Tag, Space, Typography } from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { formatCurrency } from '@utils/formatters';

interface LedgerImbalanceIndicatorProps {
  imbalanceAmount: number;
  affectedAccounts: number;
  loading?: boolean;
}

const { Text } = Typography;

export function LedgerImbalanceIndicator({
  imbalanceAmount,
  affectedAccounts,
  loading = false,
}: LedgerImbalanceIndicatorProps) {
  const isBalanced = imbalanceAmount === 0;

  return (
    <Card
      title="Ledger Imbalance"
      loading={loading}
      style={{
        height: 280,
        borderColor: isBalanced ? '#b7eb8f' : '#ffa39e',
        background: isBalanced ? '#f6ffed' : '#fff2f0',
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isBalanced ? (
            <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
          ) : (
            <WarningOutlined style={{ fontSize: 32, color: '#fa541c' }} />
          )}
          <Tag color={isBalanced ? 'success' : 'error'} style={{ fontSize: 14, padding: '4px 12px' }}>
            {isBalanced ? 'BALANCED' : 'IMBALANCED'}
          </Tag>
        </div>

        {!isBalanced && (
          <>
            <Statistic
              title="Imbalance Amount"
              value={formatCurrency(imbalanceAmount)}
              valueStyle={{ color: '#fa541c', fontSize: 20 }}
            />
            <Text type="secondary">
              {affectedAccounts} account{affectedAccounts !== 1 ? 's' : ''} affected
            </Text>
          </>
        )}

        {isBalanced && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            All debit and credit entries are balanced. No action required.
          </Text>
        )}
      </Space>
    </Card>
  );
}
