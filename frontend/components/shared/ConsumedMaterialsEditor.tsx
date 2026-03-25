'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { ConsumptionRowItem, type LocalRow } from './ConsumptionRowItem';
import type { NonFabricItem, ConsumptionRow } from '@/features/cutting/cutting.types';

interface ConsumedMaterialsEditorProps {
  nonFabricItems: NonFabricItem[];
  value: ConsumptionRow[];
  onChange: (rows: ConsumptionRow[]) => void;
  disabled?: boolean;
}

function emitFiltered(rows: LocalRow[], onChange: (r: ConsumptionRow[]) => void) {
  onChange(rows.filter(r => r.stockItemId !== '') as ConsumptionRow[]);
}

export function ConsumedMaterialsEditor({
  nonFabricItems,
  value,
  onChange,
  disabled = false,
}: ConsumedMaterialsEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [rows, setRows] = useState<LocalRow[]>(value);

  function addRow() {
    setRows(prev => [...prev, { stockItemId: '', color: null, quantity: 0 }]);
  }

  function removeRow(i: number) {
    const updated = rows.filter((_, idx) => idx !== i);
    setRows(updated);
    emitFiltered(updated, onChange);
  }

  function updateRow(i: number, patch: Partial<LocalRow>) {
    const updated = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    setRows(updated);
    emitFiltered(updated, onChange);
  }

  const completedCount = rows.filter(r => r.stockItemId !== '').length;

  return (
    <div dir="rtl" className="mt-4 rounded-lg border border-gray-200">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <span>
          مواد مستهلكة
          {completedCount > 0 && (
            <span className="mr-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              {completedCount}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-4 pb-3 pt-3">
          {rows.map((row, i) => (
            <ConsumptionRowItem
              key={i}
              row={row}
              nonFabricItems={nonFabricItems}
              disabled={disabled}
              onUpdate={patch => updateRow(i, patch)}
              onRemove={() => removeRow(i)}
            />
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={addRow}
            className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
          >
            <Plus size={13} />
            إضافة مادة مستهلكة
          </button>
        </div>
      )}
    </div>
  );
}
