import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { formatDateTime, truncateId } from '@utils/formatters';
import type { AuditLogEntry } from '../../services/auditService';

interface AuditTableProps {
  data: AuditLogEntry[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (entry: AuditLogEntry) => void;
}

export function AuditTable({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onRowClick,
}: AuditTableProps) {
  const columns: TableColumnsType<AuditLogEntry> = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    { title: 'User', dataIndex: 'username', width: 140 },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Entity',
      dataIndex: 'entityName',
      width: 140,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: 'Entity ID',
      dataIndex: 'entityId',
      width: 110,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    { title: 'IP Address', dataIndex: 'ipAddress', width: 130 },
    {
      title: 'Has Diff',
      key: 'hasDiff',
      width: 80,
      render: (_, record) =>
        record.oldValues || record.newValues ? <Tag color="orange">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Audit Type',
      dataIndex: 'auditType',
      width: 110,
      render: (v: string) => <Tag>{v}</Tag>,
    },
  ];

  return (
    <DataTable<AuditLogEntry>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="auditId"
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (t) => `${t} entries`,
      }}
      onRow={(record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } })}
    />
  );
}
