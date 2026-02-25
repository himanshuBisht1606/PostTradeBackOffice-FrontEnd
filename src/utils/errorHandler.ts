import { AppError } from '@core/types/api.types';
import { notification } from 'antd';

/**
 * Unwrap an AppError into a human-readable message.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    if (error.fieldErrors.length > 0) {
      return error.fieldErrors.join('\n');
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}

/**
 * Show an Ant Design error notification from any error type.
 */
export function notifyError(error: unknown, title = 'Error'): void {
  const message = getErrorMessage(error);
  notification.error({ message: title, description: message, duration: 6 });
}

/**
 * Show a success notification.
 */
export function notifySuccess(message: string, description?: string): void {
  notification.success({ message, description, duration: 3 });
}

/**
 * Type guard for AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
