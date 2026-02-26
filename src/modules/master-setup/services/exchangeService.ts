import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface Exchange {
  exchangeId: string;
  exchangeCode: string;
  exchangeName: string;
  country: string;
  currency: string;
  isActive: boolean;
  tenantId: string;
}

export async function getExchanges(): Promise<Exchange[]> {
  const res = await axiosInstance.get<ApiResponse<Exchange[]>>('/api/exchanges');
  return res.data.data ?? [];
}

export interface CreateExchangePayload {
  exchangeCode: string;
  exchangeName: string;
  country: string;
  currency: string;
  isActive?: boolean | undefined;
}

export interface UpdateExchangePayload extends Partial<CreateExchangePayload> {}

export async function createExchange(payload: CreateExchangePayload): Promise<Exchange> {
  const res = await axiosInstance.post<ApiResponse<Exchange>>('/api/exchanges', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to create exchange');
  return data;
}

export async function updateExchange(id: string, payload: UpdateExchangePayload): Promise<Exchange> {
  const res = await axiosInstance.put<ApiResponse<Exchange>>(`/api/exchanges/${id}`, payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to update exchange');
  return data;
}
