import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { CmFileType, CmImportStatus } from '@app-types/enums';
import type {
  CmImportBatch,
  CmImportBatchLog,
  CmSettlementMaster,
  CmScripMaster,
  ImportResult,
} from '../types/cmImport.types';

const BASE = '/api/post-trade/cm';

// ── Generic file upload ───────────────────────────────────────────────────────

async function uploadFile(
  endpoint: string,
  file: File,
  tradingDate: string,
  exchange: string,
): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    `${BASE}/${endpoint}?tradingDate=${tradingDate}&exchange=${encodeURIComponent(exchange)}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}

// ── Import endpoints ──────────────────────────────────────────────────────────

export function importSettlementMaster(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/settlement-master', file, tradingDate, exchange);
}

export function importScripMaster(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/scrip-master', file, tradingDate, exchange);
}

export function importTrade(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/trade', file, tradingDate, exchange);
}

export function importBhavCopy(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/bhavcopy', file, tradingDate, exchange);
}

export function importMargin(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/margin', file, tradingDate, exchange);
}

export function importObligation(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/obligation', file, tradingDate, exchange);
}

export function importStt(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/stt', file, tradingDate, exchange);
}

export function importStampDuty(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/stamp-duty', file, tradingDate, exchange);
}

// ── Batch queries ─────────────────────────────────────────────────────────────

export interface CmBatchListParams {
  fileType?: CmFileType | undefined;
  exchange?: string | undefined;
  tradingDate?: string | undefined;
  status?: CmImportStatus | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getCmImportBatches(params: CmBatchListParams = {}): Promise<CmImportBatch[]> {
  const res = await axiosInstance.get<ApiResponse<CmImportBatch[]>>(
    `${BASE}/import/batches`,
    { params },
  );
  return res.data.data ?? [];
}

export interface BatchLogsPagedResult {
  summary: { level: string; message: string; count: number }[];
  items: CmImportBatchLog[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function getCmImportBatchLogs(
  batchId: string,
  page = 1,
  pageSize = 50,
): Promise<BatchLogsPagedResult> {
  const res = await axiosInstance.get<ApiResponse<BatchLogsPagedResult>>(
    `${BASE}/import/batches/${batchId}/logs`,
    { params: { page, pageSize } },
  );
  return res.data.data ?? { summary: [], items: [], totalCount: 0, page, pageSize };
}

export async function deleteCmImportBatch(batchId: string): Promise<void> {
  await axiosInstance.delete(`${BASE}/import/batches/${batchId}`);
}

// ── Exchange download (no file upload — server fetches from NSE / BSE) ────────

export async function downloadNseScripMaster(tradingDate: string): Promise<ImportResult> {
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    `${BASE}/import/scrip-master/download/nse?tradingDate=${tradingDate}`,
    null,
    { timeout: 180_000 },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}

export async function downloadBseScripMaster(tradingDate: string): Promise<ImportResult> {
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    `${BASE}/import/scrip-master/download/bse?tradingDate=${tradingDate}`,
    null,
    { timeout: 180_000 },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}

// ── Master queries ────────────────────────────────────────────────────────────

export async function getCmSettlementMasters(
  exchange?: string,
  tradingDate?: string,
): Promise<CmSettlementMaster[]> {
  const res = await axiosInstance.get<ApiResponse<CmSettlementMaster[]>>(
    `${BASE}/settlement-masters`,
    { params: { exchange, tradingDate } },
  );
  return res.data.data ?? [];
}

export interface CmScripMasterParams {
  exchange?: string | undefined;
  tradingDate?: string | undefined;
  symbol?: string | undefined;
  isin?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getCmScripMasters(params: CmScripMasterParams = {}): Promise<CmScripMaster[]> {
  const res = await axiosInstance.get<ApiResponse<CmScripMaster[]>>(
    `${BASE}/scrip-masters`,
    { params },
  );
  return res.data.data ?? [];
}
