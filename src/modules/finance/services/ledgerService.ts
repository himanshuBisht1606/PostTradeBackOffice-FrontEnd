import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { LedgerType, EntryType } from '@app-types/enums';

export interface LedgerEntry {
  ledgerId: string;
  tenantId: string;
  brokerId: string;
  clientId: string;
  voucherNo: string;
  postingDate: string;
  valueDate: string;
  ledgerType: LedgerType;
  entryType: EntryType;
  debit: number;
  credit: number;
  balance: number;
  referenceType: string;
  referenceId: string;
  narration: string | null;
  isReversed: boolean;
  reversalLedgerId: string | null;
}

export interface LedgerListParams {
  clientId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  ledgerType?: LedgerType | undefined;
  entryType?: EntryType | undefined;
}

export async function getLedgerEntries(params: LedgerListParams): Promise<LedgerEntry[]> {
  const res = await axiosInstance.get<ApiResponse<LedgerEntry[]>>('/api/ledger/entries', {
    params,
  });
  return res.data.data ?? [];
}
