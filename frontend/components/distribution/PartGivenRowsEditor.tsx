'use client';

import { X, Plus } from 'lucide-react';
import type { AvailablePartWithCost, PartGivenRow } from '@/features/distribution/distribution.types';

interface PartGivenRowsEditorProps {
  availableParts: AvailablePartWithCost[];
  rows: PartGivenRow[];
  onChange: (rows: PartGivenRow[]) => void;
  error?: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function PartGivenRowsEditor({ availableParts, rows, onChange, error }: PartGivenRowsEditorProps) {
  const selectedParts = new Set(rows.map(r => r.partName).filter(Boolean));

  function addRow() {
    onChange([...rows, { partName: '', quantity: 1, avgUnitCost: 0, availableCount: 0 }]);
  }

  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, patch: Partial<PartGivenRow>) {
    onChange(rows.map((r, idx) => {
      if (idx !== i) return r;
      const updated = { ...r, ...patch };
      if (patch.partName !== undefined) {
        const part = availableParts.find(p => p.partName === patch.partName);
        updated.avgUnitCost = part?.avgUnitCost ?? 0;
        updated.availableCount = part?.availableCount ?? 0;
      }
      return updated;
    }));
  }

  const totalPiecesCost = round2(rows.reduce((s, r) => s + round2(r.quantity * r.avgUnitCost), 0));

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-base">الأجزاء المعطاة *</span>
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
          <Plus size={13} />إضافة جزء
        </button>
      </div>

      {rows.length === 0 && (
        <p className="text-xs text-text-muted">لا توجد أجزاء. اضغط على «إضافة جزء» للبدء.</p>
      )}

      {rows.map((row, i) => {
        const rowTotal = round2(row.quantity * row.avgUnitCost);
        const isOverLimit = row.partName !== '' && row.quantity > row.availableCount;
        const partOptions = availableParts.filter(p => p.partName === row.partName || !selectedParts.has(p.partName));

        return (
          <div key={i} className="rounded-lg border border-border p-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <select
                value={row.partName}
                onChange={e => updateRow(i, { partName: e.target.value })}
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">اختر الجزء</option>
                {partOptions.map(p => (
                  <option key={p.partName} value={p.partName}>
                    {p.partName} — متاح: {p.availableCount}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={row.availableCount || undefined}
                value={row.quantity || ''}
                onChange={e => updateRow(i, { quantity: Math.max(1, Number(e.target.value)) })}
                placeholder="الكمية"
                className={`w-24 rounded-lg border px-3 py-1.5 text-sm outline-none input-transition focus:ring-2 focus:ring-primary-500/20 ${isOverLimit ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary-500'}`}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="text-text-muted hover:text-red-500 disabled:opacity-30"
              >
                <X size={14} />
              </button>
            </div>

            {row.partName && (
              <div className="flex justify-between text-xs text-text-muted px-1">
                <span>متوسط التكلفة: {row.avgUnitCost.toFixed(2)} دج/قطعة</span>
                <span>الإجمالي: {rowTotal.toFixed(2)} دج</span>
              </div>
            )}

            {isOverLimit && (
              <p className="text-xs text-red-500 px-1">
                الكمية تتجاوز المتاح ({row.availableCount})
              </p>
            )}
          </div>
        );
      })}

      {rows.length > 0 && (
        <div className="flex justify-between text-sm font-medium border-t border-border pt-2">
          <span>إجمالي تكلفة الأجزاء</span>
          <span>{totalPiecesCost.toFixed(2)} دج</span>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
