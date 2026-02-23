import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { truncateId } from '@utils/formatters';
import type { ClientSummary } from '../../services/clientService';

interface ClientTableProps {
  data: ClientSummary[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (client: ClientSummary) => void;
}

export function ClientTable({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onRowClick,
}: ClientTableProps) {
  const columns: TableColumnsType<ClientSummary> = [
    {
      title: 'Client Code',
      dataIndex: 'clientCode',
      width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Name', dataIndex: 'clientName', ellipsis: true },
    { title: 'Type', dataIndex: 'clientType', width: 120 },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    { title: 'Email', dataIndex: 'email', ellipsis: true },
    { title: 'Phone', dataIndex: 'phone', width: 130 },
    {
      title: 'ID',
      dataIndex: 'clientId',
      width: 100,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
  ];

  return (
    <DataTable<ClientSummary>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="clientId"
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (t) => `${t} clients`,
      }}
      onRow={(record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } })}
    />
  );
}
