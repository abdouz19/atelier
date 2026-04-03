'use client';

import { useState, useEffect } from 'react';
import { AppModal } from '@/components/shared/AppModal';
import { ipcClient } from '@/lib/ipc-client';
import type { DistributionBatchOption, DistributionTailorSummary } from '@/features/distribution/distribution.types';

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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ipcClient.distribution.getActiveTailors().then(res => { if (res.success) setActiveTailors(res.data); });
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
        consumptionRows: [],
      });
      if (res.success) { onSuccess(res.data); } else { setError(res.error); }
    } finally { setSubmitting(false); }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="ارتجاع قطع"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="return-modal-form" disabled={submitting || !selectedBatch} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري الحفظ...' : 'تسجيل الارتجاع'}
          </button>
        </>
      }
    >
      <form id="return-modal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">الخياط *</label>
          <select value={tailorId} onChange={e => { setTailorId(e.target.value); setSelectedBatch(null); }} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
            <option value="">اختر الخياط</option>
            {activeTailors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {tailorId && batches.length === 0 && (
          <p className="text-sm text-text-muted text-center py-3">لا توجد دفعات مفتوحة لهذا الخياط</p>
        )}

        {batches.length > 0 && !selectedBatch && (
          <div>
            <label className="mb-2 block text-sm font-medium text-text-base">اختر الدفعة *</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {batches.map(b => (
                <button key={b.id} type="button" onClick={() => selectBatch(b)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-right text-sm hover:border-primary-500 hover:bg-primary-500/10">
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
            <div className="rounded-lg border border-primary-500/20 px-3 py-2 text-sm space-y-1" style={{ background: 'rgba(96,165,250,0.08)' }}>
              <div>
                <button type="button" onClick={() => setSelectedBatch(null)} className="text-primary-500 hover:underline text-xs ml-2">تغيير</button>
                <strong>{selectedBatch.modelName}</strong>
                {selectedBatch.sizeLabel && <> — {selectedBatch.sizeLabel}</>}
                {selectedBatch.color && <> — {selectedBatch.color}</>}
                {' '}— متبقي: {selectedBatch.remainingQuantity}
              </div>
              {selectedBatch.parts.length > 0 && (
                <div className="text-xs text-primary-600">
                  الأجزاء: {selectedBatch.parts.map(p => `${p.partName}: ${p.quantity}`).join('، ')}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">الكمية المرتجعة *</label>
              <input type="number" min={1} max={selectedBatch.remainingQuantity} value={quantityReturned} onChange={e => setQuantityReturned(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">التاريخ *</label>
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </AppModal>
  );
}
