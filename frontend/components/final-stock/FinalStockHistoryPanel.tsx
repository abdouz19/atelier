'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import type { FinalStockRow, FinalStockHistoryEntry } from '@/features/final-stock/final-stock.types';

interface FinalStockHistoryPanelProps {
  row: FinalStockRow;
  entries: FinalStockHistoryEntry[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ar-DZ');
}

function sourceTypeLabel(sourceType: string): string {
  return sourceType === 'finition' ? 'تشطيب' : 'خطوة مخصصة';
}

export function FinalStockHistoryPanel({
  row,
  entries,
  loading,
  error,
  onClose,
}: FinalStockHistoryPanelProps) {
  const router = useRouter();

  function handleEntryClick(entry: FinalStockHistoryEntry) {
    router.push(`/qc?id=${entry.sourceId}`);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-primary-200 bg-primary-50" dir="rtl">
      <div className="flex items-center justify-between border-b border-primary-200 bg-white px-4 py-3">
        <div className="text-sm font-medium text-text-base">
          {row.modelName}
          {row.partName ? <span className="mx-1 text-text-muted">·</span> : null}
          {row.partName ? <span className="text-text-muted">{row.partName}</span> : null}
          <span className="mx-1 text-text-muted">·</span>
          <span className="text-text-muted">{row.sizeLabel}</span>
          <span className="mx-1 text-text-muted">·</span>
          <span className="text-text-muted">{row.color}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-muted transition-colors hover:bg-base hover:text-text-muted"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4">
        {loading && (
          <p className="text-center text-sm text-text-muted">جاري التحميل...</p>
        )}
        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="text-center text-sm text-text-muted">لا توجد سجلات</p>
        )}
        {!loading && !error && entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-white px-4 py-3 text-right text-sm transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-block rounded bg-base px-2 py-0.5 text-xs font-medium text-text-muted">
                    {sourceTypeLabel(entry.sourceType)}
                  </span>
                  <span className="text-text-muted">{formatDate(entry.entryDate)}</span>
                </div>
                <span className="font-semibold text-green-700">+{entry.quantityAdded}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
