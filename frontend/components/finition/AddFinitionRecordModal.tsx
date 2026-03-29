'use client';

import { useState, useEffect } from 'react';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
import { AppModal } from '@/components/shared/AppModal';
import { AddToStockModal } from './AddToStockModal';
import { ipcClient } from '@/lib/ipc-client';
import type { QcRecordForFinition, AddToFinalStockPayload } from '@/features/finition/finition.types';
import type { NonFabricItem, ConsumptionRow } from '@/features/cutting/cutting.types';

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
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);

  const [selectedQc, setSelectedQc] = useState<QcRecordForFinition | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');
  const [finitionDate, setFinitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
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
      if (res.success) setNonFabricItems(res.data);
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
        consumptionEntries: consumptionRows.map(r => ({ stockItemId: r.stockItemId, color: r.color ?? undefined, quantity: r.quantity })),
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
      <AppModal
        open
        onClose={onClose}
        title="إضافة سجل تشطيب"
        size="sm"
      >
        <div className="text-center py-4">
          <p className="text-base font-semibold text-text-base mb-6">هل المنتج جاهز للمخزون النهائي؟</p>
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
              className="rounded-lg border border-border px-5 py-2 text-sm text-text-base hover:bg-base"
            >
              لا (خطوات إضافية)
            </button>
          </div>
        </div>
      </AppModal>
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
    <AppModal
      open
      onClose={onClose}
      title="إضافة سجل تشطيب"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="add-finition-form" disabled={submitting || !selectedQc}
            className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </>
      }
    >
      <form id="add-finition-form" onSubmit={handleSubmit} className="space-y-4">
        {!selectedQc ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-text-base">اختر سجل المراقبة *</label>
            {qcRecords.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-3">لا توجد سجلات مراقبة بكميات قابلة للتشطيب</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {qcRecords.map(r => (
                  <button key={r.qcId} type="button" onClick={() => { setSelectedQc(r); setQuantity(String(r.finitionableRemaining)); }}
                    className="w-full rounded-lg border border-border px-3 py-2 text-right text-sm hover:border-primary-500 hover:bg-primary-500/10">
                    <span className="font-medium">{r.tailorName}</span> — {r.modelName} / {r.sizeLabel} / {r.color} — متاح: <strong>{r.finitionableRemaining}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-primary-500/20 px-3 py-2 text-sm text-text-base" style={{ background: 'rgba(96,165,250,0.08)' }}>
            <button type="button" onClick={() => setSelectedQc(null)} className="text-primary-500 hover:underline text-xs ml-2">تغيير</button>
            <strong>{selectedQc.tailorName}</strong> — {selectedQc.modelName} / {selectedQc.sizeLabel} / {selectedQc.color} — متاح: {selectedQc.finitionableRemaining}
          </div>
        )}

        {selectedQc && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">الموظف *</label>
              <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                <option value="">اختر الموظف</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">الكمية *</label>
              <input type="number" min={1} max={selectedQc.finitionableRemaining} value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">سعر القطعة (دج) *</label>
              <input type="number" min={0} step="any" value={pricePerPiece}
                onChange={e => setPricePerPiece(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>

            {Number(pricePerPiece) > 0 && qty > 0 && (
              <div className="text-sm text-text-muted">التكلفة الإجمالية: <strong className="text-text-base">{totalCost.toLocaleString('en-US')} دج</strong></div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">التاريخ *</label>
              <input type="date" value={finitionDate} onChange={e => setFinitionDate(e.target.value)}
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
