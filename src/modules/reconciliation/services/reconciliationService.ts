import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { ReconType, ReconStatus, ExceptionType, ExceptionStatus } from '@app-types/enums';

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
  reconDate?: string | undefined;
  reconType?: ReconType | undefined;
  status?: ReconStatus | undefined;
}

export interface ExceptionListParams {
  reconId?: string | undefined;
  status?: ExceptionStatus | undefined;
}

export async function getReconRecords(params: ReconListParams): Promise<ReconRecord[]> {
  const res = await axiosInstance.get<ApiResponse<ReconRecord[]>>('/api/reconciliation', {
    params,
  });
  return res.data.data ?? [];
}

export async function getReconExceptions(params: ExceptionListParams): Promise<ReconException[]> {
  const res = await axiosInstance.get<ApiResponse<ReconException[]>>(
    '/api/reconciliation/exceptions',
    { params },
  );
  return res.data.data ?? [];
}

export async function getReconStats(): Promise<ReconStats> {
  const [records, exceptions] = await Promise.all([
    getReconRecords({}),
    getReconExceptions({}),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return {
    totalRecords: records.length,
    matched: records.filter((r) => r.status === 'Matched').length,
    variated: records.filter((r) => r.status === 'Variated').length,
    pending: records.filter((r) => r.status === 'Pending').length,
    openExceptions: exceptions.filter((e) => e.status === 'Open').length,
    resolvedToday: exceptions.filter(
      (e) => e.status === 'Resolved' && e.resolvedAt?.startsWith(today),
    ).length,
  };
}

export async function resolveException(id: string, resolution: string): Promise<void> {
  await axiosInstance.put(`/api/reconciliation/exceptions/${id}/resolve`, { resolution });
}
