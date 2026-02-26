import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { CorporateActionType, CorporateActionStatus } from '@app-types/enums';

export interface CorporateAction {
  corporateActionId: string;
  instrumentId: string;
  actionType: CorporateActionType;
  status: CorporateActionStatus;
  recordDate: string;
  effectiveDate: string;
  ratio: number | null;
  dividendPerShare: number | null;
  description: string | null;
  processedAt: string | null;
  processedBy: string | null;
  tenantId: string;
}

export interface CorporateActionListParams {
  instrumentId?: string | undefined;
  actionType?: CorporateActionType | undefined;
  status?: CorporateActionStatus | undefined;
}

export async function getCorporateActions(params: CorporateActionListParams): Promise<CorporateAction[]> {
  const res = await axiosInstance.get<ApiResponse<CorporateAction[]>>('/api/corporate-actions', {
    params,
  });
  return res.data.data ?? [];
}

export interface CreateCorporateActionPayload {
  instrumentId: string;
  actionType: CorporateActionType;
  recordDate: string;
  effectiveDate: string;
  ratio?: number | undefined;
  dividendPerShare?: number | undefined;
  description?: string | undefined;
}

export async function createCorporateAction(payload: CreateCorporateActionPayload): Promise<CorporateAction> {
  const res = await axiosInstance.post<ApiResponse<CorporateAction>>('/api/corporate-actions', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to create corporate action');
  return data;
}

export async function processCorporateAction(id: string): Promise<void> {
  await axiosInstance.put(`/api/corporate-actions/${id}/process`);
}
