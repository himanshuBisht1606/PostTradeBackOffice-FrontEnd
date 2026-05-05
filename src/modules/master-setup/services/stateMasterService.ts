import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface StateRecord {
  stateId: string;
  countryId: string;
  stateCode: string;
  stateName: string;
  nseCode: number | null;
  bseName: string | null;
  cvlCode: number | null;
  ndmlCode: number | null;
  ncdexCode: number | null;
  nseKraCode: number | null;
  nsdlCode: number | null;
  isActive: boolean;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export interface CreateStatePayload {
  countryId: string;
  stateCode: string;
  stateName: string;
  nseCode?: number;
  bseName?: string;
  cvlCode?: number;
  ndmlCode?: number;
  ncdexCode?: number;
  nseKraCode?: number;
  nsdlCode?: number;
}

export async function getStates(): Promise<StateRecord[]> {
  const res = await axiosInstance.get<ApiResponse<StateRecord[]>>('/api/reference/states');
  return res.data.data ?? [];
}

export async function getStateById(id: string): Promise<StateRecord> {
  const res = await axiosInstance.get<ApiResponse<StateRecord>>(`/api/reference/states/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`State not found: ${id}`);
  return data;
}

export async function createState(payload: CreateStatePayload): Promise<StateRecord> {
  const res = await axiosInstance.post<ApiResponse<StateRecord>>('/api/reference/states', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Create state returned no data');
  return data;
}

export async function importStatesCsv(file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<ApiResponse<ImportResult>>(
    '/api/reference/states/import',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const data = res.data.data;
  if (data === null) throw new Error('Import returned no data');
  return data;
}
