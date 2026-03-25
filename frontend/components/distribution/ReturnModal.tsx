'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ReturnConsumptionEditor, type ReturnConsumptionRowData } from './ReturnConsumptionEditor';
import { ipcClient } from '@/lib/ipc-client';
import type { DistributionBatchOption, DistributionTailorSummary, DistributionNonFabricItem } from '@/features/distribution/distribution.types';

interface ReturnModalProps {
  onClose: () => void;
  onSuccess: (summary: DistributionTailorSummary) => void;
}

export function ReturnModal({ onClose, onSuccess }: ReturnModalProps) {
  const [activeTailors, setActiveTailors] = useState<Array<{ id: string; name: string }>>([]);
  const [tailorId, setTailorId] = useState('');
  const [batches, setBatches] = useState<DistributionBatchOption[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<DistributionBatchOption | null>(null);
  const [quantityReturned, setQuantityReturned] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumptionRows, setConsumptionRows] = useState<ReturnConsumptionRowData[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<DistributionNonFabricItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ipcClient.distribution.getActiveTailors().then(res => { if (res.success) setActiveTailors(res.data); });
    ipcClient.cutting.getNonFabricItems().then(res => { if (res.success) setNonFabricItems(res.data as DistributionNonFabricItem[]); });
  }, []);

  useEffect(() => {
    if (!tailorId) { setBatches([]); setSelectedBatch(null); return; }
    ipcClient.distribution.getBatchesForTailor({ tailorId }).then(res => {
      if (res.success) setBatches(res.data);
    });
  }, [tailorId]);

  function selectBatch(b: DistributionBatchOption) {
    setSelectedBatch(b);
    setQuantityReturned(String(b.remainingQuantity));
    setConsumptionRows([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedBatch) { setError('يرجى اختيار الدفعة'); return; }
    const qty = Number(quantityReturned);
    if (qty < 1) { setError('الكمية يجب أن تكون أكبر من صفر'); return; }
    if (qty > selectedBatch.remainingQuantity) { setError(`الكمية (${qty}) تتجاوز المتبقي (${selectedBatch.remainingQuantity})`); return; }
    setSubmitting(true);
    try {
      const res = await ipcClient.distribution.return({
        batchId: selectedBatch.id, quantityReturned: qty,
        returnDate: new Date(returnDate).getTime(),
        consumptionRows: consumptionRows.filter(r => r.stockItemId && r.quantity > 0),
      });
      if (res.success) { onSuccess(res.data); } else { setError(res.error); }
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">ارتجاع قطع</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">الخياط *</label>
            <select value={tailorId} onChange={e => { setTailorId(e.target.value); setSelectedBatch(null); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
              <option value="">اختر الخياط</option>
              {activeTailors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {tailorId && batches.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-3">لا توجد دفعات مفتوحة لهذا الخياط</p>
          )}

          {batches.length > 0 && !selectedBatch && (
            <div>
              <label className="mb-2 block text-sm font-medium">اختر الدفعة *</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {batches.map(b => (
                  <button key={b.id} type="button" onClick={() => selectBatch(b)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-right text-sm hover:border-blue-400 hover:bg-blue-50">
                    <span className="font-medium">{b.modelName}</span>
                    {b.sizeLabel && <> — {b.sizeLabel}</>}
                    {b.color && <> — {b.color}</>}
                    {b.parts.length > 0 && <> — {b.parts.map(p => `${p.partName}×${p.quantity}`).join('، ')}</>}
                    {' '}— متبقي: {b.remainingQuantity} — {new Date(b.distributionDate).toLocaleDateString('en-GB')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedBatch && (
            <>
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm space-y-1">
                <div>
                  <button type="button" onClick={() => setSelectedBatch(null)} className="text-blue-500 hover:underline text-xs ml-2">تغيير</button>
                  <strong>{selectedBatch.modelName}</strong>
                  {selectedBatch.sizeLabel && <> — {selectedBatch.sizeLabel}</>}
                  {selectedBatch.color && <> — {selectedBatch.color}</>}
                  {' '}— متبقي: {selectedBatch.remainingQuantity}
                </div>
                {selectedBatch.parts.length > 0 && (
                  <div className="text-xs text-blue-600">
                    الأجزاء: {selectedBatch.parts.map(p => `${p.partName}: ${p.quantity}`).join('، ')}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">الكمية المرتجعة *</label>
                <input type="number" min={1} max={selectedBatch.remainingQuantity} value={quantityReturned} onChange={e => setQuantityReturned(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
              <ReturnConsumptionEditor rows={consumptionRows} onChange={setConsumptionRows} items={nonFabricItems} />
              <div>
                <label className="mb-1 block text-sm font-medium">التاريخ *</label>
                <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={submitting || !selectedBatch} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'جاري الحفظ...' : 'تسجيل الارتجاع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
