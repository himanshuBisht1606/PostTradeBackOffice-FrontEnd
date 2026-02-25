import { Table } from 'antd';
import type { TableProps } from 'antd';
import { EmptyState } from '../feedback/EmptyState';

type DataTableProps<T extends object> = TableProps<T> & {
  emptyText?: string;
};

/**
 * Ant Design Table wrapper with consistent styling, empty state, and
 * striped rows for dense financial data grids.
 */
export function DataTable<T extends object>({ emptyText, ...props }: DataTableProps<T>) {
  return (
    <Table<T>
      size="small"
      bordered={false}
      locale={{ emptyText: <EmptyState description={emptyText ?? 'No data available'} /> }}
      rowClassName={(_, index) => (index % 2 === 0 ? 'table-row-even' : 'table-row-odd')}
      scroll={{ x: 'max-content' }}
      {...props}
    />
  );
}
