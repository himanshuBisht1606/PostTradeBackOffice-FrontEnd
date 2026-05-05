import type { TableColumnsType } from 'antd';
import { Tag } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { truncateId } from '@utils/formatters';
import type { BrokerSummary } from '../../services/brokerService';
import type { BrokerEntityType } from '@app-types/enums';

const ENTITY_TYPE_LABELS: Record<string, string> = {
  Proprietorship: 'Proprietorship',
  Partnership: 'Partnership',
  LLP: 'LLP',
  PrivateLimited: 'Pvt. Ltd.',
  PublicLimited: 'Ltd.',
  Other: 'Other',
};

interface BrokerTableProps {
  data: BrokerSummary[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (broker: BrokerSummary) => void;
}

export function BrokerTable({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onRowClick,
}: BrokerTableProps) {
  const columns: TableColumnsType<BrokerSummary> = [
    {
      title: 'Broker Code',
      dataIndex: 'brokerCode',
      width: 120,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Name', dataIndex: 'brokerName', ellipsis: true },
    {
      title: 'Type',
      dataIndex: 'entityType',
      width: 100,
      render: (v: BrokerEntityType) => <Tag>{ENTITY_TYPE_LABELS[v] ?? v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'City / State',
      key: 'location',
      ellipsis: true,
      render: (_: unknown, r: BrokerSummary) =>
        r.registeredCity || r.registeredState
          ? `${r.registeredCity ?? ''}${r.registeredCity && r.registeredState ? ', ' : ''}${r.registeredState ?? ''}`
          : '—',
    },
    { title: 'SEBI Reg No', dataIndex: 'sebiRegistrationNo', width: 150 },
    { title: 'Email', dataIndex: 'contactEmail', ellipsis: true },
    { title: 'Phone', dataIndex: 'contactPhone', width: 130 },
    {
      title: 'ID',
      dataIndex: 'brokerId',
      width: 100,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
  ];

  return (
    <DataTable<BrokerSummary>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="brokerId"
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (t) => `${t} brokers`,
      }}
      onRow={(record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } })}
    />
  );
}
