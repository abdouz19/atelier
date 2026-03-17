'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { QcConsumptionEditor, type NonFabricStockItem } from '@/components/qc/QcConsumptionEditor';
import { AddToStockModal } from './AddToStockModal';
import { ipcClient } from '@/lib/ipc-client';
import type { QcRecordForFinition, AddToFinalStockPayload } from '@/features/finition/finition.types';
import type { ConsumptionEntryInput } from '@/features/qc/qc.types';

type FinitionConsumptionEntry = ConsumptionEntryInput;

interface ActiveEmployee { id: string; name: string }

export interface FinitionNotReadyInfo {
  finitionId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantity: number;
}

interface AddFinitionRecordModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onNotReady?: (info: FinitionNotReadyInfo) => void;
}

type Step =
  | { type: 'form' }
  | { type: 'ready_prompt'; finitionId: string; modelName: string; sizeLabel: string; color: string; quantity: number; finitionDate: number }
  | { type: 'add_to_stock'; finitionId: string; modelName: string; sizeLabel: string; color: string; quantity: number; finitionDate: number };

export function AddFinitionRecordModal({ onClose, onSuccess, onNotReady }: AddFinitionRecordModalProps) {
  const [qcRecords, setQcRecords] = useState<QcRecordForFinition[]>([]);
  const [employees, setEmployees] = useState<ActiveEmployee[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricStockItem[]>([]);

  const [selectedQc, setSelectedQc] = useState<QcRecordForFinition | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');
  const [finitionDate, setFinitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumptionRows, setConsumptionRows] = useState<FinitionConsumptionEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<Step>({ type: 'form' });

  useEffect(() => {
    ipcClient.finition.getQcRecordsForFinition().then(res => { if (res.success) setQcRecords(res.data); });
    ipcClient.employees.getAll().then(res => {
      if (res.success) {
        const data = res.data as Array<{ id: string; name: string; status: string }>;
        setEmployees(data.filter(e => e.status === 'active'));
      }
    });
    ipcClient.cutting.getNonFabricItems().then(res => {
      if (res.success) setNonFabricItems(res.data as NonFabricStockItem[]);
    });
  }, []);

  const qty = Number(quantity) || 0;
  const totalCost = qty * (Number(pricePerPiece) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedQc) { setError('يرجى اختيار سجل المراقبة'); return; }
    if (!employeeId) { setError('يرجى اختيار الموظف'); return; }
    if (qty < 1) { setError('الكمية يجب أن تكون أكبر من صفر'); return; }
    if (qty > selectedQc.finitionableRemaining) {
      setError(`الكمية (${qty}) تتجاوز المتاح للتشطيب (${selectedQc.finitionableRemaining})`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await ipcClient.finition.create({
        qcId: selectedQc.qcId,
        employeeId,
        quantity: qty,
        pricePerPiece: Number(pricePerPiece) || 0,
        finitionDate: new Date(finitionDate).getTime(),
        consumptionEntries: consumptionRows.filter(r => r.stockItemId && r.quantity > 0),
      });
      if (res.success) {
        setStep({
          type: 'ready_prompt',
          finitionId: res.data.id,
          modelName: selectedQc.modelName,
          sizeLabel: selectedQc.sizeLabel,
          color: selectedQc.color,
          quantity: qty,
          finitionDate: new Date(finitionDate).getTime(),
        });
      } else { setError(res.error); }
    } finally { setSubmitting(false); }
  }

  async function handleAddToStock(payload: AddToFinalStockPayload) {
    const res = await ipcClient.finition.addToFinalStock(payload);
    if (res.success) { onSuccess(); }
    else { throw new Error(res.error); }
  }

  // ready prompt step
  if (step.type === 'ready_prompt') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-center">
          <p className="text-base font-semibold text-gray-900 mb-6">هل المنتج جاهز للمخزون النهائي؟</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep({ type: 'add_to_stock', finitionId: step.finitionId, modelName: step.modelName, sizeLabel: step.sizeLabel, color: step.color, quantity: step.quantity, finitionDate: step.finitionDate })}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              نعم
            </button>
            <button
              onClick={() => {
                if (onNotReady) {
                  onNotReady({ finitionId: step.finitionId, modelName: step.modelName, sizeLabel: step.sizeLabel, color: step.color, quantity: step.quantity });
                } else {
                  onSuccess();
                }
              }}
              className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              لا (خطوات إضافية)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // add to stock step
  if (step.type === 'add_to_stock') {
    return (
      <AddToStockModal
        sourceType="finition"
        sourceId={step.finitionId}
        defaultModelName={step.modelName}
        defaultSizeLabel={step.sizeLabel}
        defaultColor={step.color}
        quantity={step.quantity}
        entryDate={step.finitionDate}
        onConfirm={handleAddToStock}
        onCancel={() => setStep({ type: 'ready_prompt', finitionId: step.finitionId, modelName: step.modelName, sizeLabel: step.sizeLabel, color: step.color, quantity: step.quantity, finitionDate: step.finitionDate })}
      />
    );
  }

  // main form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">إضافة سجل تشطيب</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedQc ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">اختر سجل المراقبة *</label>
              {qcRecords.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-3">لا توجد سجلات مراقبة بكميات قابلة للتشطيب</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {qcRecords.map(r => (
                    <button key={r.qcId} type="button" onClick={() => { setSelectedQc(r); setQuantity(String(r.finitionableRemaining)); }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-right text-sm hover:border-blue-400 hover:bg-blue-50">
                      <span className="font-medium">{r.tailorName}</span> — {r.modelName} / {r.sizeLabel} / {r.color} — متاح: <strong>{r.finitionableRemaining}</strong>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-gray-800">
              <button type="button" onClick={() => setSelectedQc(null)} className="text-blue-500 hover:underline text-xs ml-2">تغيير</button>
              <strong>{selectedQc.tailorName}</strong> — {selectedQc.modelName} / {selectedQc.sizeLabel} / {selectedQc.color} — متاح: {selectedQc.finitionableRemaining}
            </div>
          )}

          {selectedQc && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الموظف *</label>
                <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none">
                  <option value="">اختر الموظف</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الكمية *</label>
                <input type="number" min={1} max={selectedQc.finitionableRemaining} value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">سعر القطعة (دج) *</label>
                <input type="number" min={0} step="any" value={pricePerPiece}
                  onChange={e => setPricePerPiece(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
              </div>

              {Number(pricePerPiece) > 0 && qty > 0 && (
                <div className="text-sm text-gray-600">التكلفة الإجمالية: <strong className="text-gray-900">{totalCost.toLocaleString('en-US')} دج</strong></div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">التاريخ *</label>
                <input type="date" value={finitionDate} onChange={e => setFinitionDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
              </div>

              <QcConsumptionEditor rows={consumptionRows} onChange={setConsumptionRows} items={nonFabricItems} />
            </>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={submitting || !selectedQc}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
