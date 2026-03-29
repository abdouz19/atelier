'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import type { PartRow } from '@/features/cutting/cutting.types';
import type { LookupEntry } from '@/features/lookups/lookups.types';

interface PartRowsEditorProps {
  rows: PartRow[];
  onChange: (rows: PartRow[]) => void;
  error?: string;
}

export function PartRowsEditor({ rows, onChange, error }: PartRowsEditorProps) {
  const [parts, setParts] = useState<LookupEntry[]>([]);
  const [sizes, setSizes] = useState<LookupEntry[]>([]);

  useEffect(() => {
    ipcClient.lookups.getParts().then(r => { if (r.success) setParts(r.data); });
    ipcClient.lookups.getSizes().then(r => { if (r.success) setSizes(r.data); });
  }, []);

  async function handleAddPart(name: string) {
    const res = await ipcClient.lookups.createPart({ name });
    if (res.success) ipcClient.lookups.getParts().then(r => { if (r.success) setParts(r.data); });
    return res;
  }

  async function handleAddSize(name: string) {
    const res = await ipcClient.lookups.createSize({ name });
    if (res.success) ipcClient.lookups.getSizes().then(r => { if (r.success) setSizes(r.data); });
    return res;
  }

  function addRow() { onChange([...rows, { partName: '', sizeLabel: '', count: 1 }]); }
  function removeRow(i: number) { onChange(rows.filter((_, idx) => idx !== i)); }
  function update(i: number, patch: Partial<PartRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div dir="rtl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">الأجزاء المنتجة</span>
        <button type="button" onClick={addRow} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
          <Plus size={13} />إضافة جزء
        </button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
          <div className="w-40">
            <ManagedDropdown
              value={row.partName}
              onChange={v => update(i, { partName: v })}
              items={parts}
              placeholder="الجزء"
              addLabel="إضافة جزء"
              onAddNew={handleAddPart}
            />
          </div>
          <div className="w-32">
            <ManagedDropdown
              value={row.sizeLabel}
              onChange={v => update(i, { sizeLabel: v })}
              items={sizes}
              placeholder="المقاس"
              addLabel="إضافة مقاس"
              onAddNew={handleAddSize}
            />
          </div>
          <input
            type="number"
            min={1}
            step={1}
            value={row.count || ''}
            onChange={e => update(i, { count: Math.max(1, parseInt(e.target.value, 10) || 0) })}
            placeholder="العدد"
            className="w-20 rounded-lg border border-border px-3 py-1.5 text-sm input-transition focus:border-primary-500 focus:outline-none"
          />
          <button type="button" onClick={() => removeRow(i)} className="text-text-muted hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-xs text-text-muted">أضف جزءاً واحداً على الأقل</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
