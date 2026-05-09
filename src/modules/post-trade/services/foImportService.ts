import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { FoImportBatchLogsPagedResponse } from '../types/foImport.types';

export type FoFileType = 'ContractMaster' | 'Trade' | 'BhavCopy' | 'Stt' | 'StampDuty' | 'Position';
export type FoImportStatus = 'Processing' | 'Completed' | 'Failed';

export interface FoImportBatch {
  batchId: string;
  fileType: FoFileType;
  exchange: string;
  tradingDate: string;
  status: FoImportStatus;
  totalRows: number;
  createdRows: number;
  skippedRows: number;
  errorRows: number;
  fileName: string;
  startedAt: string;
  completedAt: string | null;
}

export interface ImportQueuedData {
  exchange: string;
  tradingDate: string;
  fileName: string;
}

async function uploadFile(
  endpoint: string,
  file: File,
  tradingDate: string,
  exchange: string,
): Promise<ImportQueuedData> {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<ApiResponse<ImportQueuedData>>(endpoint, form, {
    params: { tradingDate, exchange },
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000, // 2 min — large files can take time to transfer
  });
  return res.data.data!;
}

export const importFoContractMaster = (file: File, tradingDate: string, exchange: string) =>
  uploadFile('/api/post-trade/fo/import/contract-master', file, tradingDate, exchange);

export const importFoTrade = (file: File, tradingDate: string, exchange: string) =>
  uploadFile('/api/post-trade/fo/import/trade', file, tradingDate, exchange);

export const importFoBhavCopy = (file: File, tradingDate: string, exchange: string) =>
  uploadFile('/api/post-trade/fo/import/bhavcopy', file, tradingDate, exchange);

export const importFoStt = (file: File, tradingDate: string, exchange: string) =>
  uploadFile('/api/post-trade/fo/import/stt', file, tradingDate, exchange);

export const importFoStampDuty = (file: File, tradingDate: string, exchange: string) =>
  uploadFile('/api/post-trade/fo/import/stamp-duty', file, tradingDate, exchange);

export const importFoPosition = (file: File, tradingDate: string, exchange: string) =>
  uploadFile('/api/post-trade/fo/import/position', file, tradingDate, exchange);

export async function getFoImportBatchLogs(
  batchId: string,
  page = 1,
  pageSize = 50,
): Promise<FoImportBatchLogsPagedResponse> {
  const res = await axiosInstance.get<ApiResponse<FoImportBatchLogsPagedResponse>>(
    `/api/post-trade/fo/import/batches/${batchId}/logs`,
    { params: { page, pageSize } },
  );
  return res.data.data!;
}

export async function getFoImportBatches(params: {
  fileType?: FoFileType;
  exchange?: string;
  tradingDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<FoImportBatch[]> {
  const res = await axiosInstance.get<ApiResponse<FoImportBatch[]>>(
    '/api/post-trade/fo/import/batches',
    { params },
  );
  return res.data.data ?? [];
}
