'use client';

import { useMaterialBatches } from '@/hooks/useMaterialBatches';
import type { MaterialBatch, MaterialBatchEntry } from '@/features/cutting/cutting.types';

interface MaterialBatchSubTableProps {
  stockItemId: string;
  color: string | null;
  entries: MaterialBatchEntry[];
  onChange: (entries: MaterialBatchEntry[]) => void;
  disabled?: boolean;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function MaterialBatchSubTable({ stockItemId, color, entries, onChange, disabled = false }: MaterialBatchSubTableProps) {
  const { batches, isLoading } = useMaterialBatches(stockItemId || null, color);

  if (isLoading) {
    return <div className="mt-1 h-6 animate-pulse rounded bg-base/60 w-full" />;
  }

  if (batches.length === 0) {
    return (
      <p className="mt-1 text-xs text-text-muted">لا توجد دفعات شراء متاحة لهذا الصنف</p>
    );
  }

  function getEntry(transactionId: string): MaterialBatchEntry | undefined {
    return entries.find(e => e.transactionId === transactionId);
  }

  function handleQtyChange(batch: MaterialBatch, rawValue: string) {
    const qty = rawValue === '' ? 0 : parseFloat(rawValue);
    const safeQty = isNaN(qty) ? 0 : qty;
    const existing = entries.find(e => e.transactionId === batch.transactionId);
    if (existing) {
      onChange(entries.map(e =>
        e.transactionId === batch.transactionId ? { ...e, quantity: safeQty } : e
      ));
    } else {
      onChange([...entries, {
        transactionId: batch.transactionId,
        quantity: safeQty,
        pricePerUnit: batch.pricePerUnit,
        availableQuantity: batch.availableQuantity,
      }]);
    }
  }

  return (
    <div className="mt-1 rounded border border-border overflow-hidden">
      <table className="w-full text-xs" dir="rtl">
        <thead>
          <tr className="border-b border-border bg-base/40 text-text-muted">
            <th className="px-2 py-1 text-right">تاريخ الشراء</th>
            <th className="px-2 py-1 text-right">السعر/وحدة</th>
            <th className="px-2 py-1 text-right">المتاح</th>
            <th className="px-2 py-1 text-right">الكمية</th>
          </tr>
        </thead>
        <tbody>
          {batches.map(batch => {
            const entry = getEntry(batch.transactionId);
            const qty = entry?.quantity ?? 0;
            const isExhausted = batch.availableQuantity <= 0;
            const isOverdraw = qty > batch.availableQuantity;
            return (
              <tr key={batch.transactionId} className={`border-b border-border last:border-0 ${isExhausted ? 'opacity-50' : ''}`}>
                <td className="px-2 py-1 text-text-muted">{formatDate(batch.transactionDate)}</td>
                <td className="px-2 py-1">{batch.pricePerUnit.toFixed(2)} دج</td>
                <td className="px-2 py-1 text-text-muted">{batch.availableQuantity.toFixed(2)} {batch.unit}</td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    disabled={disabled || isExhausted}
                    value={qty === 0 ? '' : qty}
                    onChange={e => handleQtyChange(batch, e.target.value)}
                    className={`w-20 rounded border px-1.5 py-0.5 text-xs focus:outline-none focus:border-primary-500 disabled:opacity-40 ${
                      isOverdraw ? 'border-red-500 bg-red-50 text-red-700' : 'border-border'
                    }`}
                    placeholder="0"
                  />
                  {isOverdraw && <span className="mr-1 text-red-500">!</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
