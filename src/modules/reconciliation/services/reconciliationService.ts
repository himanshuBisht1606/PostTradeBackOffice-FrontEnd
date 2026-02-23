import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { ReconType, ReconStatus, ExceptionType, ExceptionStatus } from '@types/enums';

export interface ReconRecord {
  reconId: string;
  tenantId: string;
  reconDate: string;
  settlementNo: string;
  reconType: ReconType;
  systemValue: number;
  exchangeValue: number;
  difference: number;
  toleranceLimit: number;
  status: ReconStatus;
  comments: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface ReconException {
  exceptionId: string;
  reconId: string;
  tenantId: string;
  exceptionType: ExceptionType;
  exceptionDescription: string;
  referenceNo: string;
  amount: number;
  status: ExceptionStatus;
  resolution: string | null;
  resolvedAt: string | null;
}

export interface ReconStats {
  totalRecords: number;
  matched: number;
  variated: number;
  pending: number;
  openExceptions: number;
  resolvedToday: number;
}

export interface ReconListParams {
  reconDate?: string;
  reconType?: ReconType;
  status?: ReconStatus;
}

export interface ExceptionListParams {
  reconId?: string;
  status?: ExceptionStatus;
}

export async function getReconRecords(params: ReconListParams): Promise<ReconRecord[]> {
  const res = await axiosInstance.get<ApiResponse<ReconRecord[]>>('/api/reconciliation', {
    params,
  });
  return res.data.data ?? [];
}

export async function getReconStats(): Promise<ReconStats> {
  const res = await axiosInstance.get<ApiResponse<ReconStats>>('/api/reconciliation/stats');
  return res.data.data!;
}

export async function getReconExceptions(params: ExceptionListParams): Promise<ReconException[]> {
  const res = await axiosInstance.get<ApiResponse<ReconException[]>>(
    '/api/reconciliation/exceptions',
    { params },
  );
  return res.data.data ?? [];
}

export async function resolveException(id: string, resolution: string): Promise<void> {
  await axiosInstance.put(`/api/reconciliation/exceptions/${id}/resolve`, { resolution });
}
