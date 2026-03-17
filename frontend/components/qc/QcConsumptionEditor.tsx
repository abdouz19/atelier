'use client';

import { X, Plus } from 'lucide-react';
import type { ConsumptionEntryInput } from '@/features/qc/qc.types';

export interface NonFabricStockItem {
  id: string;
  name: string;
  totalAvailable: number;
  colors: { color: string; available: number }[];
}

interface QcConsumptionEditorProps {
  rows: ConsumptionEntryInput[];
  onChange: (rows: ConsumptionEntryInput[]) => void;
  items: NonFabricStockItem[];
}

export function QcConsumptionEditor({ rows, onChange, items }: QcConsumptionEditorProps) {
  function addRow() { onChange([...rows, { stockItemId: '', color: undefined, quantity: 0 }]); }
  function removeRow(i: number) { onChange(rows.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<ConsumptionEntryInput>) {
    onChange(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  return (
    <div dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">مواد مستهلكة (اختياري)</span>
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <Plus size={13} />إضافة مادة
        </button>
      </div>
      {rows.map((row, i) => {
        const item = items.find(it => it.id === row.stockItemId);
        const availForColor = row.color
          ? item?.colors.find(c => c.color === row.color)?.available ?? 0
          : item?.totalAvailable ?? 0;
        return (
          <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
            <select
              value={row.stockItemId}
              onChange={(e) => update(i, { stockItemId: e.target.value, color: undefined })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
            >
              <option value="">اختر المادة</option>
              {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
            {item && item.colors.length > 0 && (
              <select
                value={row.color ?? ''}
                onChange={(e) => update(i, { color: e.target.value || undefined })}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
              >
                <option value="">اللون</option>
                {item.colors.map(c => <option key={c.color} value={c.color}>{c.color} ({c.available})</option>)}
              </select>
            )}
            <input
              type="number"
              min={0.01}
              step="any"
              value={row.quantity || ''}
              onChange={(e) => update(i, { quantity: Number(e.target.value) })}
              placeholder={`الكمية (متاح: ${availForColor})`}
              className="w-32 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
            />
            <button type="button" onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
