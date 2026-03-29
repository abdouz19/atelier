'use client';

import { X } from 'lucide-react';
import type { NonFabricItem } from '@/features/cutting/cutting.types';

export interface LocalRow {
  stockItemId: string;
  color: string | null;
  quantity: number;
}

interface ConsumptionRowItemProps {
  row: LocalRow;
  nonFabricItems: NonFabricItem[];
  disabled: boolean;
  onUpdate: (patch: Partial<LocalRow>) => void;
  onRemove: () => void;
}

export function ConsumptionRowItem({ row, nonFabricItems, disabled, onUpdate, onRemove }: ConsumptionRowItemProps) {
  const item = nonFabricItems.find(it => it.id === row.stockItemId);
  const available = row.stockItemId
    ? row.color
      ? item?.colors.find(c => c.color === row.color)?.available ?? 0
      : item?.totalAvailable ?? 0
    : 0;
  const exceeded = row.stockItemId !== '' && row.quantity > 0 && row.quantity > available;

  return (
    <div className="mb-2 flex flex-wrap items-start gap-2">
      <select
        value={row.stockItemId}
        disabled={disabled}
        onChange={e => onUpdate({ stockItemId: e.target.value, color: null, quantity: 0 })}
        className="rounded-lg border border-border px-3 py-1.5 text-sm input-transition focus:border-primary-500 focus:outline-none"
      >
        <option value="">اختر المادة</option>
        {nonFabricItems.map(it => (
          <option key={it.id} value={it.id} disabled={it.totalAvailable === 0}>
            {it.name} ({it.totalAvailable} {it.unit})
          </option>
        ))}
      </select>

      {item && item.colors.length > 0 && (
        <select
          value={row.color ?? ''}
          disabled={disabled}
          onChange={e => onUpdate({ color: e.target.value || null, quantity: 0 })}
          className="rounded-lg border border-border px-3 py-1.5 text-sm input-transition focus:border-primary-500 focus:outline-none"
        >
          <option value="">اللون</option>
          {item.colors.map(c => (
            <option key={c.color} value={c.color} disabled={c.available === 0}>
              {c.color} ({c.available})
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-col">
        <input
          type="number"
          min={0.01}
          step="any"
          value={row.quantity || ''}
          disabled={disabled}
          onChange={e => onUpdate({ quantity: Number(e.target.value) })}
          placeholder={item ? `متاح: ${available}` : 'الكمية'}
          className={`input-transition w-32 rounded-lg border px-3 py-1.5 text-sm focus:outline-none ${
            exceeded ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary-500'
          }`}
        />
        {exceeded && (
          <span className="mt-0.5 text-xs text-red-500">يتجاوز المتاح ({available})</span>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="mt-1 text-text-muted hover:text-red-500 disabled:opacity-50"
      >
        <X size={14} />
      </button>
    </div>
  );
}
