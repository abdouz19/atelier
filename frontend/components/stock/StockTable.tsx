'use client';

import { useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
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
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
      dir="rtl"
    >
      {/* orange accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #fb923c, transparent)', opacity: 0.7 }} />

      {/* search + filter header */}
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--divider)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--cell-dim)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث باسم الصنف..."
            className="w-full rounded-lg border py-1.5 pr-8 pl-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}
            dir="rtl"
          />
        </div>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="appearance-none rounded-lg border py-1.5 pl-7 pr-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}
          >
            <option value="">جميع الأنواع</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--cell-dim)' }} />
        </div>
        {items.length > 0 && (
          <span className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}>
            {filtered.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          message="لا توجد أصناف مطابقة للبحث"
          subMessage="أضف صنفاً جديداً أو عدّل معايير البحث"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
              <tr>
                {['الاسم', 'النوع', 'الكمية', 'اللون', 'الصورة', 'الوصف', 'إجراءات'].map((h) => (
                  <th key={h} className="px-4 py-3 text-right" style={{ color: 'var(--cell-faint)', borderBottom: '1px solid var(--table-head-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
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
