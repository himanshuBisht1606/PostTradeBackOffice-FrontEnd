import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { BrokerStatus, BrokerEntityType, MembershipType } from '@app-types/enums';

// ── List (summary) ────────────────────────────────────────────────────────────

export interface BrokerSummary {
  brokerId: string;
  brokerCode: string;
  brokerName: string;
  entityType: BrokerEntityType;
  status: BrokerStatus;
  sebiRegistrationNo: string | null;
  contactEmail: string;
  contactPhone: string;
  registeredCity: string | null;
  registeredState: string | null;
  tenantId: string;
  pan: string | null;
  gst: string | null;
}

// ── Detail (full profile) ─────────────────────────────────────────────────────

export interface BrokerExchangeMembership {
  brokerExchangeMembershipId: string;
  brokerId: string;
  exchangeSegmentId: string;
  exchangeSegmentCode: string;
  exchangeSegmentName: string;
  tradingMemberId: string;
  clearingMemberId: string | null;
  membershipType: MembershipType;
  effectiveDate: string;         // ISO date "YYYY-MM-DD"
  expiryDate: string | null;
  isActive: boolean;
}

export interface BrokerDetail {
  brokerId: string;
  tenantId: string;

  // Identity
  brokerCode: string;
  brokerName: string;
  entityType: BrokerEntityType;
  status: BrokerStatus;
  logoUrl: string | null;
  website: string | null;

  // Company
  cin: string | null;
  tan: string | null;
  pan: string | null;
  gst: string | null;
  incorporationDate: string | null;

  // Contact
  contactEmail: string;
  contactPhone: string;

  // Registered Address
  registeredAddressLine1: string | null;
  registeredAddressLine2: string | null;
  registeredCity: string | null;
  registeredState: string | null;
  registeredPinCode: string | null;
  registeredCountry: string | null;

  // Correspondence Address
  correspondenceSameAsRegistered: boolean;
  correspondenceAddressLine1: string | null;
  correspondenceAddressLine2: string | null;
  correspondenceCity: string | null;
  correspondenceState: string | null;
  correspondencePinCode: string | null;

  // SEBI
  sebiRegistrationNo: string | null;
  sebiRegistrationDate: string | null;
  sebiRegistrationExpiry: string | null;

  // Compliance
  complianceOfficerName: string | null;
  complianceOfficerEmail: string | null;
  complianceOfficerPhone: string | null;
  principalOfficerName: string | null;
  principalOfficerEmail: string | null;
  principalOfficerPhone: string | null;

  // Settlement Bank
  settlementBankName: string | null;
  settlementBankAccountNo: string | null;
  settlementBankIfsc: string | null;
  settlementBankBranch: string | null;

  // Memberships
  exchangeMemberships: BrokerExchangeMembership[];
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface UpdateBrokerPayload {
  brokerName: string;
  entityType: BrokerEntityType;
  website?: string | null;
  contactEmail: string;
  contactPhone: string;
  cin?: string | null;
  tan?: string | null;
  pan?: string | null;
  gst?: string | null;
  incorporationDate?: string | null;
  registeredAddressLine1?: string | null;
  registeredAddressLine2?: string | null;
  registeredCity?: string | null;
  registeredState?: string | null;
  registeredPinCode?: string | null;
  registeredCountry?: string | null;
  correspondenceSameAsRegistered: boolean;
  correspondenceAddressLine1?: string | null;
  correspondenceAddressLine2?: string | null;
  correspondenceCity?: string | null;
  correspondenceState?: string | null;
  correspondencePinCode?: string | null;
  sebiRegistrationNo?: string | null;
  sebiRegistrationDate?: string | null;
  sebiRegistrationExpiry?: string | null;
  complianceOfficerName?: string | null;
  complianceOfficerEmail?: string | null;
  complianceOfficerPhone?: string | null;
  principalOfficerName?: string | null;
  principalOfficerEmail?: string | null;
  principalOfficerPhone?: string | null;
  settlementBankName?: string | null;
  settlementBankAccountNo?: string | null;
  settlementBankIfsc?: string | null;
  settlementBankBranch?: string | null;
}

export interface UpsertMembershipPayload {
  exchangeSegmentId: string;
  tradingMemberId: string;
  clearingMemberId?: string | null;
  membershipType: MembershipType;
  effectiveDate: string;
  expiryDate?: string | null;
  isActive: boolean;
}

export interface BrokerListParams {
  search?: string | undefined;
  status?: BrokerStatus | undefined;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function getBrokers(params: BrokerListParams): Promise<BrokerSummary[]> {
  const res = await axiosInstance.get<ApiResponse<BrokerSummary[]>>('/api/brokers', { params });
  return res.data.data ?? [];
}

export async function getBrokerById(id: string): Promise<BrokerDetail> {
  const res = await axiosInstance.get<ApiResponse<BrokerDetail>>(`/api/brokers/${id}`);
  const data = res.data.data;
  if (data === null) throw new Error(`Broker not found: ${id}`);
  return data;
}

export async function updateBroker(id: string, payload: UpdateBrokerPayload): Promise<BrokerSummary> {
  const res = await axiosInstance.put<ApiResponse<BrokerSummary>>(`/api/brokers/${id}`, payload);
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from updateBroker');
  return data;
}

export async function changeBrokerStatus(id: string, status: BrokerStatus): Promise<void> {
  await axiosInstance.patch(`/api/brokers/${id}/status`, { status });
}

export async function upsertBrokerMembership(
  brokerId: string,
  payload: UpsertMembershipPayload,
): Promise<BrokerExchangeMembership> {
  const res = await axiosInstance.put<ApiResponse<BrokerExchangeMembership>>(
    `/api/brokers/${brokerId}/memberships`,
    payload,
  );
  const data = res.data.data;
  if (!data) throw new Error('Unexpected null response from upsertBrokerMembership');
  return data;
}

export async function deleteBrokerMembership(brokerId: string, membershipId: string): Promise<void> {
  await axiosInstance.delete(`/api/brokers/${brokerId}/memberships/${membershipId}`);
}
