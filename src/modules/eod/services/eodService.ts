import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface EodStatus {
  date: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  triggeredBy: string | null;
  error: string | null;
}

export async function runEod(): Promise<void> {
  await axiosInstance.post('/api/eod/run');
}

export async function getEodStatus(date: string): Promise<EodStatus> {
  const res = await axiosInstance.get<ApiResponse<EodStatus>>(`/api/eod/status/${date}`);
  const data = res.data.data;
  if (data === null) throw new Error('EOD status not available for this date');
  return data;
}
