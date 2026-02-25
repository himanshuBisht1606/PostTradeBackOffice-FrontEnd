import axiosInstance from '@core/api/axiosInstance';
import type { ApiResponse } from '@core/types/api.types';
import type { LoginRequest, LoginResponse } from '../types/auth.types';

/**
 * POST /api/auth/login
 * The only public endpoint — does not require Authorization header.
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await axiosInstance.post<ApiResponse<LoginResponse>>('/api/auth/login', request);

  const body = response.data;
  if (!body.success || !body.data) {
    throw new Error(body.message || 'Login failed');
  }

  return body.data;
}
