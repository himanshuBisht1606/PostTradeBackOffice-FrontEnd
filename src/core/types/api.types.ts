/**
 * Mirrors the backend ApiResponse<T> contract exactly.
 * All API service functions unwrap this and return T directly.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[];
}

/**
 * Standard paginated list wrapper (for future pagination support).
 */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Normalized application error thrown by the response interceptor.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly fieldErrors: string[] = [],
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
