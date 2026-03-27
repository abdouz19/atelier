'use client';

import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { StockTableRow } from './StockTableRow';
import { EmptyState } from '@/components/shared/EmptyState';
import type { StockItemSummary } from '@/features/stock/stock.types';

interface StockTableProps {
  items: StockItemSummary[];
  types: string[];
  searchQuery: string;
  typeFilter: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onRowClick: (id: string) => void;
  onAddInbound: (item: StockItemSummary) => void;
  onArchive: (item: StockItemSummary) => void;
}

export function StockTable({
  items,
  types,
  searchQuery,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  onRowClick,
  onAddInbound,
  onArchive,
}: StockTableProps) {
  const filtered = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (typeFilter) {
      result = result.filter((i) => i.type === typeFilter);
    }
    return result;
  }, [items, searchQuery, typeFilter]);

  return (
    <div dir="rtl">
      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث باسم الصنف..."
            className="w-full rounded-lg border border-border py-2 pr-9 pl-3 text-sm text-text-base outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-text-base outline-none focus:border-primary-500"
        >
          <option value="">جميع الأنواع</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          message="لا توجد أصناف مطابقة للبحث"
          subMessage="أضف صنفاً جديداً أو عدّل معايير البحث"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-right">
            <thead className="sticky top-0 z-10 border-b border-border bg-base/60">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-text-muted">الاسم</th>
                <th className="px-4 py-3 text-sm font-semibold text-text-muted">النوع</th>
                <th className="px-4 py-3 text-sm font-semibold text-text-muted">الكمية</th>
                <th className="px-4 py-3 text-sm font-semibold text-text-muted">اللون</th>
                <th className="px-4 py-3 text-sm font-semibold text-text-muted">الصورة</th>
                <th className="px-4 py-3 text-sm font-semibold text-text-muted">الوصف</th>
                <th className="px-4 py-3 text-sm font-semibold text-text-muted">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <StockTableRow
                  key={item.id}
                  item={item}
                  onRowClick={onRowClick}
                  onAddInbound={onAddInbound}
                  onArchive={onArchive}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
