'use client';

import { useState, useEffect } from 'react';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
import { AppModal } from '@/components/shared/AppModal';
import { ipcClient } from '@/lib/ipc-client';
import type { ReturnBatchForQc } from '@/features/qc/qc.types';
import type { NonFabricItem, ConsumptionRow } from '@/features/cutting/cutting.types';

interface ActiveEmployee { id: string; name: string }

interface AddQcRecordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddQcRecordModal({ onClose, onSuccess }: AddQcRecordModalProps) {
  const [batches, setBatches] = useState<ReturnBatchForQc[]>([]);
  const [employees, setEmployees] = useState<ActiveEmployee[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);

  const [selectedBatch, setSelectedBatch] = useState<ReturnBatchForQc | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [quantityReviewed, setQuantityReviewed] = useState('');
  const [qtyDamaged, setQtyDamaged] = useState('0');
  const [qtyAcceptable, setQtyAcceptable] = useState('0');
  const [qtyGood, setQtyGood] = useState('0');
  const [qtyVeryGood, setQtyVeryGood] = useState('0');
  const [pricePerPiece, setPricePerPiece] = useState('');
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ipcClient.qc.getReturnBatchesForQc().then(res => { if (res.success) setBatches(res.data); });
    ipcClient.employees.getAll().then(res => {
      if (res.success) {
        const data = res.data as Array<{ id: string; name: string; status: string }>;
        setEmployees(data.filter(e => e.status === 'active'));
      }
    });
    ipcClient.cutting.getNonFabricItems().then(res => {
      if (res.success) setNonFabricItems(res.data);
    });
  }, []);

  const reviewed = Number(quantityReviewed) || 0;
  const gradeSum = (Number(qtyDamaged) || 0) + (Number(qtyAcceptable) || 0) + (Number(qtyGood) || 0) + (Number(qtyVeryGood) || 0);
  const pending = reviewed - gradeSum;
  const totalCost = reviewed * (Number(pricePerPiece) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedBatch) { setError('يرجى اختيار دفعة الإرجاع'); return; }
    if (!employeeId) { setError('يرجى اختيار الموظف'); return; }
    if (reviewed < 1) { setError('الكمية المراجعة يجب أن تكون أكبر من صفر'); return; }
    if (reviewed > selectedBatch.quantityAvailable) {
      setError(`الكمية المراجعة (${reviewed}) تتجاوز المتاح (${selectedBatch.quantityAvailable})`);
      return;
    }
    if (gradeSum > reviewed) {
      setError(`مجموع الفئات (${gradeSum}) يتجاوز الكمية المراجعة (${reviewed})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await ipcClient.qc.create({
        returnId: selectedBatch.returnId,
        employeeId,
        quantityReviewed: reviewed,
        qtyDamaged: Number(qtyDamaged) || 0,
        qtyAcceptable: Number(qtyAcceptable) || 0,
        qtyGood: Number(qtyGood) || 0,
        qtyVeryGood: Number(qtyVeryGood) || 0,
        pricePerPiece: Number(pricePerPiece) || 0,
        reviewDate: new Date(reviewDate).getTime(),
        consumptionEntries: consumptionRows.map(r => ({ stockItemId: r.stockItemId, color: r.color ?? undefined, quantity: r.quantity })),
      });
      if (res.success) { onSuccess(); }
      else { setError(res.error); }
    } finally { setSubmitting(false); }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="إضافة سجل مراقبة جودة"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="add-qc-form" disabled={submitting || !selectedBatch}
            className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري الحفظ...' : 'حفظ السجل'}
          </button>
        </>
      }
    >
      <form id="add-qc-form" onSubmit={handleSubmit} className="space-y-4">

        {/* Batch selection */}
        {!selectedBatch ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-text-base">اختر دفعة الإرجاع *</label>
            {batches.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-3">لا توجد دفعات بكميات غير مراجعة</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {batches.map(b => (
                  <button key={b.returnId} type="button" onClick={() => { setSelectedBatch(b); setQuantityReviewed(String(b.quantityAvailable)); }}
                    className="w-full rounded-lg border border-border px-3 py-2 text-right text-sm hover:border-primary-500 hover:bg-primary-500/10">
                    <span className="font-medium">{b.tailorName}</span> — {b.modelName} / {b.sizeLabel} / {b.color} — متاح للمراجعة: <strong>{b.quantityAvailable}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-primary-500/20 px-3 py-2 text-sm text-text-base" style={{ background: 'rgba(96,165,250,0.08)' }}>
            <button type="button" onClick={() => setSelectedBatch(null)} className="text-primary-500 hover:underline text-xs ml-2">تغيير</button>
            <strong>{selectedBatch.tailorName}</strong> — {selectedBatch.modelName} / {selectedBatch.sizeLabel} / {selectedBatch.color} — متاح: {selectedBatch.quantityAvailable}
          </div>
        )}

        {selectedBatch && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">الموظف المسؤول *</label>
              <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                <option value="">اختر الموظف</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">الكمية المراجعة *</label>
              <input type="number" min={1} max={selectedBatch.quantityAvailable} value={quantityReviewed}
                onChange={e => setQuantityReviewed(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>

            {reviewed > 0 && (
              <div className="rounded-lg border border-border bg-base p-3 space-y-3">
                <p className="text-xs font-medium text-text-muted">توزيع الفئات (معلق: <span className={pending < 0 ? 'text-red-400' : 'text-text-base'}>{pending}</span>)</p>
                {[
                  { label: 'تالف', value: qtyDamaged, set: setQtyDamaged, color: 'text-red-400' },
                  { label: 'مقبول', value: qtyAcceptable, set: setQtyAcceptable, color: 'text-amber-400' },
                  { label: 'جيد', value: qtyGood, set: setQtyGood, color: 'text-blue-400' },
                  { label: 'جيد جداً', value: qtyVeryGood, set: setQtyVeryGood, color: 'text-emerald-400' },
                ].map(({ label, value, set, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <label className={`w-20 text-sm font-medium ${color}`}>{label}</label>
                    <input type="number" min={0} max={reviewed} value={value}
                      onChange={e => set(e.target.value)}
                      className="w-28 rounded-lg border border-border px-3 py-1.5 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">سعر القطعة (دج) *</label>
              <input type="number" min={0} step="any" value={pricePerPiece} onChange={e => setPricePerPiece(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>

            {Number(pricePerPiece) > 0 && reviewed > 0 && (
              <div className="text-sm text-text-muted">التكلفة الإجمالية: <strong className="text-text-base">{totalCost.toLocaleString('en-US')} دج</strong></div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">التاريخ *</label>
              <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>

            <ConsumedMaterialsEditor
              nonFabricItems={nonFabricItems}
              value={consumptionRows}
              onChange={setConsumptionRows}
              disabled={submitting}
            />
          </>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </AppModal>
  );
}
