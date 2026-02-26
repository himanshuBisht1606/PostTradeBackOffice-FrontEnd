import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface DashboardKpis {
  pendingApprovals: number;
  reconBreaks: number;
  exposureBreaches: number;
  settlementFailures: number;
  marginShortfall: number;
  todayTurnover: number;    // in ₹ Crores
  openPositionsValue: number; // in ₹ Crores
  t1PendingCount: number;
  activeClients: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;    // ₹ Crores
  brokerage: number;  // ₹ Crores
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

export interface SegmentDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  revenueTrend: RevenueDataPoint[];
  settlementAging: AgingDataPoint[];
  exposureUtilization: ExposureDataPoint[];
  segmentBreakdown: SegmentDataPoint[];
  ledgerImbalanceAmount: number;
  ledgerAffectedAccounts: number;
}

interface BatchItem { status: string }
interface ReconItem { status: string }

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [batchRes, reconRes] = await Promise.allSettled([
    axiosInstance.get<ApiResponse<BatchItem[]>>('/api/settlement/batches'),
    axiosInstance.get<ApiResponse<ReconItem[]>>('/api/reconciliation'),
  ]);

  const batches = batchRes.status === 'fulfilled' ? (batchRes.value.data.data ?? []) : [];
  const recons  = reconRes.status  === 'fulfilled' ? (reconRes.value.data.data  ?? []) : [];

  const pendingBatches    = batches.filter((b) => b.status === 'Pending').length;
  const failedBatches     = batches.filter((b) => b.status === 'Failed').length;
  const mismatchedRecons  = recons.filter((r)  => r.status === 'Variated').length;

  return {
    kpis: {
      pendingApprovals: pendingBatches,
      reconBreaks: mismatchedRecons,
      exposureBreaches: 2,
      settlementFailures: failedBatches,
      marginShortfall: 3,
      todayTurnover: 12487,
      openPositionsValue: 4832,
      t1PendingCount: 1247,
      activeClients: 3842,
    },
    revenueTrend: [
      { date: '14-Feb', revenue: 68.4,  brokerage: 21.4 },
      { date: '15-Feb', revenue: 72.3,  brokerage: 22.9 },
      { date: '17-Feb', revenue: 69.8,  brokerage: 21.8 },
      { date: '18-Feb', revenue: 81.2,  brokerage: 25.4 },
      { date: '19-Feb', revenue: 76.4,  brokerage: 23.8 },
      { date: '20-Feb', revenue: 92.3,  brokerage: 28.9 },
      { date: '21-Feb', revenue: 87.5,  brokerage: 27.4 },
      { date: '24-Feb', revenue: 102.4, brokerage: 32.1 },
      { date: '25-Feb', revenue: 113.8, brokerage: 35.8 },
      { date: '26-Feb', revenue: 124.9, brokerage: 39.2 },
    ],
    settlementAging: [
      { bucket: 'T+1',  count: 1247 },
      { bucket: 'T+2',  count: 382  },
      { bucket: 'T+3',  count: 48   },
      { bucket: '>T+3', count: 12   },
    ],
    exposureUtilization: [
      { name: 'Equity',    utilization: 72, fill: '#1d3557' },
      { name: 'F&O',       utilization: 88, fill: '#e63946' },
      { name: 'Currency',  utilization: 45, fill: '#457b9d' },
      { name: 'Commodity', utilization: 31, fill: '#2a9d8f' },
    ],
    segmentBreakdown: [
      { name: 'Equity Cash',  value: 35, color: '#1d3557' },
      { name: 'F&O Futures',  value: 28, color: '#457b9d' },
      { name: 'F&O Options',  value: 24, color: '#e63946' },
      { name: 'Currency',     value: 8,  color: '#2a9d8f' },
      { name: 'Commodity',    value: 5,  color: '#f4a261' },
    ],
    ledgerImbalanceAmount: 0,
    ledgerAffectedAccounts: 0,
  };
}
