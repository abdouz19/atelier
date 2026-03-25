'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">إضافة سجل مراقبة جودة</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Batch selection */}
          {!selectedBatch ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">اختر دفعة الإرجاع *</label>
              {batches.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-3">لا توجد دفعات بكميات غير مراجعة</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {batches.map(b => (
                    <button key={b.returnId} type="button" onClick={() => { setSelectedBatch(b); setQuantityReviewed(String(b.quantityAvailable)); }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-right text-sm hover:border-blue-400 hover:bg-blue-50">
                      <span className="font-medium">{b.tailorName}</span> — {b.modelName} / {b.sizeLabel} / {b.color} — متاح للمراجعة: <strong>{b.quantityAvailable}</strong>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-gray-800">
              <button type="button" onClick={() => setSelectedBatch(null)} className="text-blue-500 hover:underline text-xs ml-2">تغيير</button>
              <strong>{selectedBatch.tailorName}</strong> — {selectedBatch.modelName} / {selectedBatch.sizeLabel} / {selectedBatch.color} — متاح: {selectedBatch.quantityAvailable}
            </div>
          )}

          {selectedBatch && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الموظف المسؤول *</label>
                <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none">
                  <option value="">اختر الموظف</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الكمية المراجعة *</label>
                <input type="number" min={1} max={selectedBatch.quantityAvailable} value={quantityReviewed}
                  onChange={e => setQuantityReviewed(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
              </div>

              {reviewed > 0 && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-3">
                  <p className="text-xs font-medium text-gray-600">توزيع الفئات (معلق: <span className={pending < 0 ? 'text-red-600' : 'text-gray-800'}>{pending}</span>)</p>
                  {[
                    { label: 'تالف', value: qtyDamaged, set: setQtyDamaged, color: 'text-red-600' },
                    { label: 'مقبول', value: qtyAcceptable, set: setQtyAcceptable, color: 'text-yellow-600' },
                    { label: 'جيد', value: qtyGood, set: setQtyGood, color: 'text-blue-600' },
                    { label: 'جيد جداً', value: qtyVeryGood, set: setQtyVeryGood, color: 'text-green-600' },
                  ].map(({ label, value, set, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <label className={`w-20 text-sm font-medium ${color}`}>{label}</label>
                      <input type="number" min={0} max={reviewed} value={value}
                        onChange={e => set(e.target.value)}
                        className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">سعر القطعة (دج) *</label>
                <input type="number" min={0} step="any" value={pricePerPiece} onChange={e => setPricePerPiece(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
              </div>

              {Number(pricePerPiece) > 0 && reviewed > 0 && (
                <div className="text-sm text-gray-600">التكلفة الإجمالية: <strong className="text-gray-900">{totalCost.toLocaleString('en-US')} دج</strong></div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">التاريخ *</label>
                <input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
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
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={submitting || !selectedBatch}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'جاري الحفظ...' : 'حفظ السجل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
