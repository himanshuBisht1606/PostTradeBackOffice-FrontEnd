import { Descriptions, Tag, Button, Popconfirm } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { MaskedField } from '@shared/components/data-display/MaskedField';
import { formatCurrency, formatDate, formatQuantity } from '@utils/formatters';
import { getTradeById, cancelTrade } from '../../services/tradeService';
import { useAuthStore } from '@modules/auth/store/authStore';
import { Permission, Role } from '@app-types/roles.types';
import { TradeStatus } from '@app-types/enums';
import { notifySuccess, notifyError } from '@utils/errorHandler';

const CANCELLABLE_STATUSES: TradeStatus[] = [TradeStatus.Pending, TradeStatus.Validated];
const CAN_CANCEL_ROLES = [Role.PlatformSuperAdmin, Role.TenantOwner, Role.OperationsController];

interface TradeDrawerProps {
  tradeId: string | null;
  onClose: () => void;
}

export function TradeDrawer({ tradeId, onClose }: TradeDrawerProps) {
  const { data: trade, isLoading } = useQuery({
    queryKey: ['trades', tradeId],
    queryFn: () => getTradeById(tradeId as string),
    enabled: !!tradeId,
    staleTime: 30_000,
  });
  const canViewSensitive = useAuthStore((s) => s.hasPermission(Permission.VIEW_SENSITIVE_FIELDS));
  const { hasRole } = useAuthStore();
  const canCancel = hasRole(CAN_CANCEL_ROLES);
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => cancelTrade(tradeId as string),
    onSuccess: () => {
      notifySuccess('Trade cancelled');
      void queryClient.invalidateQueries({ queryKey: ['trades'] });
      onClose();
    },
    onError: (err) => notifyError(err, 'Failed to cancel trade'),
  });

  const isCancellable = trade && CANCELLABLE_STATUSES.includes(trade.status);

  return (
    <SlideDrawer
      title={trade?.tradeNo ?? 'Trade Detail'}
      open={!!tradeId}
      onClose={onClose}
      isLoading={isLoading}
      extra={
        canCancel && isCancellable ? (
          <Popconfirm
            title="Cancel this trade?"
            description="This action cannot be undone."
            onConfirm={() => cancelMutation.mutate()}
            okText="Cancel Trade"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" loading={cancelMutation.isPending}>
              Cancel Trade
            </Button>
          </Popconfirm>
        ) : undefined
      }
    >
      {trade && (
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Trade No" span={2}>
            <span style={{ fontFamily: 'monospace' }}>{trade.tradeNo}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Exchange Trade No" span={2}>
            <span style={{ fontFamily: 'monospace' }}>{trade.exchangeTradeNo ?? '—'}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Side" span={1}>
            <Tag color={trade.side === 'Buy' ? 'green' : 'red'}>{trade.side}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            <StatusBadge status={trade.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Quantity" span={1}>
            {formatQuantity(trade.quantity)}
          </Descriptions.Item>
          <Descriptions.Item label="Price" span={1}>
            {formatCurrency(trade.price)}
          </Descriptions.Item>
          <Descriptions.Item label="Trade Value" span={1}>
            {formatCurrency(trade.tradeValue)}
          </Descriptions.Item>
          <Descriptions.Item label="Net Amount" span={1}>
            {formatCurrency(trade.netAmount)}
          </Descriptions.Item>
          <Descriptions.Item label="Total Charges" span={1}>
            {formatCurrency(trade.totalCharges)}
          </Descriptions.Item>
          <Descriptions.Item label="Realized PnL" span={1}>
            {canViewSensitive ? (
              <span style={{ color: '#1d3557', fontWeight: 600 }}>
                Calculated at Position level
              </span>
            ) : (
              <MaskedField />
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Brokerage" span={1}>
            {formatCurrency(trade.brokerage)}
          </Descriptions.Item>
          <Descriptions.Item label="STT" span={1}>
            {formatCurrency(trade.stt)}
          </Descriptions.Item>
          <Descriptions.Item label="GST" span={1}>
            {formatCurrency(trade.gst)}
          </Descriptions.Item>
          <Descriptions.Item label="Stamp Duty" span={1}>
            {formatCurrency(trade.stampDuty)}
          </Descriptions.Item>
          <Descriptions.Item label="Trade Date" span={1}>
            {formatDate(trade.tradeDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Settlement No" span={1}>
            {trade.settlementNo}
          </Descriptions.Item>
          <Descriptions.Item label="Source" span={1}>
            {trade.source}
          </Descriptions.Item>
          {trade.rejectionReason && (
            <Descriptions.Item label="Rejection Reason" span={2}>
              {trade.rejectionReason}
            </Descriptions.Item>
          )}
        </Descriptions>
      )}
    </SlideDrawer>
  );
}
