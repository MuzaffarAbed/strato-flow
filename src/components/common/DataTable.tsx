import { useCallback, useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  minWidth?: number;
  wrap?: boolean;
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
  resizableColumns?: boolean;
}

function parseWidthPx(width?: string, fallback = 140): number {
  if (!width) return fallback;
  const match = width.trim().match(/^(\d+(?:\.\d+)?)px$/i);
  if (match) return Number(match[1]);
  const asNumber = Number.parseFloat(width);
  return Number.isFinite(asNumber) ? asNumber : fallback;
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
  resizableColumns = false,
}: DataTableProps<T>) {
  const totalPages = pageSize && totalCount != null ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const showPager = page != null && pageSize != null && totalCount != null && onPageChange;

  const columnSignature = useMemo(
    () => columns.map((column) => `${column.key}:${column.width ?? ''}`).join('|'),
    [columns],
  );

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    setColumnWidths((previous) => {
      const next: Record<string, number> = {};
      columns.forEach((column) => {
        next[column.key] = previous[column.key] ?? parseWidthPx(column.width);
      });
      return next;
    });
  }, [columnSignature, columns]);

  const tableMinWidth = useMemo(
    () => columns.reduce((sum, column) => sum + (columnWidths[column.key] ?? parseWidthPx(column.width)), 0),
    [columns, columnWidths],
  );

  const handleResizeStart = useCallback((column: DataTableColumn<T>, event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = columnWidths[column.key] ?? parseWidthPx(column.width);
    const minWidth = column.minWidth ?? 72;

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      const nextWidth = Math.max(minWidth, startWidth + (moveEvent.clientX - startX));
      setColumnWidths((previous) => ({ ...previous, [column.key]: nextWidth }));
    };

    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [columnWidths]);

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
        <table
          className="w-full text-sm"
          style={resizableColumns ? { tableLayout: 'fixed', minWidth: `${tableMinWidth}px` } : undefined}
        >
          <thead>
            <tr className="border-b border-border bg-background/50 text-left text-gray-500">
              {columns.map((column) => {
                const width = columnWidths[column.key] ?? parseWidthPx(column.width);
                return (
                  <th
                    key={column.key}
                    className={`relative px-4 py-3 font-medium ${
                      column.wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap'
                    } ${
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                    } ${column.sortable ? 'cursor-pointer select-none hover:text-primary' : ''}`}
                    style={resizableColumns || column.width ? { width: `${width}px`, minWidth: `${column.minWidth ?? 72}px` } : undefined}
                    onClick={column.sortable && onSortChange ? () => onSortChange(column.key) : undefined}
                  >
                    <span className="inline-flex items-center pr-2">
                      {column.header}
                      {renderSortIcon(column)}
                    </span>
                    {resizableColumns && (
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${column.header} column`}
                        onMouseDown={(event) => handleResizeStart(column, event)}
                        onClick={(event) => event.stopPropagation()}
                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none"
                      >
                        <span className="absolute right-0 top-1/2 h-4 w-px -translate-y-1/2 bg-border group-hover:bg-primary" />
                      </span>
                    )}
                  </th>
                );
              })}
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
                {columns.map((column) => {
                  const width = columnWidths[column.key] ?? parseWidthPx(column.width);
                  return (
                    <td
                      key={column.key}
                      className={`px-4 py-3 align-top ${
                        column.wrap ? 'whitespace-normal break-words' : ''
                      } ${
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                      style={resizableColumns || column.width ? { width: `${width}px`, minWidth: `${column.minWidth ?? 72}px` } : undefined}
                    >
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '—')}
                    </td>
                  );
                })}
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
