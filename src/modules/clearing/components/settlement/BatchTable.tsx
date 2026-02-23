import { Button, Popconfirm, Space } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { formatCurrency, formatDate, truncateId } from '@utils/formatters';
import { canApprove } from '@utils/permissions';
import { useAuthStore } from '@modules/auth/store/authStore';
import { SettlementStatus } from '@types/enums';
import { Permission } from '@types/roles.types';
import type { SettlementBatch } from '../../services/settlementService';

interface BatchTableProps {
  data: SettlementBatch[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onProcess: (id: string) => void;
}

export function BatchTable({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onProcess,
}: BatchTableProps) {
  const { userId, roles, hasPermission } = useAuthStore();
  const canProcessBatches = hasPermission(Permission.APPROVE_SETTLEMENT);

  const columns: TableColumnsType<SettlementBatch> = [
    {
      title: 'Settlement No',
      dataIndex: 'settlementNo',
      width: 160,
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    { title: 'Trades', dataIndex: 'totalTrades', width: 70, align: 'right' },
    {
      title: 'Turnover',
      dataIndex: 'totalTurnover',
      width: 140,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      title: 'Trade Date',
      dataIndex: 'tradeDate',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Settlement Date',
      dataIndex: 'settlementDate',
      width: 130,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Processed By',
      dataIndex: 'processedBy',
      width: 130,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'ID',
      dataIndex: 'batchId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        if (record.status !== SettlementStatus.Pending) return null;
        const allowed =
          canProcessBatches && canApprove(roles, userId ?? '', record.processedBy ?? '');
        if (!allowed) return <span style={{ color: '#8c8c8c', fontSize: 12 }}>—</span>;

        return (
          <Space size={4}>
            <Popconfirm
              title="Process this settlement batch?"
              onConfirm={() => onProcess(record.batchId)}
              okText="Process"
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                style={{ background: '#1d3557', borderColor: '#1d3557' }}
              >
                Process
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <DataTable<SettlementBatch>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="batchId"
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (t) => `${t} batches`,
      }}
    />
  );
}
