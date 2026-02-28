import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface BankMappingRecord {
  mappingId: string;
  bankCode: string;
  ifscCode: string;
  micrCode: string;
  isActive: boolean;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function getBankMappingsByBankCode(bankCode: string): Promise<BankMappingRecord[]> {
  const res = await axiosInstance.get<ApiResponse<BankMappingRecord[]>>(
    `/api/reference/bank-mappings?bankCode=${encodeURIComponent(bankCode)}`,
  );
  return res.data.data ?? [];
}

export async function getBankMappingByIFSC(ifsc: string): Promise<BankMappingRecord | null> {
  try {
    const res = await axiosInstance.get<ApiResponse<BankMappingRecord>>(
      `/api/reference/bank-mappings/ifsc/${encodeURIComponent(ifsc)}`,
    );
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export async function importBankMappingsCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    '/api/reference/bank-mappings/import',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}
