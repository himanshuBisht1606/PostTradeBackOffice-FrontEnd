import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { BrokerStatus } from '@app-types/enums';

export interface BrokerSummary {
  brokerId: string;
  brokerCode: string;
  brokerName: string;
  sebiRegistrationNo: string | null;
  contactEmail: string;
  contactPhone: string;
  status: BrokerStatus;
  tenantId: string;
  address: string | null;
  pan: string | null;
  gst: string | null;
}

export interface BrokerListParams {
  search?: string | undefined;
  status?: BrokerStatus | undefined;
}

export async function getBrokers(params: BrokerListParams): Promise<BrokerSummary[]> {
  const res = await axiosInstance.get<ApiResponse<BrokerSummary[]>>('/api/brokers', { params });
  return res.data.data ?? [];
}

export async function getBrokerById(id: string): Promise<BrokerSummary> {
  const res = await axiosInstance.get<ApiResponse<BrokerSummary>>(`/api/brokers/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Broker not found: ${id}`);
  return data;
}
