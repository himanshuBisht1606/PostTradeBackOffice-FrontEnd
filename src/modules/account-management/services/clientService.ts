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
  registrationNumber: string;
  clientCode: string | null;       // null until ops assigns it
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

/** Extended type returned by GET /api/clients/{id} — includes all onboarding fields */
export interface ClientDetail extends ClientSummary {
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  grossAnnualIncome: string | null;
  fatherSpouseName: string | null;
  motherName: string | null;
  alternateMobile: string | null;
  city: string | null;
  pinCode: string | null;
  correspondenceAddress: string | null;
  holderType: string;
  citizenshipStatus: string | null;
  residentialStatus: string | null;
  accountType: string | null;
  branchName: string | null;
}

export interface UpdateClientPayload {
  branchId?: string | null;
  clientName: string;
  email: string;
  phone: string;
  status: ClientStatus;
  pan?: string | null;
  aadhaar?: string | null;
  dpId?: string | null;
  dematAccountNo?: string | null;
  depository?: Depository | null;
  address?: string | null;
  stateCode?: string | null;
  stateName?: string | null;
  bankAccountNo?: string | null;
  bankName?: string | null;
  bankIFSC?: string | null;
  kycStatus: KYCStatus;
  riskCategory: RiskCategory;
  // Extended personal
  gender?: string | null;
  dateOfBirth?: string | null;
  maritalStatus?: string | null;
  occupation?: string | null;
  grossAnnualIncome?: string | null;
  fatherSpouseName?: string | null;
  motherName?: string | null;
  // Extended contact & address
  alternateMobile?: string | null;
  city?: string | null;
  pinCode?: string | null;
  correspondenceAddress?: string | null;
  // Extended bank
  accountType?: string | null;
  branchName?: string | null;
}

export interface ClientListParams {
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getClients(params: ClientListParams): Promise<ClientSummary[]> {
  const res = await axiosInstance.get<ApiResponse<ClientSummary[]>>('/api/clients', { params });
  return res.data.data ?? [];
}

export async function getClientById(id: string): Promise<ClientDetail> {
  const res = await axiosInstance.get<ApiResponse<ClientDetail>>(`/api/clients/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Client not found: ${id}`);
  return data;
}

export async function updateClient(id: string, payload: UpdateClientPayload): Promise<ClientDetail> {
  const res = await axiosInstance.put<ApiResponse<ClientDetail>>(`/api/clients/${id}`, payload);
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from updateClient');
  return data;
}

export async function changeClientStatus(id: string, status: ClientStatus): Promise<void> {
  await axiosInstance.patch(`/api/clients/${id}/status`, { status });
}

export async function deleteClient(id: string): Promise<void> {
  await axiosInstance.delete(`/api/clients/${id}`);
}

export async function assignClientCode(id: string, clientCode: string): Promise<void> {
  await axiosInstance.patch(`/api/clients/${id}/assign-code`, { clientCode });
}
