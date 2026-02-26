import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { OnboardingPayload, OnboardingResult } from '../types/onboarding.types';

export async function submitOnboarding(data: OnboardingPayload): Promise<OnboardingResult> {
  const res = await axiosInstance.post<ApiResponse<OnboardingResult>>(
    '/api/clients/onboard',
    data,
  );
  if (!res.data.data) throw new Error(res.data.message || 'Onboarding submission failed');
  return res.data.data;
}
