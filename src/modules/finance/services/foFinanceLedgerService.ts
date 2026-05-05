import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface FoFinanceLedgerItem {
  id: string;
  tenantId: string;
  tradeDate: string;
  exchange: string;
  clearingMemberId: string;
  brokerId: string;
  clientCode: string;
  clientId: string | null;
  clientName: string | null;
  buyTurnover: number;
  sellTurnover: number;
  totalTurnover: number;
  totalStt: number;
  totalStampDuty: number;
  brokerage: number;
  exchangeTransactionCharges: number;
  sebiCharges: number;
  ipft: number;
  gstOnCharges: number;
  totalCharges: number;
  dailyMtmSettlement: number;
  netPremium: number;
  finalSettlement: number;
  exerciseAssignmentValue: number;
  netAmount: number;
}

export interface FoFinanceLedgerParams {
  tradeDate?: string | undefined;
  exchange?: string | undefined;
  clientCode?: string | undefined;
}

export interface ComputeFoFinanceLedgerRequest {
  tradeDate: string;
  exchange: string;
}

export interface ComputeFoFinanceLedgerResult {
  clientCount: number;
  message: string;
}

export async function getFoFinanceLedger(
  params: FoFinanceLedgerParams,
): Promise<FoFinanceLedgerItem[]> {
  const res = await axiosInstance.get<ApiResponse<FoFinanceLedgerItem[]>>(
    '/api/clearing/fo/finance-ledger',
    { params },
  );
  return res.data.data ?? [];
}

export async function computeFoFinanceLedger(
  request: ComputeFoFinanceLedgerRequest,
): Promise<ComputeFoFinanceLedgerResult> {
  const res = await axiosInstance.post<ApiResponse<ComputeFoFinanceLedgerResult>>(
    '/api/clearing/fo/finance-ledger/compute',
    request,
  );
  const data = res.data.data;
  if (data === null || data === undefined) throw new Error('Compute returned no data');
  return data;
}

export async function deleteFoFinanceLedger(tradeDate: string, exchange: string): Promise<void> {
  await axiosInstance.delete('/api/clearing/fo/finance-ledger', {
    params: { tradeDate, exchange },
  });
}
