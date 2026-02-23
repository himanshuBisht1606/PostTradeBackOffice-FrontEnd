import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { SettlementStatus, ObligationStatus } from '@types/enums';

export interface SettlementBatch {
  batchId: string;
  tenantId: string;
  settlementNo: string;
  tradeDate: string;
  settlementDate: string;
  exchangeId: string;
  status: SettlementStatus;
  totalTrades: number;
  totalTurnover: number;
  processedAt: string | null;
  processedBy: string | null;
}

export interface SettlementObligation {
  obligationId: string;
  tenantId: string;
  brokerId: string;
  clientId: string;
  batchId: string;
  settlementNo: string;
  fundsPayIn: number;
  fundsPayOut: number;
  netFundsObligation: number;
  securitiesPayIn: number;
  securitiesPayOut: number;
  netSecuritiesObligation: number;
  status: ObligationStatus;
  settledAt: string | null;
}

export interface BatchListParams {
  status?: SettlementStatus;
}

export interface ObligationListParams {
  batchId?: string;
  status?: ObligationStatus;
}

export async function getSettlementBatches(params: BatchListParams): Promise<SettlementBatch[]> {
  const res = await axiosInstance.get<ApiResponse<SettlementBatch[]>>('/api/settlement/batches', {
    params,
  });
  return res.data.data ?? [];
}

export async function processSettlementBatch(id: string): Promise<void> {
  await axiosInstance.put(`/api/settlement/batches/${id}/process`);
}

export async function getSettlementObligations(
  params: ObligationListParams,
): Promise<SettlementObligation[]> {
  const res = await axiosInstance.get<ApiResponse<SettlementObligation[]>>(
    '/api/settlement/obligations',
    { params },
  );
  return res.data.data ?? [];
}

export async function settleObligation(id: string): Promise<void> {
  await axiosInstance.put(`/api/settlement/obligations/${id}/settle`);
}
