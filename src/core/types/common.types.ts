import type { Dayjs } from 'dayjs';

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
}

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  field: string;
  order: SortOrder;
}

export interface DateRange {
  from: Dayjs | null;
  to: Dayjs | null;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export type RecordStatus = 'Active' | 'Inactive' | 'Deleted';
