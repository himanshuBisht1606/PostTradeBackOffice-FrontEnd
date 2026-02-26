import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { EntityStatus } from '@app-types/enums';

export interface BrokerSummary {
  brokerId: string;
  brokerCode: string;
  brokerName: string;
  sebiRegistrationNo: string | null;
  contactEmail: string;
  contactPhone: string;
  status: EntityStatus;
  tenantId: string;
  address: string | null;
  pan: string | null;
  gst: string | null;
}

export interface BrokerListParams {
  search?: string | undefined;
  status?: EntityStatus | undefined;
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

export interface CreateBrokerPayload {
  brokerName: string;
  brokerCode: string;
  contactEmail: string;
  contactPhone: string;
  sebiRegistrationNo?: string | undefined;
  address?: string | undefined;
  pan?: string | undefined;
  gst?: string | undefined;
}

export interface UpdateBrokerPayload extends Partial<CreateBrokerPayload> {
  status?: EntityStatus | undefined;
}

export async function createBroker(payload: CreateBrokerPayload): Promise<BrokerSummary> {
  const res = await axiosInstance.post<ApiResponse<BrokerSummary>>('/api/brokers', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to create broker');
  return data;
}

export async function updateBroker(id: string, payload: UpdateBrokerPayload): Promise<BrokerSummary> {
  const res = await axiosInstance.put<ApiResponse<BrokerSummary>>(`/api/brokers/${id}`, payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to update broker');
  return data;
}
