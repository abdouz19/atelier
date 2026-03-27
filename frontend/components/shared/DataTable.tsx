'use client';

import React from 'react';

export type ColumnAlign = 'right' | 'left' | 'center';

export interface Column<T> {
  key: string;
  header: string;
  align?: ColumnAlign;
  render: (row: T, index: number) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
  skeletonRows?: number;
}

function alignClass(align: ColumnAlign = 'right'): string {
  return align === 'left' ? 'text-left' : align === 'center' ? 'text-center' : 'text-right';
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowClick,
  emptyState,
  footer,
  isLoading,
  skeletonRows = 5,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-base/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-text-muted ${alignClass(col.align)}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-surface' : 'bg-base/30'}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-border" style={{ width: `${60 + Math.random() * 30}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (rows.length === 0 && emptyState) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex min-h-[200px] items-center justify-center p-8">
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-base/80 backdrop-blur-sm">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-text-muted ${alignClass(col.align)}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                className={`group transition-colors ${
                  index % 2 === 0 ? 'bg-surface' : 'bg-base/30'
                } ${onRowClick ? 'cursor-pointer hover:bg-primary-50' : 'hover:bg-base/60'}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-text-base ${alignClass(col.align)}`}
                  >
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t border-border bg-base/60">
                <td colSpan={columns.length} className="px-4 py-3 text-sm text-text-muted">
                  {footer}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
