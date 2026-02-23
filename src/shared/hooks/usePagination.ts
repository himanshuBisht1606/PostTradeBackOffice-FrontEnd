import { useState, useCallback } from 'react';
import type { PaginationParams } from '@core/types/common.types';

interface UsePaginationReturn {
  pagination: PaginationParams;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
  antdPaginationProps: {
    current: number;
    pageSize: number;
    onChange: (page: number, size: number) => void;
    showSizeChanger: boolean;
    showTotal: (total: number) => string;
    pageSizeOptions: string[];
  };
}

export function usePagination(defaultPageSize = 20): UsePaginationReturn {
  const [pagination, setPagination] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: defaultPageSize,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, pageNumber: page }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPagination({ pageNumber: 1, pageSize: size });
  }, []);

  const reset = useCallback(() => {
    setPagination({ pageNumber: 1, pageSize: defaultPageSize });
  }, [defaultPageSize]);

  const antdPaginationProps = {
    current: pagination.pageNumber,
    pageSize: pagination.pageSize,
    onChange: (page: number, size: number) => {
      setPagination({ pageNumber: page, pageSize: size });
    },
    showSizeChanger: true,
    showTotal: (total: number) => `Total ${total} records`,
    pageSizeOptions: ['10', '20', '50', '100'],
  };

  return { pagination, setPage, setPageSize, reset, antdPaginationProps };
}
