import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { TradeSide, TradeStatus, TradeSource } from '@app-types/enums';

export interface TradeSummary {
  tradeId: string;
  tenantId: string;
  brokerId: string;
  clientId: string;
  instrumentId: string;
  tradeNo: string;
  exchangeTradeNo: string | null;
  side: TradeSide;
  quantity: number;
  price: number;
  tradeValue: number;
  tradeDate: string;
  tradeTime: string;
  settlementNo: string;
  status: TradeStatus;
  rejectionReason: string | null;
  source: TradeSource;
  brokerage: number;
  stt: number;
  exchangeTxnCharge: number;
  gst: number;
  stampDuty: number;
  totalCharges: number;
  netAmount: number;
}

export interface TradeListParams {
  fromDate?: string | undefined;
  toDate?: string | undefined;
  clientId?: string | undefined;
  status?: TradeStatus | undefined;
}

export async function getTrades(params: TradeListParams): Promise<TradeSummary[]> {
  const res = await axiosInstance.get<ApiResponse<TradeSummary[]>>('/api/trades', { params });
  return res.data.data ?? [];
}

export async function getTradeById(id: string): Promise<TradeSummary> {
  const res = await axiosInstance.get<ApiResponse<TradeSummary>>(`/api/trades/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Trade not found: ${id}`);
  return data;
}

export interface BookTradePayload {
  clientId: string;
  brokerId: string;
  instrumentId: string;
  side: TradeSide;
  quantity: number;
  price: number;
  tradeDate: string;
  settlementNo?: string | undefined;
  source?: TradeSource | undefined;
}

export async function bookTrade(payload: BookTradePayload): Promise<TradeSummary> {
  const res = await axiosInstance.post<ApiResponse<TradeSummary>>('/api/trades', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to book trade');
  return data;
}

export async function cancelTrade(id: string, reason?: string): Promise<void> {
  await axiosInstance.put(`/api/trades/${id}/cancel`, { reason });
}
