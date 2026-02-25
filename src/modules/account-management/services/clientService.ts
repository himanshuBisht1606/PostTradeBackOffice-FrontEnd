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
