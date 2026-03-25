'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import type { PartRow } from '@/features/cutting/cutting.types';
import type { PartEntry } from '@/features/lookups/lookups.types';

interface PartRowsEditorProps {
  rows: PartRow[];
  onChange: (rows: PartRow[]) => void;
  modelName: string;
  error?: string;
}

export function PartRowsEditor({ rows, onChange, modelName, error }: PartRowsEditorProps) {
  const [parts, setParts] = useState<PartEntry[]>([]);

  useEffect(() => {
    ipcClient.lookups.getParts().then((res) => {
      if (res.success) setParts(res.data);
    });
  }, []);

  function addRow() { onChange([...rows, { partName: '', count: 1 }]); }
  function removeRow(i: number) { onChange(rows.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<PartRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">الأجزاء المنتجة</span>
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <Plus size={13} />إضافة جزء
        </button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="mb-2 flex items-center gap-2">
          <select
            value={row.partName}
            onChange={(e) => update(i, { partName: e.target.value })}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">اختر الجزء</option>
            {parts.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <input
            type="number"
            min={1}
            step={1}
            value={row.count || ''}
            onChange={(e) => update(i, { count: Math.max(1, parseInt(e.target.value, 10) || 0) })}
            placeholder="العدد"
            className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
          <button type="button" onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500">
            <X size={14} />
          </button>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-xs text-gray-400">أضف جزءاً واحداً على الأقل</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
