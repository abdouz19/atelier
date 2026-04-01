'use client';

import type { FabricBatch, FabricBatchEntry } from '@/features/cutting/cutting.types';

interface BatchConsumptionTableProps {
  batches: FabricBatch[];
  isLoading: boolean;
  entries: FabricBatchEntry[];
  onChange: (entries: FabricBatchEntry[]) => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function BatchConsumptionTable({ batches, isLoading, entries, onChange }: BatchConsumptionTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-border p-3">
        {[1, 2].map(i => (
          <div key={i} className="h-8 animate-pulse rounded bg-base/60" />
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-lg border border-border px-4 py-3 text-center text-sm text-text-muted">
        لا توجد دفعات شراء متاحة
      </div>
    );
  }

  function getEntry(transactionId: string): FabricBatchEntry | undefined {
    return entries.find(e => e.transactionId === transactionId);
  }

  function handleQtyChange(batch: FabricBatch, rawValue: string) {
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
        pricePerUnit: batch.pricePerMeter,
        availableQuantity: batch.availableQuantity,
      }]);
    }
  }

  const totalMeters = entries.reduce((s, e) => s + (e.quantity || 0), 0);
  const fabricCost = entries.reduce((s, e) => s + (e.quantity || 0) * e.pricePerUnit, 0);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm" dir="rtl">
        <thead>
          <tr className="border-b border-border bg-base/40 text-xs text-text-muted">
            <th className="px-3 py-2 text-right">تاريخ الشراء</th>
            <th className="px-3 py-2 text-right">السعر/م</th>
            <th className="px-3 py-2 text-right">المتاح (م)</th>
            <th className="px-3 py-2 text-right">الكمية المأخوذة</th>
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
                <td className="px-3 py-2 text-text-muted">{formatDate(batch.transactionDate)}</td>
                <td className="px-3 py-2">{batch.pricePerMeter.toFixed(2)} دج</td>
                <td className="px-3 py-2">
                  {isExhausted
                    ? <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600">نفدت الكمية</span>
                    : <span className="text-text-muted">{batch.availableQuantity.toFixed(2)} م</span>
                  }
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    disabled={isExhausted}
                    value={qty === 0 ? '' : qty}
                    onChange={e => handleQtyChange(batch, e.target.value)}
                    className={`w-24 rounded border px-2 py-1 text-sm focus:outline-none focus:border-primary-500 input-transition disabled:opacity-40 ${
                      isOverdraw ? 'border-red-500 bg-red-50 text-red-700' : 'border-border'
                    }`}
                    placeholder="0"
                  />
                  {isOverdraw && (
                    <p className="mt-0.5 text-xs text-red-500">الكمية تتجاوز المتاح</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(totalMeters > 0 || fabricCost > 0) && (
        <div className="border-t border-border bg-base/40 px-3 py-2 text-sm" dir="rtl">
          <span className="text-text-muted">إجمالي الأمتار: </span>
          <strong>{totalMeters.toFixed(2)} م</strong>
          <span className="mx-3 text-text-muted">—</span>
          <span className="text-text-muted">تكلفة القماش: </span>
          <strong className="text-primary-600">{fabricCost.toFixed(2)} دج</strong>
        </div>
      )}
    </div>
  );
}
