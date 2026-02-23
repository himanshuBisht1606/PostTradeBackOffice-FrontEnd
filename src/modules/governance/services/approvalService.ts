/**
 * Approval Queue Service
 *
 * NOTE: The backend approval queue endpoints (/api/approvals) are not yet implemented.
 * This service is scaffolded per the architecture specification and will connect
 * to the backend once the endpoints are added.
 *
 * Backend entity: AuditLog exists but no approval workflow endpoints are exposed yet.
 */
import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface ApprovalRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  requestedBy: string;
  requestedByUserId: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  metadata: Record<string, unknown>;
  tenantId: string;
}

export interface ApprovalListParams {
  status?: 'Pending' | 'Approved' | 'Rejected' | undefined;
  entityType?: string | undefined;
}

export async function getApprovals(params: ApprovalListParams): Promise<ApprovalRecord[]> {
  const res = await axiosInstance.get<ApiResponse<ApprovalRecord[]>>('/api/approvals', { params });
  return res.data.data ?? [];
}

export async function approveRecord(id: string): Promise<void> {
  await axiosInstance.post(`/api/approvals/${id}/approve`);
}

export async function rejectRecord(id: string, reason: string): Promise<void> {
  await axiosInstance.post(`/api/approvals/${id}/reject`, { reason });
}
