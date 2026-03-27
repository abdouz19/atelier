'use client';

import { useState } from 'react';
import type { PartsInventoryRow } from '@/features/cutting/cutting.types';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

interface PartsInventoryPanelProps {
  rows: PartsInventoryRow[];
  isLoading: boolean;
  error: string | null;
}

export function PartsInventoryPanel({ rows, isLoading, error }: PartsInventoryPanelProps) {
  const [filterModel, setFilterModel] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [filterColor, setFilterColor] = useState('');

  if (error) return <ErrorAlert message={error} />;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-white p-4" dir="rtl">
        <h2 className="mb-3 text-base font-semibold text-text-base">مخزون الأجزاء</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-base" />
          ))}
        </div>
      </div>
    );
  }

  // Derive unique filter options from rows
  const models = Array.from(new Set(rows.map((r) => r.modelName))).sort();
  const sizes = Array.from(new Set(rows.map((r) => r.sizeLabel).filter(Boolean))).sort();
  const colors = Array.from(new Set(rows.map((r) => r.color).filter(Boolean))).sort();

  const filtered = rows.filter((r) => {
    if (filterModel && r.modelName !== filterModel) return false;
    if (filterSize && r.sizeLabel !== filterSize) return false;
    if (filterColor && r.color !== filterColor) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, PartsInventoryRow[]>>((acc, row) => {
    const key = `${row.modelName}__${row.sizeLabel}__${row.color}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-border bg-white p-4" dir="rtl">
      <h2 className="mb-3 text-base font-semibold text-text-base">مخزون الأجزاء</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterModel}
          onChange={(e) => setFilterModel(e.target.value)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">كل الموديلات</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filterSize}
          onChange={(e) => setFilterSize(e.target.value)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">كل المقاسات</option>
          {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterColor}
          onChange={(e) => setFilterColor(e.target.value)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">كل الألوان</option>
          {colors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={rows.length === 0 ? 'لا توجد أجزاء متاحة' : 'لا توجد نتائج مطابقة'} />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([key, parts]) => {
            const [modelName, sizeLabel, color] = key.split('__');
            const label = [modelName, sizeLabel, color].filter(Boolean).join(' — ');
            return (
              <div key={key}>
                <p className="mb-2 text-sm font-medium text-text-muted">{label}</p>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-base/60 text-xs text-text-muted">
                      <tr>
                        <th className="px-3 py-2 text-right">اسم الجزء</th>
                        <th className="px-3 py-2 text-center">المنتج</th>
                        <th className="px-3 py-2 text-center">الموزع</th>
                        <th className="px-3 py-2 text-center">المتاح</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parts.map((p) => (
                        <tr
                          key={p.partName}
                          className={p.availableCount === 0 ? 'bg-red-50 text-red-700' : 'bg-white text-text-base'}
                        >
                          <td className="px-3 py-2 font-medium">{p.partName}</td>
                          <td className="px-3 py-2 text-center">{p.totalProduced}</td>
                          <td className="px-3 py-2 text-center">{p.totalDistributed}</td>
                          <td className="px-3 py-2 text-center font-semibold">{p.availableCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
