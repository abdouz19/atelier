'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import type { DistributionNonFabricItem } from '@/features/distribution/distribution.types';
import type { LookupEntry } from '@/features/lookups/lookups.types';

export interface ReturnConsumptionRowData {
  stockItemId: string;
  color: string | null;
  quantity: number;
}

interface ReturnConsumptionEditorProps {
  rows: ReturnConsumptionRowData[];
  onChange: (rows: ReturnConsumptionRowData[]) => void;
  items: DistributionNonFabricItem[];
  error?: string;
}

export function ReturnConsumptionEditor({ rows, onChange, items, error }: ReturnConsumptionEditorProps) {
  const [colorItems, setColorItems] = useState<LookupEntry[]>([]);

  useEffect(() => {
    ipcClient.lookups.getColors().then(r => { if (r.success) setColorItems(r.data); });
  }, []);

  async function handleAddColor(name: string) {
    const res = await ipcClient.lookups.createColor({ name });
    if (res.success) {
      ipcClient.lookups.getColors().then(r => { if (r.success) setColorItems(r.data); });
    }
    return res;
  }

  function addRow() { onChange([...rows, { stockItemId: '', color: null, quantity: 0 }]); }
  function removeRow(i: number) { onChange(rows.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<ReturnConsumptionRowData>) {
    onChange(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  return (
    <div dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">مواد مستهلكة (اختياري)</span>
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
            <select value={row.stockItemId} onChange={(e) => update(i, { stockItemId: e.target.value, color: null })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none">
              <option value="">اختر المادة</option>
              {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
            {item && item.colors.length > 0 && (
              <div className="w-36">
                <ManagedDropdown
                  value={row.color ?? ''}
                  onChange={(v) => update(i, { color: v || null })}
                  items={colorItems.filter(c => item.colors.some(ic => ic.color === c.name))}
                  placeholder="اللون"
                  addLabel="إضافة لون"
                  onAddNew={handleAddColor}
                />
              </div>
            )}
            <input type="number" min={0.01} step="any" value={row.quantity || ''} onChange={(e) => update(i, { quantity: Number(e.target.value) })}
              placeholder={`الكمية (متاح: ${availForColor})`}
              className="w-36 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none" />
            <button type="button" onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
          </div>
        );
      })}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
