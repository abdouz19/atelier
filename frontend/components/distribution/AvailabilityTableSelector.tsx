'use client';

import type { AvailabilityCombination } from '@/features/distribution/distribution.types';

interface AvailabilityTableSelectorProps {
  combinations: AvailabilityCombination[];
  selected: AvailabilityCombination | null;
  onSelect: (combo: AvailabilityCombination) => void;
}

export function AvailabilityTableSelector({ combinations, selected, onSelect }: AvailabilityTableSelectorProps) {
  if (combinations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-text-muted">
        لا توجد قطع متاحة لهذا النموذج
      </div>
    );
  }

  return (
    <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-base/60">
          <tr>
            <th className="px-3 py-2 text-right font-medium text-text-muted">القطعة</th>
            <th className="px-3 py-2 text-right font-medium text-text-muted">المقاس</th>
            <th className="px-3 py-2 text-right font-medium text-text-muted">اللون</th>
            <th className="px-3 py-2 text-right font-medium text-text-muted">المتاح</th>
          </tr>
        </thead>
        <tbody>
          {combinations.map((combo, idx) => {
            const isZero = combo.notDistributedCount === 0;
            const isSelected =
              selected?.sizeLabel === combo.sizeLabel &&
              selected?.color === combo.color &&
              selected?.partName === combo.partName;
            return (
              <tr
                key={idx}
                onClick={() => !isZero && onSelect(combo)}
                className={[
                  'border-t border-border transition-colors',
                  isZero ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-primary-50',
                  isSelected ? 'bg-primary-100 ring-1 ring-inset ring-primary-400' : '',
                ].join(' ')}
              >
                <td className="px-3 py-2">{combo.partName ?? '—'}</td>
                <td className="px-3 py-2">{combo.sizeLabel}</td>
                <td className="px-3 py-2">{combo.color}</td>
                <td className="px-3 py-2 font-medium">{combo.notDistributedCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
