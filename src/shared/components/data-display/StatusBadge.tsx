import { Tag } from 'antd';
import type { TradeStatus, SettlementStatus, ObligationStatus, ReconStatus, ExceptionStatus, EntityStatus } from '@app-types/enums';

type AnyStatus =
  | TradeStatus
  | SettlementStatus
  | ObligationStatus
  | ReconStatus
  | ExceptionStatus
  | EntityStatus
  | string;

const STATUS_COLOR_MAP: Record<string, string> = {
  // Trade
  Pending: 'orange',
  Confirmed: 'blue',
  Settled: 'green',
  Cancelled: 'default',
  Rejected: 'red',
  // Settlement
  Processing: 'processing',
  Completed: 'green',
  Failed: 'red',
  // Recon
  Matched: 'green',
  Mismatched: 'red',
  Resolved: 'blue',
  // Exception
  Open: 'red',
  InProgress: 'orange',
  Closed: 'default',
  // Entity
  Active: 'green',
  Inactive: 'orange',
  Deleted: 'default',
  // Obligation
  PartiallySettled: 'orange',
};

interface StatusBadgeProps {
  status: AnyStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLOR_MAP[status] ?? 'default';
  return <Tag color={color}>{status}</Tag>;
}
