import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface DashboardKpis {
  pendingApprovals: number;
  reconBreaks: number;
  exposureBreaches: number;
  settlementFailures: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface AgingDataPoint {
  bucket: string;
  count: number;
}

export interface ExposureDataPoint {
  name: string;
  utilization: number;
  fill: string;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  revenueTrend: RevenueDataPoint[];
  settlementAging: AgingDataPoint[];
  exposureUtilization: ExposureDataPoint[];
  ledgerImbalanceAmount: number;
  ledgerAffectedAccounts: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [pendingRes, reconRes, failedRes] = await Promise.allSettled([
    axiosInstance.get<ApiResponse<{ totalCount: number }>>('/api/settlement/batches?status=Pending'),
    axiosInstance.get<ApiResponse<{ totalCount: number }>>('/api/reconciliation?status=Variated'),
    axiosInstance.get<ApiResponse<{ totalCount: number }>>('/api/settlement/batches?status=Failed'),
  ]);

  const pendingApprovals =
    pendingRes.status === 'fulfilled' ? (pendingRes.value.data.data?.totalCount ?? 0) : 0;
  const reconBreaks =
    reconRes.status === 'fulfilled' ? (reconRes.value.data.data?.totalCount ?? 0) : 0;
  const settlementFailures =
    failedRes.status === 'fulfilled' ? (failedRes.value.data.data?.totalCount ?? 0) : 0;

  return {
    kpis: { pendingApprovals, reconBreaks, exposureBreaches: 0, settlementFailures },
    revenueTrend: [],
    settlementAging: [
      { bucket: '0–1 days', count: 0 },
      { bucket: '2–3 days', count: 0 },
      { bucket: '4–7 days', count: 0 },
      { bucket: '>7 days', count: 0 },
    ],
    exposureUtilization: [],
    ledgerImbalanceAmount: 0,
    ledgerAffectedAccounts: 0,
  };
}
