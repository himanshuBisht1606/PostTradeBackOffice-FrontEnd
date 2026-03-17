import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { FoFileType, FoImportStatus } from '@app-types/enums';
import type { FoImportBatch, FoImportBatchLog, FoContractMaster, ImportResult } from '../types/foImport.types';

const BASE = '/api/post-trade/fo';

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

export function importFoContractMaster(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/contract-master', file, tradingDate, exchange);
}

export function importFoTrade(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/trade', file, tradingDate, exchange);
}

export function importFoBhavCopy(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/bhavcopy', file, tradingDate, exchange);
}

export function importFoStt(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/stt', file, tradingDate, exchange);
}

export function importFoStampDuty(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/stamp-duty', file, tradingDate, exchange);
}

export function importFoPosition(file: File, tradingDate: string, exchange: string) {
  return uploadFile('import/position', file, tradingDate, exchange);
}

// ── Batch queries ─────────────────────────────────────────────────────────────

export interface FoBatchListParams {
  fileType?: FoFileType | undefined;
  exchange?: string | undefined;
  tradingDate?: string | undefined;
  status?: FoImportStatus | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getFoImportBatches(params: FoBatchListParams = {}): Promise<FoImportBatch[]> {
  const res = await axiosInstance.get<ApiResponse<FoImportBatch[]>>(
    `${BASE}/import/batches`,
    { params },
  );
  return res.data.data ?? [];
}

export async function getFoImportBatchLogs(batchId: string): Promise<FoImportBatchLog[]> {
  const res = await axiosInstance.get<ApiResponse<FoImportBatchLog[]>>(
    `${BASE}/import/batches/${batchId}/logs`,
  );
  return res.data.data ?? [];
}

export async function deleteFoImportBatch(batchId: string): Promise<void> {
  await axiosInstance.delete(`${BASE}/import/batches/${batchId}`);
}

// ── Contract Master query ─────────────────────────────────────────────────────

export interface FoContractMasterParams {
  exchange?: string | undefined;
  tradingDate?: string | undefined;
  symbol?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getFoContractMasters(params: FoContractMasterParams = {}): Promise<FoContractMaster[]> {
  const res = await axiosInstance.get<ApiResponse<FoContractMaster[]>>(
    `${BASE}/contract-masters`,
    { params },
  );
  return res.data.data ?? [];
}
