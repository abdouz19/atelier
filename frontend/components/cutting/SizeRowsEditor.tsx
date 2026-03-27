'use client';

import { X, Plus } from 'lucide-react';

export interface SizeRowData { sizeLabel: string; pieceCount: number }

interface SizeRowsEditorProps {
  rows: SizeRowData[];
  onChange: (rows: SizeRowData[]) => void;
  suggestions: string[];
  error?: string;
}

export function SizeRowsEditor({ rows, onChange, suggestions, error }: SizeRowsEditorProps) {
  function addRow() { onChange([...rows, { sizeLabel: '', pieceCount: 0 }]); }
  function removeRow(i: number) { onChange(rows.filter((_, idx) => idx !== i)); }
  function update(i: number, field: keyof SizeRowData, value: string | number) {
    onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  const total = rows.reduce((s, r) => s + (Number(r.pieceCount) || 0), 0);

  return (
    <div dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">المقاسات والقطع *</span>
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-primary-600 hover:underline"><Plus size={13} />إضافة مقاس</button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <input list={`sizes-${i}`} value={row.sizeLabel} onChange={(e) => update(i, 'sizeLabel', e.target.value)}
            placeholder="المقاس" className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" />
          <datalist id={`sizes-${i}`}>{suggestions.map(s => <option key={s} value={s} />)}</datalist>
          <input type="number" min={1} value={row.pieceCount || ''} onChange={(e) => update(i, 'pieceCount', Number(e.target.value))}
            placeholder="عدد القطع" className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none" />
          <button type="button" onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
        </div>
      ))}
      {total > 0 && <p className="mt-1 text-xs text-gray-500">الإجمالي: <strong>{total}</strong> قطعة</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
