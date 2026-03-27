'use client';

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
  return new Date(ts).toLocaleDateString('ar-DZ');
}

export function FinalStockTable({
  rows,
  filters,
  models,
  sizes,
  colors,
  onFilterChange,
  onRowClick,
}: FinalStockTableProps) {
  const selectClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';

  return (
    <div dir="rtl">
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filters.modelName}
          onChange={(e) => onFilterChange({ ...filters, modelName: e.target.value })}
          className={selectClass}
        >
          <option value="">جميع الموديلات</option>
          {models.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <select
          value={filters.sizeLabel}
          onChange={(e) => onFilterChange({ ...filters, sizeLabel: e.target.value })}
          className={selectClass}
        >
          <option value="">جميع المقاسات</option>
          {sizes.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <select
          value={filters.color}
          onChange={(e) => onFilterChange({ ...filters, color: e.target.value })}
          className={selectClass}
        >
          <option value="">جميع الألوان</option>
          {colors.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">لا توجد نتائج</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-base/60 text-right text-xs text-text-muted font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium">الموديل</th>
                <th className="px-4 py-3 font-medium">القطعة</th>
                <th className="px-4 py-3 font-medium">المقاس</th>
                <th className="px-4 py-3 font-medium">اللون</th>
                <th className="px-4 py-3 font-medium text-center">الكمية</th>
                <th className="px-4 py-3 font-medium">آخر تحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, idx) => {
                const isZero = row.currentQuantity === 0;
                return (
                  <tr
                    key={idx}
                    onClick={() => onRowClick(row)}
                    className={`cursor-pointer transition-colors odd:bg-surface even:bg-base/30 hover:bg-primary-50 ${isZero ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{row.modelName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.partName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{row.sizeLabel}</td>
                    <td className="px-4 py-3 text-gray-600">{row.color}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isZero
                            ? 'bg-red-50 text-red-500'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {row.currentQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(row.lastUpdatedDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
