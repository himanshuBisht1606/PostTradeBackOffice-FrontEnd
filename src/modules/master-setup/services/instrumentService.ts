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

export interface FoContractRecord {
  contractRowId: string;
  tradingDate: string;
  exchange: string;
  finInstrmId: string;
  tckrSymb: string;
  finInstrmNm: string;
  xpryDt: string;
  expiryDate: string | null;
  strkPric: number;
  optnTp: string;
  finInstrmTp: string;
  sttlmMtd: string;
  stockNm: string;
  minLot: number;
  newBrdLotQty: number;
  registeredInstrumentId: string | null;
}

/** Curated FoContract row — from FoContracts table with normalized fields */
export interface FoContractCuratedRecord {
  contractId: string;
  exchange: string;
  tradingDate: string;
  instrumentType: string;    // FUTIDX | FUTSTK | OPTIDX | OPTSTK
  symbol: string;
  contractName: string;      // FUTIDXNIFTY27MAR2025
  expiryDate: string;        // yyyy-MM-dd
  strikePrice: number;       // in ₹ (already ÷ 100)
  optionType: string;        // CE | PE | FX
  lotSize: number;
  fMultiplier: number;
  finInstrmId: string | null;
  underlyingSymbol: string;
  isin: string | null;
  tickSize: number;
  sttlmMtd: string | null;
  registeredInstrumentId: string | null;
}

export interface CreateInstrumentPayload {
  instrumentCode: string;
  instrumentName: string;
  symbol: string;
  isin?: string | null;
  exchangeId: string;
  segmentId: string;
  instrumentType: InstrumentType;
  lotSize: number;
  tickSize: number;
  series?: string | null;
  expiryDate?: string | null;
  strikePrice?: number | null;
  optionType?: OptionType | null;
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

export async function createInstrument(payload: CreateInstrumentPayload): Promise<InstrumentRecord> {
  const res = await axiosInstance.post<ApiResponse<InstrumentRecord>>('/api/instruments', payload);
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from createInstrument');
  return data;
}

export async function getFoContracts(params?: {
  exchange?: string;
  tradingDate?: string;
  symbol?: string;
  contractType?: string;
  optionType?: string;
  page?: number;
  pageSize?: number;
}): Promise<FoContractRecord[]> {
  const res = await axiosInstance.get<ApiResponse<FoContractRecord[]>>(
    '/api/post-trade/fo/contract-masters',
    { params },
  );
  return res.data.data ?? [];
}

export async function registerFoContract(contractRowId: string): Promise<InstrumentRecord> {
  const res = await axiosInstance.post<ApiResponse<InstrumentRecord>>(
    `/api/post-trade/fo/contract-masters/${contractRowId}/register`,
  );
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from registerFoContract');
  return data;
}

// ── Curated FO Contracts (FoContracts table) ──────────────────────────────────

export async function getFoContractsCurated(params?: {
  exchange?: string | undefined;
  tradingDate?: string | undefined;
  symbol?: string | undefined;
  instrumentType?: string | undefined;
  optionType?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}): Promise<FoContractCuratedRecord[]> {
  const res = await axiosInstance.get<ApiResponse<FoContractCuratedRecord[]>>(
    '/api/post-trade/fo/contracts',
    { params },
  );
  return res.data.data ?? [];
}

export async function registerFoContractCurated(contractId: string): Promise<InstrumentRecord> {
  const res = await axiosInstance.post<ApiResponse<InstrumentRecord>>(
    `/api/post-trade/fo/contracts/${contractId}/register`,
  );
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from registerFoContractCurated');
  return data;
}
