import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { ChargeType, CalculationType } from '@types/enums';

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
  chargeType?: ChargeType;
  isActive?: boolean;
}

export async function getChargesConfig(params: ChargesListParams): Promise<ChargeConfig[]> {
  const res = await axiosInstance.get<ApiResponse<ChargeConfig[]>>('/api/ledger/charges', {
    params,
  });
  return res.data.data ?? [];
}
