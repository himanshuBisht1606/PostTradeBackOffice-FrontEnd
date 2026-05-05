import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface BankRecord {
  bankId: string;
  bankCode: string;
  bankName: string;
  ifscPrefix: string;
  isActive: boolean;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function getBankMasters(): Promise<BankRecord[]> {
  const res = await axiosInstance.get<ApiResponse<BankRecord[]>>('/api/reference/banks');
  return res.data.data ?? [];
}

export async function getBankMasterById(id: string): Promise<BankRecord> {
  const res = await axiosInstance.get<ApiResponse<BankRecord>>(`/api/reference/banks/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Bank not found: ${id}`);
  return data;
}

export async function importBankMastersCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    '/api/reference/banks/import',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}
