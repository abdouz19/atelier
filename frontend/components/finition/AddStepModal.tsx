'use client';

import { useState, useEffect } from 'react';
import { AppModal } from '@/components/shared/AppModal';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
import { AddToStockModal } from './AddToStockModal';
import { ipcClient } from '@/lib/ipc-client';
import type { AddToFinalStockPayload } from '@/features/finition/finition.types';
import type { NonFabricItem, ConsumptionRow, MaterialBatchConsumption } from '@/features/cutting/cutting.types';

interface ActiveEmployee { id: string; name: string }

interface AddStepModalProps {
  incomingCostPerPiece?: number | null;
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

export function AddStepModal({ finitionId, modelName, sizeLabel, color, maxQuantity, incomingCostPerPiece, onClose, onSuccess, onNotReady }: AddStepModalProps) {
  const [employees, setEmployees] = useState<ActiveEmployee[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);

  const [stepName, setStepName] = useState('');
  const [quantity, setQuantity] = useState(String(maxQuantity));
  const [employeeId, setEmployeeId] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');
  const [stepDate, setStepDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
  const [materialBatchConsumptions, setMaterialBatchConsumptions] = useState<MaterialBatchConsumption[]>([]);
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
      if (res.success) setNonFabricItems(res.data);
    });
  }, []);

  const qty = Number(quantity) || 0;
  const totalCost = qty * (Number(pricePerPiece) || 0);

  const materialsCost = materialBatchConsumptions.reduce((sum, mc) =>
    sum + mc.batches.reduce((s, b) => s + b.quantity * b.pricePerUnit, 0), 0);
  const materialsCostPerPiece = qty > 0 ? materialsCost / qty : 0;
  const costAfterStep = (incomingCostPerPiece ?? 0) + (Number(pricePerPiece) || 0) + materialsCostPerPiece;

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
        consumptionEntries: consumptionRows.filter(r => r.stockItemId && r.quantity > 0).map(r => ({ stockItemId: r.stockItemId, color: r.color ?? undefined, quantity: r.quantity })),
        materialBatchConsumptions,
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
      <AppModal
        open
        onClose={onClose}
        title="إضافة خطوة تشطيب"
        size="sm"
      >
        <div className="text-center py-4">
          <p className="text-base font-semibold text-text-base mb-6">هل المنتج جاهز للمخزون النهائي؟</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setStep({ type: 'add_to_stock', stepId: step.stepId, quantity: step.quantity, stepDate: step.stepDate })}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">
              نعم
            </button>
            <button onClick={() => { if (onNotReady) { onNotReady(step.quantity); } else { onSuccess(); } }}
              className="rounded-lg border border-border px-5 py-2 text-sm text-text-base hover:bg-base">
              لا (خطوة أخرى)
            </button>
          </div>
        </div>
      </AppModal>
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
    <AppModal
      open
      onClose={onClose}
      title="إضافة خطوة تشطيب"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="add-step-form" disabled={submitting}
            className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري الحفظ...' : 'حفظ الخطوة'}
          </button>
        </>
      }
    >
      <form id="add-step-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">اسم الخطوة *</label>
          <input value={stepName} onChange={e => setStepName(e.target.value)} placeholder="مثال: كي، تغليف، تعبئة"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">الكمية *</label>
          <input type="number" min={1} max={maxQuantity} value={quantity} onChange={e => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">الموظف (اختياري)</label>
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
            <option value="">اختر الموظف</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">سعر القطعة (دج) — اختياري</label>
          <input type="number" min={0} step="any" value={pricePerPiece} onChange={e => setPricePerPiece(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>

        {Number(pricePerPiece) > 0 && qty > 0 && (
          <div className="text-sm text-text-muted">التكلفة الإجمالية: <strong className="text-text-base">{totalCost.toLocaleString('en-US')} دج</strong></div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">التاريخ *</label>
          <input type="date" value={stepDate} onChange={e => setStepDate(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>

        <ConsumedMaterialsEditor
          nonFabricItems={nonFabricItems}
          value={consumptionRows}
          onChange={setConsumptionRows}
          onBatchChange={setMaterialBatchConsumptions}
          disabled={submitting}
        />

        {qty > 0 && (
          <div className="rounded-lg border px-3 py-2.5 text-sm space-y-1" style={{ borderColor: 'rgba(251,191,36,0.25)', background: 'rgba(251,191,36,0.06)' }}>
            <div className="flex justify-between text-xs" style={{ color: 'var(--cell-muted)' }}>
              <span>التكلفة الواردة للقطعة</span>
              <span>{(incomingCostPerPiece ?? 0).toFixed(2)} دج</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--cell-muted)' }}>
              <span>تكلفة هذه الخطوة للقطعة</span>
              <span>{(Number(pricePerPiece) || 0).toFixed(2)} دج</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--cell-muted)' }}>
              <span>تكلفة المواد للقطعة</span>
              <span>{materialsCostPerPiece.toFixed(2)} دج</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold" style={{ borderColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
              <span>التكلفة بعد هذه الخطوة</span>
              <span>{costAfterStep.toFixed(2)} دج</span>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </AppModal>
  );
}
