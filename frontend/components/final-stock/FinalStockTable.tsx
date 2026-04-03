'use client';

import { ChevronDown } from 'lucide-react';
import type { FinalStockRow, FinalStockFilters } from '@/features/final-stock/final-stock.types';
import type { LookupEntry } from '@/features/lookups/lookups.types';

interface FinalStockTableProps {
  rows: FinalStockRow[];
  filters: FinalStockFilters;
  models: LookupEntry[];
  sizes: LookupEntry[];
  colors: LookupEntry[];
  onFilterChange: (filters: FinalStockFilters) => void;
  onRowClick: (row: FinalStockRow) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB');
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.08)',
  color: 'var(--cell-text)',
};

export function FinalStockTable({
  rows,
  filters,
  models,
  sizes,
  colors,
  onFilterChange,
  onRowClick,
}: FinalStockTableProps) {
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
      {/* emerald accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #34d399, transparent)', opacity: 0.7 }} />

      {/* filters header */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--divider)' }}>
        {[
          { value: filters.modelName, key: 'modelName', placeholder: 'جميع الموديلات', items: models },
          { value: filters.sizeLabel, key: 'sizeLabel', placeholder: 'جميع المقاسات', items: sizes },
          { value: filters.color, key: 'color', placeholder: 'جميع الألوان', items: colors },
        ].map(({ value, key, placeholder, items }) => (
          <div key={key} className="relative">
            <select
              value={value}
              onChange={(e) => onFilterChange({ ...filters, [key]: e.target.value })}
              className="appearance-none rounded-lg border py-1.5 pl-7 pr-3 text-sm outline-none transition-colors"
              style={selectStyle}
            >
              <option value="">{placeholder}</option>
              {items.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--cell-dim)' }} />
          </div>
        ))}
        <span className="mr-auto rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: 'var(--cell-dim)' }}>لا توجد نتائج</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
              <tr>
                {['الموديل', 'القطعة', 'المقاس', 'اللون', 'الكمية', 'تكلفة القطعة', 'آخر تحديث'].map((h) => (
                  <th key={h} className="px-4 py-3 text-right" style={{ color: 'var(--cell-faint)', borderBottom: '1px solid var(--table-head-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {rows.map((row, idx) => {
                const isZero = row.currentQuantity === 0;
                return (
                  <tr
                    key={idx}
                    onClick={() => onRowClick(row)}
                    className={`cursor-pointer transition-colors odd:bg-surface even:bg-base/30 row-hover ${isZero ? 'opacity-40' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--cell-text)' }}>{row.modelName}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--cell-muted)' }}>{row.partName ?? '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--cell-muted)' }}>{row.sizeLabel}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--cell-muted)' }}>{row.color}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
                        style={isZero
                          ? { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
                          : { background: 'rgba(16,185,129,0.12)', color: '#34d399' }
                        }
                      >
                        {row.currentQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums" style={{ color: row.finalCostPerPiece != null ? '#fbbf24' : 'var(--cell-dim)' }}>
                      {row.finalCostPerPiece != null ? `${row.finalCostPerPiece.toFixed(2)} دج` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums" style={{ color: 'var(--cell-dim)' }}>{formatDate(row.lastUpdatedDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
