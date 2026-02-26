import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { InstrumentType, OptionType, InstrumentStatus } from '@app-types/enums';

export interface Instrument {
  instrumentId: string;
  isin: string;
  symbol: string;
  instrumentName: string;
  instrumentType: InstrumentType;
  exchangeId: string;
  segmentId: string | null;
  lotSize: number;
  tickSize: number;
  currency: string;
  status: InstrumentStatus;
  expiryDate: string | null;
  strikePrice: number | null;
  optionType: OptionType | null;
  tenantId: string;
}

export interface InstrumentListParams {
  exchangeId?: string | undefined;
  type?: InstrumentType | undefined;
}

export async function getInstruments(params: InstrumentListParams): Promise<Instrument[]> {
  const res = await axiosInstance.get<ApiResponse<Instrument[]>>('/api/instruments', { params });
  return res.data.data ?? [];
}

export interface CreateInstrumentPayload {
  isin: string;
  symbol: string;
  instrumentName: string;
  instrumentType: InstrumentType;
  exchangeId: string;
  lotSize: number;
  tickSize: number;
  currency: string;
  segmentId?: string | undefined;
  expiryDate?: string | undefined;
  strikePrice?: number | undefined;
  optionType?: OptionType | undefined;
}

export interface UpdateInstrumentPayload extends Partial<CreateInstrumentPayload> {
  status?: InstrumentStatus | undefined;
}

export async function createInstrument(payload: CreateInstrumentPayload): Promise<Instrument> {
  const res = await axiosInstance.post<ApiResponse<Instrument>>('/api/instruments', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to create instrument');
  return data;
}

export async function updateInstrument(id: string, payload: UpdateInstrumentPayload): Promise<Instrument> {
  const res = await axiosInstance.put<ApiResponse<Instrument>>(`/api/instruments/${id}`, payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to update instrument');
  return data;
}
