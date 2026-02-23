import { Descriptions, Tag, Alert } from 'antd';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { formatDateTime } from '@utils/formatters';
import type { ApprovalRecord } from '../../services/approvalService';

interface ApprovalDrawerProps {
  record: ApprovalRecord | null;
  onClose: () => void;
}

export function ApprovalDrawer({ record, onClose }: ApprovalDrawerProps) {
  const metaEntries = record
    ? Object.entries(record.metadata).map(([k, v]) => ({
        key: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      }))
    : [];

  return (
    <SlideDrawer
      title={record ? `Approval — ${record.action}` : 'Approval Detail'}
      open={!!record}
      onClose={onClose}
    >
      {record && (
        <>
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Entity Type" span={1}>
              {record.entityType}
            </Descriptions.Item>
            <Descriptions.Item label="Entity ID" span={1}>
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.entityId}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Action" span={1}>
              <Tag color="blue">{record.action}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <StatusBadge status={record.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Requested By" span={1}>
              {record.requestedBy}
            </Descriptions.Item>
            <Descriptions.Item label="Requested At" span={1}>
              {formatDateTime(record.requestedAt)}
            </Descriptions.Item>
            {record.approvedBy && (
              <>
                <Descriptions.Item label="Approved By" span={1}>
                  {record.approvedBy}
                </Descriptions.Item>
                <Descriptions.Item label="Approved At" span={1}>
                  {record.approvedAt ? formatDateTime(record.approvedAt) : '—'}
                </Descriptions.Item>
              </>
            )}
            {record.rejectedBy && (
              <>
                <Descriptions.Item label="Rejected By" span={1}>
                  {record.rejectedBy}
                </Descriptions.Item>
                <Descriptions.Item label="Rejected At" span={1}>
                  {record.rejectedAt ? formatDateTime(record.rejectedAt) : '—'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>

          {record.rejectionReason && (
            <Alert
              type="error"
              message="Rejection Reason"
              description={record.rejectionReason}
              style={{ marginBottom: 16 }}
            />
          )}

          {metaEntries.length > 0 && (
            <Descriptions bordered column={1} size="small" title="Metadata">
              {metaEntries.map((entry) => (
                <Descriptions.Item key={entry.key} label={entry.key}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{entry.value}</span>
                </Descriptions.Item>
              ))}
            </Descriptions>
          )}
        </>
      )}
    </SlideDrawer>
  );
}
