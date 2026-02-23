import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { StatusBadge } from '@shared/components/data-display/StatusBadge';
import { formatCurrency, formatDate, truncateId } from '@utils/formatters';
import type { TradeSummary } from '../../services/tradeService';

interface TradeTableProps {
  data: TradeSummary[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (trade: TradeSummary) => void;
}

export function TradeTable({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onRowClick,
}: TradeTableProps) {
  const columns: TableColumnsType<TradeSummary> = [
    {
      title: 'Trade No',
      dataIndex: 'tradeNo',
      width: 150,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Side',
      dataIndex: 'side',
      width: 70,
      render: (v: string) => <Tag color={v === 'Buy' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => <StatusBadge status={v} />,
    },
    { title: 'Qty', dataIndex: 'quantity', width: 90, align: 'right' },
    {
      title: 'Price',
      dataIndex: 'price',
      width: 110,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Net Amount',
      dataIndex: 'netAmount',
      width: 130,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    { title: 'Settlement No', dataIndex: 'settlementNo', width: 130 },
    {
      title: 'Trade Date',
      dataIndex: 'tradeDate',
      width: 110,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'ID',
      dataIndex: 'tradeId',
      width: 90,
      render: (v: string) => (
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{truncateId(v)}</span>
      ),
    },
  ];

  return (
    <DataTable<TradeSummary>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="tradeId"
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
        showTotal: (t) => `${t} trades`,
      }}
      onRow={(record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } })}
    />
  );
}
