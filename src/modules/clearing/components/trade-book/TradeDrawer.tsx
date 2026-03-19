import { Descriptions, Tag, Typography } from 'antd';
import { SlideDrawer } from '@shared/components/data-display/SlideDrawer';
import { formatCurrency, formatDate } from '@utils/formatters';
import type { FoTradeBookItem } from '../../services/foTradeBookService';
import dayjs from 'dayjs';

const { Text } = Typography;

const OPTION_TYPE_COLOR: Record<string, string> = { CE: 'blue', PE: 'volcano', FX: 'purple' };
const CONTRACT_TYPE_COLOR: Record<string, string> = {
  FUTIDX: 'cyan', FUTSTK: 'geekblue', OPTIDX: 'orange', OPTSTK: 'gold',
};

function buildContractName(contractType: string, symbol: string, expiryDate: string | null): string {
  if (!expiryDate) return `${contractType}${symbol}`;
  const expiry = dayjs(expiryDate).format('DDMMMYYYY').toUpperCase();
  return `${contractType}${symbol}${expiry}`;
}

interface TradeDrawerProps {
  trade: FoTradeBookItem | null;
  onClose: () => void;
}

export function TradeDrawer({ trade, onClose }: TradeDrawerProps) {
  return (
    <SlideDrawer
      title={
        trade ? (
          <span>
            <Tag color={CONTRACT_TYPE_COLOR[trade.contractType] ?? 'default'} style={{ marginRight: 6 }}>
              {trade.contractType}
            </Tag>
            <Text code style={{ fontSize: 12 }}>
              {buildContractName(trade.contractType, trade.symbol, trade.expiryDate)}
            </Text>
          </span>
        ) : (
          'Trade Detail'
        )
      }
      open={!!trade}
      onClose={onClose}
      isLoading={false}
    >
      {trade && (
        <div style={{ padding: '0 24px' }}>
          <Descriptions bordered column={2} size="small" title="Trade Identity" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Trade ID" span={2}>
              <Text code style={{ fontSize: 11 }}>{trade.uniqueTradeId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trade Date">{formatDate(trade.tradeDate)}</Descriptions.Item>
            <Descriptions.Item label="Segment / Exchange">
              {trade.segment || 'FO'} / {trade.exchange}
            </Descriptions.Item>
            <Descriptions.Item label="Clearing Member">{trade.clearingMemberId || '—'}</Descriptions.Item>
            <Descriptions.Item label="Broker / TM ID">{trade.brokerId}</Descriptions.Item>
            <Descriptions.Item label="Branch ID">{trade.branchCode || '—'}</Descriptions.Item>
            <Descriptions.Item label="Settlement Type">{trade.settlementType}</Descriptions.Item>
            <Descriptions.Item label="Settlement Tx ID" span={2}>
              <Text code style={{ fontSize: 11 }}>{trade.settlementTransactionId}</Text>
            </Descriptions.Item>
          </Descriptions>

          <Descriptions bordered column={2} size="small" title="Instrument" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Instrument Type">
              <Tag color={CONTRACT_TYPE_COLOR[trade.contractType] ?? 'default'}>{trade.contractType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Symbol">{trade.symbol}</Descriptions.Item>
            <Descriptions.Item label="Contract Name" span={2}>
              <Text code style={{ fontSize: 11 }}>
                {buildContractName(trade.contractType, trade.symbol, trade.expiryDate)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Security Name" span={2}>
              <Text code style={{ fontSize: 11 }}>{trade.instrumentName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Expiry Date">
              {trade.expiryDate ? formatDate(trade.expiryDate) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Strike Price">
              {trade.strikePrice > 0 ? trade.strikePrice.toLocaleString('en-IN') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Option Type">
              <Tag color={OPTION_TYPE_COLOR[trade.optionType] ?? 'default'}>{trade.optionType}</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Descriptions bordered column={2} size="small" title="Client" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Client Code">
              <Text code>{trade.clientCode}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Client Type">
              {trade.clientType === 'C' ? 'Client' : trade.clientType === 'P' ? 'Proprietary' : trade.clientType}
            </Descriptions.Item>
            <Descriptions.Item label="CTCLID">
              {trade.ctclId ? <Text code style={{ fontSize: 11 }}>{trade.ctclId}</Text> : <Text type="secondary">—</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Org Client ID (ORGCLENTID)">
              {trade.originalClientId
                ? <Text code style={{ fontSize: 11 }}>{trade.originalClientId}</Text>
                : <Text type="secondary">—</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Client State">{trade.clientStateCode || '—'}</Descriptions.Item>
            <Descriptions.Item label="Client Name">
              {trade.clientName ?? <Text type="secondary">Not linked</Text>}
            </Descriptions.Item>
          </Descriptions>

          <Descriptions bordered column={2} size="small" title="Trade Execution">
            <Descriptions.Item label="Side">
              <Tag color={trade.side === 'B' ? 'green' : 'red'}>
                {trade.side === 'B' ? 'Buy' : 'Sell'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">
              {trade.quantity.toLocaleString('en-IN')}
            </Descriptions.Item>
            <Descriptions.Item label="Lot (NewBrdLotQty)">{trade.lotSize.toLocaleString('en-IN')}</Descriptions.Item>
            <Descriptions.Item label="FMult (No. of Lots)">{trade.numberOfLots.toFixed(4)}</Descriptions.Item>
            <Descriptions.Item label="Price">{formatCurrency(trade.price)}</Descriptions.Item>
            <Descriptions.Item label="Trade Value" span={2}>
              <strong>{formatCurrency(trade.tradeValue)}</strong>
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </SlideDrawer>
  );
}
