'use client';

import { X, Plus } from 'lucide-react';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import type { LookupEntry } from '@/features/lookups/lookups.types';

export interface PartSizeRowData { partName: string; sizeName: string; quantity: number }

interface PartSizeRowsEditorProps {
  rows: PartSizeRowData[];
  onChange: (rows: PartSizeRowData[]) => void;
  parts: LookupEntry[];
  sizes: LookupEntry[];
  onAddPart: (name: string) => Promise<{ success: boolean; error?: string; data?: LookupEntry }>;
  onAddSize: (name: string) => Promise<{ success: boolean; error?: string; data?: LookupEntry }>;
  error?: string;
}

export function PartSizeRowsEditor({ rows, onChange, parts, sizes, onAddPart, onAddSize, error }: PartSizeRowsEditorProps) {
  function addRow() { onChange([...rows, { partName: '', sizeName: '', quantity: 0 }]); }
  function removeRow(i: number) { onChange(rows.filter((_, idx) => idx !== i)); }
  function updateField(i: number, field: keyof PartSizeRowData, value: string | number) {
    onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  const total = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

  return (
    <div dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">القطع والمقاسات *</span>
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <Plus size={13} />إضافة صف
        </button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <div className="w-36">
            <ManagedDropdown
              value={row.partName}
              onChange={(v) => updateField(i, 'partName', v)}
              items={parts}
              placeholder="القطعة"
              addLabel="إضافة قطعة"
              onAddNew={onAddPart}
            />
          </div>
          <div className="w-28">
            <ManagedDropdown
              value={row.sizeName}
              onChange={(v) => updateField(i, 'sizeName', v)}
              items={sizes}
              placeholder="المقاس"
              addLabel="إضافة مقاس"
              onAddNew={onAddSize}
            />
          </div>
          <input
            type="number"
            min={1}
            value={row.quantity || ''}
            onChange={(e) => updateField(i, 'quantity', Number(e.target.value))}
            placeholder="الكمية"
            className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
          <button type="button" onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500">
            <X size={14} />
          </button>
        </div>
      ))}
      {total > 0 && <p className="mt-1 text-xs text-gray-500">الإجمالي: <strong>{total}</strong> قطعة</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
