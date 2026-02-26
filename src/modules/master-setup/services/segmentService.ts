import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface Segment {
  segmentId: string;
  segmentCode: string;
  segmentName: string;
  exchangeId: string;
  isActive: boolean;
  tenantId: string;
}

export async function getSegments(exchangeId?: string): Promise<Segment[]> {
  const res = await axiosInstance.get<ApiResponse<Segment[]>>('/api/segments', {
    params: { exchangeId },
  });
  return res.data.data ?? [];
}

export interface CreateSegmentPayload {
  segmentCode: string;
  segmentName: string;
  exchangeId: string;
  isActive?: boolean | undefined;
}

export interface UpdateSegmentPayload extends Partial<CreateSegmentPayload> {}

export async function createSegment(payload: CreateSegmentPayload): Promise<Segment> {
  const res = await axiosInstance.post<ApiResponse<Segment>>('/api/segments', payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to create segment');
  return data;
}

export async function updateSegment(id: string, payload: UpdateSegmentPayload): Promise<Segment> {
  const res = await axiosInstance.put<ApiResponse<Segment>>(`/api/segments/${id}`, payload);
  const data = res.data.data;
  if (data === null) throw new Error('Failed to update segment');
  return data;
}
