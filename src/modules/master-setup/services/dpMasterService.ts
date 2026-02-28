import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface DpRecord {
  dpId: string;
  dpCode: string;
  dpName: string;
  sebiRegNo: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  phone: string | null;
  email: string | null;
  memberStatus: string;
  isActive: boolean;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function getNsdlDpMasters(): Promise<DpRecord[]> {
  const res = await axiosInstance.get<ApiResponse<DpRecord[]>>('/api/reference/nsdl-dps');
  return res.data.data ?? [];
}

export async function getCdslDpMasters(): Promise<DpRecord[]> {
  const res = await axiosInstance.get<ApiResponse<DpRecord[]>>('/api/reference/cdsl-dps');
  return res.data.data ?? [];
}

export async function importNsdlDpMastersCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    '/api/reference/nsdl-dps/import',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}

export async function importCdslDpMastersCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    '/api/reference/cdsl-dps/import',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}
