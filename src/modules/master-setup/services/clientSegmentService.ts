import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { ActivationStatus, MarginType } from '@app-types/enums';

export interface ClientSegmentActivation {
  activationId: string;
  tenantId: string;
  clientId: string;
  exchangeSegmentId: string;
  status: ActivationStatus;
  exposureLimit: number | null;
  marginType: MarginType;
  activatedOn: string;
  deactivatedOn: string | null;
}

export async function getClientSegments(clientId: string): Promise<ClientSegmentActivation[]> {
  const res = await axiosInstance.get<ApiResponse<ClientSegmentActivation[]>>(
    `/api/clients/${clientId}/segments`,
  );
  return res.data.data ?? [];
}

export async function activateClientSegment(
  clientId: string,
  payload: {
    exchangeSegmentId: string;
    exposureLimit?: number;
    marginType: MarginType;
  },
): Promise<ClientSegmentActivation> {
  const res = await axiosInstance.post<ApiResponse<ClientSegmentActivation>>(
    `/api/clients/${clientId}/segments`,
    payload,
  );
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from activateClientSegment');
  return data;
}

export async function deactivateClientSegment(
  activationId: string,
): Promise<ClientSegmentActivation> {
  const res = await axiosInstance.put<ApiResponse<ClientSegmentActivation>>(
    `/api/clients/segments/${activationId}/deactivate`,
  );
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from deactivateClientSegment');
  return data;
}
