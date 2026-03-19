import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface FoTradeBookItem {
  id: string;
  tradeDate: string;
  segment: string;
  exchange: string;
  uniqueTradeId: string;
  clearingMemberId: string;
  brokerId: string;
  branchCode: string | null;
  symbol: string;
  instrumentName: string;
  contractType: string;    // FUTIDX | FUTSTK | OPTIDX | OPTSTK
  expiryDate: string | null;
  strikePrice: number;
  optionType: string;      // CE | PE | FX
  lotSize: number;         // FMULTIPLIER
  clientType: string;      // C | P
  clientCode: string;
  ctclId: string | null;   // Exchange unique client terminal ID
  originalClientId: string | null; // ORGCLENTID
  clientId: string | null;
  clientName: string | null;
  clientStateCode: string | null;
  side: string;            // B | S
  quantity: number;
  numberOfLots: number;
  price: number;
  tradeValue: number;
  settlementType: string;
  settlementTransactionId: string;
  batchId: string;
}

export interface FoTradeBookPagedResult {
  items: FoTradeBookItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface FoTradeBookParams {
  dateFrom: string;
  dateTo: string;
  exchange?: string | undefined;
  symbol?: string | undefined;
  clientCode?: string | undefined;
  optionType?: string | undefined;
  side?: string | undefined;
  contractType?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getFoTradeBook(params: FoTradeBookParams): Promise<FoTradeBookPagedResult> {
  const res = await axiosInstance.get<ApiResponse<FoTradeBookPagedResult>>(
    '/api/clearing/fo/trade-book',
    { params },
  );
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 50 };
}
