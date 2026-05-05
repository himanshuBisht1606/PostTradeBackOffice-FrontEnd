import { Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { DataTable } from '@shared/components/data-display/DataTable';
import { formatCurrency, formatDate } from '@utils/formatters';
import type { FoTradeBookItem } from '../../services/foTradeBookService';
import dayjs from 'dayjs';

const OPTION_TYPE_COLOR: Record<string, string> = {
  CE: 'blue',
  PE: 'volcano',
  FX: 'purple',
};

const CONTRACT_TYPE_COLOR: Record<string, string> = {
  FUTIDX: 'cyan',
  FUTSTK: 'geekblue',
  OPTIDX: 'orange',
  OPTSTK: 'gold',
};

/** Builds contract name like OPTIDXBANKNIFTY26APR2026 */
function buildContractName(contractType: string, symbol: string, expiryDate: string | null): string {
  if (!expiryDate) return `${contractType}${symbol}`;
  const expiry = dayjs(expiryDate).format('DDMMMYYYY').toUpperCase();
  return `${contractType}${symbol}${expiry}`;
}

interface TradeTableProps {
  data: FoTradeBookItem[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (trade: FoTradeBookItem) => void;
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
  const columns: TableColumnsType<FoTradeBookItem> = [
    {
      title: 'Date',
      dataIndex: 'tradeDate',
      width: 95,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Seg',
      dataIndex: 'segment',
      width: 50,
      render: (v: string) => <Tag style={{ margin: 0, fontSize: 11 }}>{v || 'FO'}</Tag>,
    },
    {
      title: 'Exch',
      dataIndex: 'exchange',
      width: 60,
      render: (v: string) => <Tag style={{ margin: 0 }}>{v}</Tag>,
    },
    {
      title: 'Instrument',
      dataIndex: 'contractType',
      width: 80,
      render: (v: string) => (
        <Tag color={CONTRACT_TYPE_COLOR[v] ?? 'default'} style={{ margin: 0, fontSize: 11 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      width: 100,
      ellipsis: true,
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: 'Contract',
      key: 'contractName',
      width: 220,
      ellipsis: true,
      render: (_: unknown, record: FoTradeBookItem) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
          {buildContractName(record.contractType, record.symbol, record.expiryDate)}
        </span>
      ),
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      width: 90,
      render: (v: string | null) => (v ? formatDate(v) : '—'),
    },
    {
      title: 'Strike',
      dataIndex: 'strikePrice',
      width: 85,
      align: 'right',
      render: (v: number) => (v > 0 ? v.toLocaleString('en-IN') : '—'),
    },
    {
      title: 'Type',
      dataIndex: 'optionType',
      width: 55,
      render: (v: string) => (
        <Tag color={OPTION_TYPE_COLOR[v] ?? 'default'} style={{ margin: 0 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'B/S',
      dataIndex: 'side',
      width: 55,
      render: (v: string) => (
        <Tag color={v === 'B' ? 'green' : 'red'} style={{ margin: 0 }}>
          {v === 'B' ? 'Buy' : 'Sell'}
        </Tag>
      ),
    },
    {
      title: 'Client Code',
      dataIndex: 'clientCode',
      width: 110,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    // ── Trade execution ────────────────────────────────────────────────────
    {
      title: 'Qty',
      dataIndex: 'quantity',
      width: 85,
      align: 'right',
      render: (v: number) => v.toLocaleString('en-IN'),
    },
    {
      title: 'Lot',
      dataIndex: 'lotSize',
      width: 65,
      align: 'right',
      render: (v: number) => v.toLocaleString('en-IN'),
    },
    {
      title: 'FMult',
      dataIndex: 'numberOfLots',
      width: 65,
      align: 'right',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      width: 95,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Trade Value',
      dataIndex: 'tradeValue',
      width: 115,
      align: 'right',
      render: (v: number) => formatCurrency(v),
    },
    // ── Identity / compliance columns ──────────────────────────────────────
    {
      title: 'CTCLID',
      dataIndex: 'ctclId',
      width: 110,
      render: (v: string | null) =>
        v ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span>
          : <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Org Client ID',
      dataIndex: 'originalClientId',
      width: 110,
      render: (v: string | null) =>
        v ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span>
          : <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Client State',
      dataIndex: 'clientStateCode',
      width: 90,
      render: (v: string | null) => v ?? <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Branch',
      dataIndex: 'branchCode',
      width: 80,
      render: (v: string | null) => v ?? <span style={{ color: '#bfbfbf' }}>—</span>,
    },
  ];

  return (
    <DataTable<FoTradeBookItem>
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      size="small"
      scroll={{ x: 2100 }}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        showSizeChanger: true,
        pageSizeOptions: ['25', '50', '100'],
        showTotal: (t) => `${t.toLocaleString('en-IN')} trades`,
      }}
      onRow={(record) => ({ onClick: () => onRowClick(record), style: { cursor: 'pointer' } })}
    />
  );
}
