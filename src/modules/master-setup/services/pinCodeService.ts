import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface PinCodeRecord {
  pinCodeId: string;
  pinCode: string;
  district: string | null;
  city: string | null;
  stateCode: string;
  countryCode: string;
  mcxCode: string | null;
  isActive: boolean;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function getPinCodes(stateCode?: string): Promise<PinCodeRecord[]> {
  const url = stateCode
    ? `/api/reference/pin-codes?stateCode=${encodeURIComponent(stateCode)}`
    : '/api/reference/pin-codes';
  const res = await axiosInstance.get<ApiResponse<PinCodeRecord[]>>(url);
  return res.data.data ?? [];
}

export async function getPinCodeByCode(code: string): Promise<PinCodeRecord | null> {
  try {
    const res = await axiosInstance.get<ApiResponse<PinCodeRecord>>(
      `/api/reference/pin-codes/${encodeURIComponent(code)}`,
    );
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

export async function importPinCodesCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    '/api/reference/pin-codes/import',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}
