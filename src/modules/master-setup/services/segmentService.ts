import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface SegmentRecord {
  segmentId: string;
  tenantId: string;
  segmentCode: string;
  segmentName: string;
  description: string | null;
  isActive: boolean;
}

export async function getSegments(): Promise<SegmentRecord[]> {
  const res = await axiosInstance.get<ApiResponse<SegmentRecord[]>>('/api/segments');
  return res.data.data ?? [];
}

export async function getSegmentById(id: string): Promise<SegmentRecord> {
  const res = await axiosInstance.get<ApiResponse<SegmentRecord>>(`/api/segments/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Segment not found: ${id}`);
  return data;
}

export interface CreateSegmentPayload {
  segmentCode: string;
  segmentName: string;
  description?: string;
  isActive: boolean;
}

export async function createSegment(payload: CreateSegmentPayload): Promise<SegmentRecord> {
  const res = await axiosInstance.post<ApiResponse<SegmentRecord>>('/api/segments', payload);
  return res.data.data!;
}

export async function updateSegment(
  id: string,
  payload: Partial<CreateSegmentPayload>,
): Promise<SegmentRecord> {
  const res = await axiosInstance.put<ApiResponse<SegmentRecord>>(`/api/segments/${id}`, payload);
  return res.data.data!;
}
