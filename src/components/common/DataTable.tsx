import type { ReactNode } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortDescending?: boolean;
  onSortChange?: (columnKey: string) => void;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage = 'No records found',
  onRowClick,
  sortBy,
  sortDescending = false,
  onSortChange,
  page,
  pageSize,
  totalCount,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const totalPages = pageSize && totalCount != null ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const showPager = page != null && pageSize != null && totalCount != null && onPageChange;

  const renderSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable || sortBy !== column.key) return null;
    return sortDescending ? <FiChevronDown className="inline ml-1" size={14} /> : <FiChevronUp className="inline ml-1" size={14} />;
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50 text-left text-gray-500">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-medium whitespace-nowrap ${
                    column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                  } ${column.sortable ? 'cursor-pointer select-none hover:text-primary' : ''}`}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={column.sortable && onSortChange ? () => onSortChange(column.key) : undefined}
                >
                  <span className="inline-flex items-center">
                    {column.header}
                    {renderSortIcon(column)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-border/70 ${
                  onRowClick ? 'cursor-pointer hover:bg-background/30' : ''
                } ${index % 2 === 1 ? 'bg-background/20' : ''}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPager && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border text-sm text-gray-500">
          <div>
            Showing {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
            {' - '}
            {Math.min(page * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-3">
            {onPageSizeChange && (
              <label className="flex items-center gap-2">
                Rows
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-background border border-border rounded-lg px-2 py-1 text-sm"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:border-primary"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="px-3 py-1 border border-border rounded-lg disabled:opacity-40 hover:border-primary"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
