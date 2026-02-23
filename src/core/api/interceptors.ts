import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { notification } from 'antd';
import axiosInstance from './axiosInstance';
import { tokenStorage } from '@core/auth/tokenStorage';
import { generateCorrelationId } from './correlationId';
import { AppError } from '@core/types/api.types';
import type { ApiResponse } from '@core/types/api.types';

let onUnauthorized: (() => void) | null = null;

/**
 * Register a callback to execute on 401 responses (e.g., clear auth store and redirect).
 * Called from main.tsx after store is initialized.
 */
export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

// ── Request interceptor ──────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    config.headers.set('X-Correlation-ID', generateCorrelationId());
    config.headers.set('X-Request-Time', new Date().toISOString());
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ── Response interceptor ─────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data;
    const correlationId = error.response?.headers['x-correlation-id'] as string | undefined;

    if (status === 401) {
      tokenStorage.clear();
      onUnauthorized?.();
      return Promise.reject(new AppError(401, 'Session expired. Please log in again.', [], correlationId));
    }

    if (status === 403) {
      notification.error({
        message: 'Access Denied',
        description: 'You do not have permission to perform this action.',
        duration: 5,
      });
      return Promise.reject(new AppError(403, 'Forbidden', [], correlationId));
    }

    if (status === 400) {
      const message = data?.message ?? 'Validation failed';
      const fieldErrors = data?.errors ?? [];
      return Promise.reject(new AppError(400, message, fieldErrors, correlationId));
    }

    if (status >= 500) {
      notification.error({
        message: 'Service Unavailable',
        description: 'An unexpected server error occurred. Please try again later.',
        duration: 5,
      });
      return Promise.reject(new AppError(status, data?.message ?? 'Internal server error', [], correlationId));
    }

    // Network / timeout
    if (!error.response) {
      notification.error({
        message: 'Network Error',
        description: 'Unable to reach the server. Check your connection.',
        duration: 5,
      });
      return Promise.reject(new AppError(0, 'Network error', []));
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
