import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface ExchangeRecord {
  exchangeId: string;
  tenantId: string;
  exchangeCode: string;
  exchangeName: string;
  country: string;
  timeZone: string | null;
  tradingStartTime: string | null;
  tradingEndTime: string | null;
  isActive: boolean;
}

export async function getExchanges(): Promise<ExchangeRecord[]> {
  const res = await axiosInstance.get<ApiResponse<ExchangeRecord[]>>('/api/exchanges');
  return res.data.data ?? [];
}

export async function getExchangeById(id: string): Promise<ExchangeRecord> {
  const res = await axiosInstance.get<ApiResponse<ExchangeRecord>>(`/api/exchanges/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Exchange not found: ${id}`);
  return data;
}

export interface CreateExchangePayload {
  exchangeCode: string;
  exchangeName: string;
  country: string;
  timeZone?: string;
  tradingStartTime?: string;
  tradingEndTime?: string;
  isActive: boolean;
}

export async function createExchange(payload: CreateExchangePayload): Promise<ExchangeRecord> {
  const res = await axiosInstance.post<ApiResponse<ExchangeRecord>>('/api/exchanges', payload);
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from createExchange');
  return data;
}

export async function updateExchange(
  id: string,
  payload: Partial<CreateExchangePayload>,
): Promise<ExchangeRecord> {
  const res = await axiosInstance.put<ApiResponse<ExchangeRecord>>(`/api/exchanges/${id}`, payload);
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from updateExchange');
  return data;
}
