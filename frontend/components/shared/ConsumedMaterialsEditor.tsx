'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { ConsumptionRowItem, type LocalRow } from './ConsumptionRowItem';
import { MaterialBatchSubTable } from './MaterialBatchSubTable';
import type { NonFabricItem, ConsumptionRow, MaterialBatchEntry, MaterialBatchConsumption } from '@/features/cutting/cutting.types';

interface ConsumedMaterialsEditorProps {
  nonFabricItems: NonFabricItem[];
  value: ConsumptionRow[];
  onChange: (rows: ConsumptionRow[]) => void;
  onBatchChange?: (consumptions: MaterialBatchConsumption[]) => void;
  disabled?: boolean;
}

interface LocalBatchState {
  [rowIndex: number]: MaterialBatchEntry[];
}

function emitFiltered(rows: LocalRow[], onChange: (r: ConsumptionRow[]) => void) {
  onChange(rows.filter(r => r.stockItemId !== '') as ConsumptionRow[]);
}

function buildBatchConsumptions(rows: LocalRow[], batchState: LocalBatchState): MaterialBatchConsumption[] {
  return rows
    .map((row, idx) => ({
      stockItemId: row.stockItemId,
      color: row.color,
      batches: (batchState[idx] ?? []).filter(e => e.quantity > 0),
    }))
    .filter(c => c.stockItemId !== '' && c.batches.length > 0);
}

export function ConsumedMaterialsEditor({
  nonFabricItems,
  value,
  onChange,
  onBatchChange,
  disabled = false,
}: ConsumedMaterialsEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [rows, setRows] = useState<LocalRow[]>(value);
  const [batchState, setBatchState] = useState<LocalBatchState>({});

  function addRow() {
    setRows(prev => [...prev, { stockItemId: '', color: null, quantity: 0 }]);
  }

  function removeRow(i: number) {
    const updated = rows.filter((_, idx) => idx !== i);
    const updatedBatches = Object.fromEntries(
      Object.entries(batchState)
        .filter(([k]) => Number(k) !== i)
        .map(([k, v]) => [Number(k) > i ? Number(k) - 1 : Number(k), v])
    );
    setRows(updated);
    setBatchState(updatedBatches);
    emitFiltered(updated, onChange);
    onBatchChange?.(buildBatchConsumptions(updated, updatedBatches));
  }

  function updateRow(i: number, patch: Partial<LocalRow>) {
    const resetBatches = ('stockItemId' in patch || 'color' in patch)
      ? { ...batchState, [i]: [] }
      : batchState;
    const updated = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    setRows(updated);
    setBatchState(resetBatches);
    emitFiltered(updated, onChange);
    onBatchChange?.(buildBatchConsumptions(updated, resetBatches));
  }

  function updateBatchEntries(rowIndex: number, entries: MaterialBatchEntry[]) {
    const updatedBatches = { ...batchState, [rowIndex]: entries };
    setBatchState(updatedBatches);
    const batchTotal = entries.reduce((s, e) => s + (e.quantity || 0), 0);
    const updatedRows = rows.map((r, idx) =>
      idx === rowIndex ? { ...r, quantity: batchTotal } : r
    );
    setRows(updatedRows);
    emitFiltered(updatedRows, onChange);
    onBatchChange?.(buildBatchConsumptions(updatedRows, updatedBatches));
  }

  const completedCount = rows.filter(r => r.stockItemId !== '').length;

  return (
    <div dir="rtl" className="mt-4 rounded-lg border border-border">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-text-base hover:bg-base/60 disabled:opacity-50"
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
        <div className="border-t border-border px-4 pb-3 pt-3 space-y-3">
          {rows.map((row, i) => (
            <div key={i}>
              <ConsumptionRowItem
                row={row}
                nonFabricItems={nonFabricItems}
                disabled={disabled}
                onUpdate={patch => updateRow(i, patch)}
                onRemove={() => removeRow(i)}
              />
              {row.stockItemId && (
                <MaterialBatchSubTable
                  stockItemId={row.stockItemId}
                  color={row.color}
                  entries={batchState[i] ?? []}
                  onChange={entries => updateBatchEntries(i, entries)}
                  disabled={disabled}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={disabled}
            onClick={addRow}
            className="mt-1 flex items-center gap-1 text-xs text-primary-600 hover:underline disabled:opacity-50"
          >
            <Plus size={13} />
            إضافة مادة مستهلكة
          </button>
        </div>
      )}
    </div>
  );
}
