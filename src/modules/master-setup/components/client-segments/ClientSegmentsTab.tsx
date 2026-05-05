import { useQuery } from '@tanstack/react-query';
import type { TableColumnsType } from 'antd';
import { Tag } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { getClientSegments } from '../../services/clientSegmentService';
import type { ClientSegmentActivation } from '../../services/clientSegmentService';
import { truncateId } from '@utils/formatters';

interface ClientSegmentsTabProps {
  clientId: string;
}

export function ClientSegmentsTab({ clientId }: ClientSegmentsTabProps) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['client-segments', clientId],
    queryFn: () => getClientSegments(clientId),
    staleTime: 30_000,
  });

  const columns: TableColumnsType<ClientSegmentActivation> = [
    {
      title: 'Segment',
      dataIndex: 'exchangeSegmentId',
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => (
        <Tag color={v === 'Active' ? 'green' : v === 'Suspended' ? 'orange' : 'default'}>{v}</Tag>
      ),
    },
    {
      title: 'Margin Type',
      dataIndex: 'marginType',
      width: 110,
    },
    {
      title: 'Exposure Limit',
      dataIndex: 'exposureLimit',
      width: 140,
      align: 'right',
      render: (v: number | null) => (v != null ? `₹${v.toLocaleString('en-IN')}` : '—'),
    },
    {
      title: 'Activated On',
      dataIndex: 'activatedOn',
      width: 130,
      render: (v: string) => v.slice(0, 10),
    },
    {
      title: 'Deactivated On',
      dataIndex: 'deactivatedOn',
      width: 140,
      render: (v: string | null) => (v ? v.slice(0, 10) : '—'),
    },
  ];

  return (
    <DataTable<ClientSegmentActivation>
      columns={columns}
      dataSource={data}
      loading={isLoading}
      rowKey="activationId"
      pagination={false}
      emptyText="No segments activated for this client"
    />
  );
}
