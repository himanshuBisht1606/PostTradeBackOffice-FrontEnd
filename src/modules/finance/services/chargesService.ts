import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { ChargeType, CalculationType } from '@app-types/enums';

export interface ChargeConfig {
  chargesConfigId: string;
  tenantId: string;
  brokerId: string | null;
  chargeName: string;
  chargeType: ChargeType;
  calculationType: CalculationType;
  rate: number;
  minAmount: number | null;
  maxAmount: number | null;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface ChargesListParams {
  chargeType?: ChargeType | undefined;
  isActive?: boolean | undefined;
}

export async function getChargesConfig(params: ChargesListParams): Promise<ChargeConfig[]> {
  const res = await axiosInstance.get<ApiResponse<ChargeConfig[]>>('/api/ledger/charges', {
    params,
  });
  return res.data.data ?? [];
}

export interface CreateChargePayload {
  chargeName: string;
  chargeType: ChargeType;
  calculationType: CalculationType;
  rate: number;
  effectiveFrom: string;
  brokerId?: string | undefined;
  minAmount?: number | undefined;
  maxAmount?: number | undefined;
  effectiveTo?: string | undefined;
  isActive?: boolean | undefined;
}

export async function createChargeConfig(payload: CreateChargePayload): Promise<ChargeConfig> {
  const res = await axiosInstance.post<ApiResponse<ChargeConfig>>('/api/ledger/charges', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to create charge configuration');
  return data;
}
