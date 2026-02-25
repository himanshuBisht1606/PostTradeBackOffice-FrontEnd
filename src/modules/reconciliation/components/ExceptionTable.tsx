import { Button, Popconfirm } from 'antd';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { formatCurrency, formatDateTime, truncateId } from '@utils/formatters';
import type { ReconException } from '../services/reconciliationService';

interface ExceptionTableProps {
  data: ReconException[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onResolve: (id: string) => void;
}

export function ExceptionTable({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onResolve,
}: ExceptionTableProps) {
  const columns: TableColumnsType<ReconException> = [
    {
      title: 'Reference No',
      dataIndex: 'referenceNo',
      width: 150,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    { title: 'Type', dataIndex: 'exceptionType', width: 150 },
    { title: 'Description', dataIndex: 'exceptionDescription', ellipsis: true },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'Resolved At',
      dataIndex: 'resolvedAt',
      width: 150,
      render: (v: string | null) => (v ? formatDateTime(v) : '—'),
    },
    {
      title: 'ID',
      dataIndex: 'exceptionId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_, record) => {
        if (record.status === 'Resolved' || record.status === 'Closed') return null;
        return (
          <Popconfirm
            title="Mark this exception as resolved?"
            onConfirm={() => onResolve(record.exceptionId)}
            okText="Resolve"
          >
            <Button size="small" type="primary">
              Resolve
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <DataTable<ReconException>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="exceptionId"
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (t) => `${t} exceptions`,
      }}
    />
  );
}
