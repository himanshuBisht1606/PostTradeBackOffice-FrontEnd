import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type {
  ClientType,
  ClientStatus,
  KYCStatus,
  RiskCategory,
  Depository,
} from '@app-types/enums';

export interface ClientSummary {
  clientId: string;
  tenantId: string;
  brokerId: string;
  branchId: string | null;
  clientCode: string;
  clientName: string;
  email: string;
  phone: string;
  clientType: ClientType;
  status: ClientStatus;
  pan: string | null;
  aadhaar: string | null;
  dpId: string | null;
  dematAccountNo: string | null;
  depository: Depository | null;
  address: string | null;
  stateCode: string | null;
  stateName: string | null;
  bankAccountNo: string | null;
  bankName: string | null;
  bankIFSC: string | null;
  kycStatus: KYCStatus;
  riskCategory: RiskCategory;
}

export interface ClientListParams {
  page?: number | undefined;
  pageSize?: number | undefined;
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
