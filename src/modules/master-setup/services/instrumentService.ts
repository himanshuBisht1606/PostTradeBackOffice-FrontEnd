import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { InstrumentType, InstrumentStatus, OptionType } from '@app-types/enums';

export interface InstrumentRecord {
  instrumentId: string;
  tenantId: string;
  instrumentCode: string;
  instrumentName: string;
  symbol: string;
  isin: string | null;
  exchangeId: string;
  segmentId: string;
  instrumentType: InstrumentType;
  lotSize: number;
  tickSize: number;
  series: string | null;
  expiryDate: string | null;
  strikePrice: number | null;
  optionType: OptionType | null;
  status: InstrumentStatus;
}

export async function getInstruments(): Promise<InstrumentRecord[]> {
  const res = await axiosInstance.get<ApiResponse<InstrumentRecord[]>>('/api/instruments');
  return res.data.data ?? [];
}

export async function getInstrumentById(id: string): Promise<InstrumentRecord> {
  const res = await axiosInstance.get<ApiResponse<InstrumentRecord>>(`/api/instruments/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Instrument not found: ${id}`);
  return data;
}
