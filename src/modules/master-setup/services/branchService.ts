import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface BranchRecord {
  branchId: string;
  tenantId: string;
  branchCode: string;
  branchName: string;
  address: string | null;
  city: string | null;
  stateCode: string;
  stateName: string;
  gstin: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  isActive: boolean;
}

export async function getBranches(): Promise<BranchRecord[]> {
  const res = await axiosInstance.get<ApiResponse<BranchRecord[]>>('/api/branches');
  return res.data.data ?? [];
}

export async function getBranchById(id: string): Promise<BranchRecord> {
  const res = await axiosInstance.get<ApiResponse<BranchRecord>>(`/api/branches/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Branch not found: ${id}`);
  return data;
}

export interface CreateBranchPayload {
  branchCode: string;
  branchName: string;
  address?: string;
  city?: string;
  stateCode: string;
  stateName: string;
  gstin?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
}

export async function createBranch(payload: CreateBranchPayload): Promise<BranchRecord> {
  const res = await axiosInstance.post<ApiResponse<BranchRecord>>('/api/branches', payload);
  return res.data.data!;
}

export async function updateBranch(
  id: string,
  payload: Partial<CreateBranchPayload>,
): Promise<BranchRecord> {
  const res = await axiosInstance.put<ApiResponse<BranchRecord>>(`/api/branches/${id}`, payload);
  return res.data.data!;
}
