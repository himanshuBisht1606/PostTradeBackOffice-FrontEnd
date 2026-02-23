/**
 * Audit Log Service
 *
 * NOTE: The backend audit log query endpoints (/api/audit) are not yet implemented.
 * The AuditLog entity exists in the domain layer with fields:
 *   AuditId, TenantId, UserId, Username, AuditType, EntityName, EntityId,
 *   Action, OldValues, NewValues, IPAddress, UserAgent, Timestamp
 *
 * This service is scaffolded per specification and will connect once
 * the backend exposes GET /api/audit endpoints.
 */
import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';

export interface AuditLogEntry {
  auditId: string;
  tenantId: string;
  userId: string;
  username: string;
  auditType: string;
  entityName: string;
  entityId: string;
  action: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuditListParams {
  userId?: string;
  entityName?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export async function getAuditLog(params: AuditListParams): Promise<AuditLogEntry[]> {
  const res = await axiosInstance.get<ApiResponse<AuditLogEntry[]>>('/api/audit', { params });
  return res.data.data ?? [];
}
