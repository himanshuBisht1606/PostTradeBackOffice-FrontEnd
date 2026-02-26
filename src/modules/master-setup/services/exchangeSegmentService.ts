import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { SettlementType } from '@app-types/enums';

export interface ExchangeSegmentRecord {
  exchangeSegmentId: string;
  tenantId: string;
  exchangeId: string;
  segmentId: string;
  exchangeSegmentCode: string;
  exchangeSegmentName: string;
  settlementType: SettlementType;
  isActive: boolean;
}

export async function getExchangeSegments(params?: {
  exchangeId?: string;
  segmentId?: string;
}): Promise<ExchangeSegmentRecord[]> {
  const res = await axiosInstance.get<ApiResponse<ExchangeSegmentRecord[]>>(
    '/api/exchange-segments',
    { params },
  );
  return res.data.data ?? [];
}

export async function getExchangeSegmentById(id: string): Promise<ExchangeSegmentRecord> {
  const res = await axiosInstance.get<ApiResponse<ExchangeSegmentRecord>>(
    `/api/exchange-segments/${id}`,
  );
  const data = res.data.data;
  if (data === null) throw new Error(`ExchangeSegment not found: ${id}`);
  return data;
}

export interface CreateExchangeSegmentPayload {
  exchangeId: string;
  segmentId: string;
  exchangeSegmentCode: string;
  exchangeSegmentName: string;
  settlementType: SettlementType;
  isActive: boolean;
}

export async function createExchangeSegment(
  payload: CreateExchangeSegmentPayload,
): Promise<ExchangeSegmentRecord> {
  const res = await axiosInstance.post<ApiResponse<ExchangeSegmentRecord>>(
    '/api/exchange-segments',
    payload,
  );
  return res.data.data!;
}

export async function updateExchangeSegment(
  id: string,
  payload: Partial<CreateExchangeSegmentPayload>,
): Promise<ExchangeSegmentRecord> {
  const res = await axiosInstance.put<ApiResponse<ExchangeSegmentRecord>>(
    `/api/exchange-segments/${id}`,
    payload,
  );
  return res.data.data!;
}
