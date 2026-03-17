'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { QcConsumptionEditor, type NonFabricStockItem } from '@/components/qc/QcConsumptionEditor';
import { AddToStockModal } from './AddToStockModal';
import { ipcClient } from '@/lib/ipc-client';
import type { AddToFinalStockPayload } from '@/features/finition/finition.types';
import type { ConsumptionEntryInput } from '@/features/qc/qc.types';

interface ActiveEmployee { id: string; name: string }

interface AddStepModalProps {
  finitionId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  maxQuantity: number;
  onClose: () => void;
  onSuccess: () => void;
  onNotReady?: (newMaxQuantity: number) => void;
}

type Step =
  | { type: 'form' }
  | { type: 'ready_prompt'; stepId: string; quantity: number; stepDate: number }
  | { type: 'add_to_stock'; stepId: string; quantity: number; stepDate: number };

export function AddStepModal({ finitionId, modelName, sizeLabel, color, maxQuantity, onClose, onSuccess, onNotReady }: AddStepModalProps) {
  const [employees, setEmployees] = useState<ActiveEmployee[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricStockItem[]>([]);

  const [stepName, setStepName] = useState('');
  const [quantity, setQuantity] = useState(String(maxQuantity));
  const [employeeId, setEmployeeId] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');
  const [stepDate, setStepDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionEntryInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<Step>({ type: 'form' });

  useEffect(() => {
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
    if (!stepName.trim()) { setError('يرجى إدخال اسم الخطوة'); return; }
    if (qty < 1) { setError('الكمية يجب أن تكون أكبر من صفر'); return; }
    if (qty > maxQuantity) { setError(`الكمية (${qty}) تتجاوز الحد المسموح (${maxQuantity})`); return; }
    setSubmitting(true);
    try {
      const res = await ipcClient.finition.createStep({
        finitionId,
        stepName: stepName.trim(),
        quantity: qty,
        employeeId: employeeId || undefined,
        pricePerPiece: pricePerPiece ? Number(pricePerPiece) : undefined,
        stepDate: new Date(stepDate).getTime(),
        consumptionEntries: consumptionRows.filter(r => r.stockItemId && r.quantity > 0),
      });
      if (res.success) {
        setStep({ type: 'ready_prompt', stepId: res.data.id, quantity: qty, stepDate: new Date(stepDate).getTime() });
      } else { setError(res.error); }
    } finally { setSubmitting(false); }
  }

  async function handleAddToStock(payload: AddToFinalStockPayload) {
    const res = await ipcClient.finition.addToFinalStock(payload);
    if (res.success) { onSuccess(); }
    else { throw new Error(res.error); }
  }

  if (step.type === 'ready_prompt') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-center">
          <p className="text-base font-semibold text-gray-900 mb-6">هل المنتج جاهز للمخزون النهائي؟</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setStep({ type: 'add_to_stock', stepId: step.stepId, quantity: step.quantity, stepDate: step.stepDate })}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">
              نعم
            </button>
            <button onClick={() => { if (onNotReady) { onNotReady(step.quantity); } else { onSuccess(); } }}
              className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50">
              لا (خطوة أخرى)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step.type === 'add_to_stock') {
    return (
      <AddToStockModal
        sourceType="finition_step"
        sourceId={step.stepId}
        defaultModelName={modelName}
        defaultSizeLabel={sizeLabel}
        defaultColor={color}
        quantity={step.quantity}
        entryDate={step.stepDate}
        onConfirm={handleAddToStock}
        onCancel={() => setStep({ type: 'ready_prompt', stepId: step.stepId, quantity: step.quantity, stepDate: step.stepDate })}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">إضافة خطوة تشطيب</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">اسم الخطوة *</label>
            <input value={stepName} onChange={e => setStepName(e.target.value)} placeholder="مثال: كي، تغليف، تعبئة"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الكمية *</label>
            <input type="number" min={1} max={maxQuantity} value={quantity} onChange={e => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الموظف (اختياري)</label>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none">
              <option value="">اختر الموظف</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">سعر القطعة (دج) — اختياري</label>
            <input type="number" min={0} step="any" value={pricePerPiece} onChange={e => setPricePerPiece(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
          </div>

          {Number(pricePerPiece) > 0 && qty > 0 && (
            <div className="text-sm text-gray-600">التكلفة الإجمالية: <strong className="text-gray-900">{totalCost.toLocaleString('en-US')} دج</strong></div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">التاريخ *</label>
            <input type="date" value={stepDate} onChange={e => setStepDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none" />
          </div>

          <QcConsumptionEditor rows={consumptionRows} onChange={setConsumptionRows} items={nonFabricItems} />

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'جاري الحفظ...' : 'حفظ الخطوة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
