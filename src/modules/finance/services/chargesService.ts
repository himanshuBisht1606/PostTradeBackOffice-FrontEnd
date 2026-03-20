import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { ChargeType, TradeSegment, ChargeApplicableTo, CalculationType } from '@app-types/enums';

export interface ChargeConfig {
  chargesConfigId: string;
  tenantId: string;
  brokerId: string | null;
  chargeName: string;
  chargeType: ChargeType;
  segment: TradeSegment;
  applicableTo: ChargeApplicableTo;
  calculationType: CalculationType;
  rate: number;
  minAmount: number | null;
  maxAmount: number | null;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  remarks: string | null;
}

export interface ChargesListParams {
  chargeType?: ChargeType | undefined;
  segment?: TradeSegment | undefined;
  isActive?: boolean | undefined;
}

export interface CreateChargeConfigPayload {
  brokerId?: string | null;
  chargeName: string;
  chargeType: ChargeType;
  segment: TradeSegment;
  applicableTo: ChargeApplicableTo;
  calculationType: CalculationType;
  rate: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  remarks?: string | null;
}

export interface UpdateChargeConfigPayload extends CreateChargeConfigPayload {
  chargesConfigId: string;
}

export async function getChargesConfig(params: ChargesListParams): Promise<ChargeConfig[]> {
  const res = await axiosInstance.get<ApiResponse<ChargeConfig[]>>('/api/ledger/charges', { params });
  return res.data.data ?? [];
}

export async function createChargesConfig(payload: CreateChargeConfigPayload): Promise<ChargeConfig> {
  const res = await axiosInstance.post<ApiResponse<ChargeConfig>>('/api/ledger/charges', payload);
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response');
  return data;
}

export async function updateChargesConfig(payload: UpdateChargeConfigPayload): Promise<ChargeConfig> {
  const res = await axiosInstance.put<ApiResponse<ChargeConfig>>(
    `/api/ledger/charges/${payload.chargesConfigId}`,
    payload,
  );
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response');
  return data;
}

export async function toggleChargesConfigStatus(id: string): Promise<ChargeConfig> {
  const res = await axiosInstance.patch<ApiResponse<ChargeConfig>>(
    `/api/ledger/charges/${id}/toggle`,
  );
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response');
  return data;
}
