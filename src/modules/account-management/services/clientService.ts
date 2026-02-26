import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { ClientType, EntityStatus } from '@app-types/enums';

export interface ClientSummary {
  clientId: string;
  clientCode: string;
  clientName: string;
  email: string;
  phone: string;
  clientType: ClientType;
  status: EntityStatus;
  brokerId: string;
  tenantId: string;
  pan: string | null;
  address: string | null;
  bankAccountNo: string | null;
  bankName: string | null;
}

export interface ClientListParams {
  search?: string | undefined;
  status?: EntityStatus | undefined;
  clientType?: ClientType | undefined;
}

export async function getClients(params: ClientListParams): Promise<ClientSummary[]> {
  const res = await axiosInstance.get<ApiResponse<ClientSummary[]>>('/api/clients', { params });
  return res.data.data ?? [];
}

export async function getClientById(id: string): Promise<ClientSummary> {
  const res = await axiosInstance.get<ApiResponse<ClientSummary>>(`/api/clients/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Client not found: ${id}`);
  return data;
}

export interface CreateClientPayload {
  clientName: string;
  clientCode: string;
  clientType: ClientType;
  email: string;
  phone: string;
  brokerId: string;
  pan?: string | undefined;
  address?: string | undefined;
  bankAccountNo?: string | undefined;
  bankName?: string | undefined;
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {
  status?: EntityStatus | undefined;
}

export async function createClient(payload: CreateClientPayload): Promise<ClientSummary> {
  const res = await axiosInstance.post<ApiResponse<ClientSummary>>('/api/clients', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to create client');
  return data;
}

export async function updateClient(id: string, payload: UpdateClientPayload): Promise<ClientSummary> {
  const res = await axiosInstance.put<ApiResponse<ClientSummary>>(`/api/clients/${id}`, payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to update client');
  return data;
}
