'use client';

import { useState } from 'react';
import { Scissors } from 'lucide-react';
import type { PiecesAvailabilityRow } from '@/features/pieces/pieces.types';
import type { PiecesFilters, RowClassification } from '@/hooks/usePiecesAvailability';

interface PiecesAvailabilityTableProps {
  rows: PiecesAvailabilityRow[];
  allRows: PiecesAvailabilityRow[];
  filters: PiecesFilters;
  onFilterChange: (filters: PiecesFilters) => void;
  threshold: number;
  onThresholdChange: (value: number) => void;
  classify: (row: PiecesAvailabilityRow) => RowClassification;
  onRecut: (row: PiecesAvailabilityRow) => void;
}

function getUniqueValues(rows: PiecesAvailabilityRow[], key: keyof PiecesAvailabilityRow): string[] {
  return Array.from(new Set(rows.map(r => r[key] ?? '').filter(Boolean) as string[])).sort();
}

export function PiecesAvailabilityTable({
  rows, allRows, filters, onFilterChange, threshold, onThresholdChange, classify, onRecut,
}: PiecesAvailabilityTableProps) {
  const models = getUniqueValues(allRows, 'modelName');
  const parts = getUniqueValues(allRows, 'partName');
  const sizes = getUniqueValues(allRows, 'sizeLabel');
  const colors = getUniqueValues(allRows, 'color');

  const [pendingThreshold, setPendingThreshold] = useState(threshold);

  function handleThresholdSave() {
    if (pendingThreshold >= 0) onThresholdChange(pendingThreshold);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect label="النموذج" value={filters.modelName} options={models} onChange={v => onFilterChange({ ...filters, modelName: v })} />
        <FilterSelect label="القطعة" value={filters.partName} options={parts} onChange={v => onFilterChange({ ...filters, partName: v })} />
        <FilterSelect label="المقاس" value={filters.sizeLabel} options={sizes} onChange={v => onFilterChange({ ...filters, sizeLabel: v })} />
        <FilterSelect label="اللون" value={filters.color} options={colors} onChange={v => onFilterChange({ ...filters, color: v })} />
        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">حد المخزون المنخفض</label>
            <input
              type="number" min={0} value={pendingThreshold}
              onChange={e => setPendingThreshold(Number(e.target.value))}
              className="w-24 rounded-lg border border-border px-2 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button onClick={handleThresholdSave} className="rounded-lg bg-base px-3 py-2 text-sm font-medium text-text-base hover:bg-border">
            حفظ
          </button>
        </div>
        <button onClick={() => onFilterChange({ modelName: '', partName: '', sizeLabel: '', color: '' })} className="rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-base/60">
          مسح الفلاتر
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-text-muted">
          لا توجد نتائج
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-base/60">
              <tr>
                {['النموذج', 'القطعة', 'المقاس', 'اللون', 'المنتج', 'غير موزع', 'في التوزيع', 'مرتجع', ''].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-right font-semibold text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const cls = classify(row);
                const rowClass = cls === 'zero' ? 'bg-red-50' : cls === 'low' ? 'bg-amber-50' : '';
                return (
                  <tr key={idx} className={`border-t border-border ${rowClass}`}>
                    <td className="px-3 py-2">{row.modelName}</td>
                    <td className="px-3 py-2">{row.partName ?? '—'}</td>
                    <td className="px-3 py-2">{row.sizeLabel}</td>
                    <td className="px-3 py-2">{row.color}</td>
                    <td className="px-3 py-2">{row.totalProduced}</td>
                    <td className="px-3 py-2 font-medium">{row.notDistributed}</td>
                    <td className="px-3 py-2">{row.inDistribution}</td>
                    <td className="px-3 py-2">{row.returned}</td>
                    <td className="px-3 py-2">
                      {cls !== 'ok' && (
                        <button
                          onClick={() => onRecut(row)}
                          className="flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200"
                        >
                          <Scissors size={12} />
                          قطع مرة أخرى
                        </button>
                      )}
                    </td>
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

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-muted">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="rounded-lg border border-border px-2 py-2 text-sm focus:border-primary-500 focus:outline-none">
        <option value="">الكل</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

