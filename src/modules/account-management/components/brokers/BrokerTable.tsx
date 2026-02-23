import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { truncateId } from '@utils/formatters';
import type { BrokerSummary } from '../../services/brokerService';

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
      width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Name', dataIndex: 'brokerName', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    { title: 'Email', dataIndex: 'contactEmail', ellipsis: true },
    { title: 'Phone', dataIndex: 'contactPhone', width: 130 },
    { title: 'SEBI Reg No', dataIndex: 'sebiRegistrationNo', width: 150 },
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
