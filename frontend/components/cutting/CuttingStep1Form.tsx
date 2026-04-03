'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ipcClient } from '@/lib/ipc-client';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import { BatchConsumptionTable } from './BatchConsumptionTable';
import { useFabricBatches } from '@/hooks/useFabricBatches';
import type { FabricItem, FabricColorOption, FabricBatchEntry } from '@/features/cutting/cutting.types';
import type { LookupEntry } from '@/features/lookups/lookups.types';

const schema = z.object({
  fabricItemId: z.string().min(1, 'اختر القماش'),
  fabricColor: z.string().min(1, 'اختر اللون'),
  modelName: z.string().min(1, 'الموديل مطلوب'),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export interface Step1Values extends FormValues {
  availableMeters: number;
  metersUsed: number;
  fabricBatchEntries: FabricBatchEntry[];
  fabricCost: number;
}

interface CuttingStep1FormProps {
  onNext: (values: Step1Values) => void;
  onClose: () => void;
}

export function CuttingStep1Form({ onNext, onClose }: CuttingStep1FormProps) {
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [fabricColors, setFabricColors] = useState<FabricColorOption[]>([]);
  const [managedColors, setManagedColors] = useState<LookupEntry[]>([]);
  const [models, setModels] = useState<LookupEntry[]>([]);
  const [fabricBatchEntries, setFabricBatchEntries] = useState<FabricBatchEntry[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  const fabricId = watch('fabricItemId');
  const fabricColor = watch('fabricColor');

  const { batches: fabricBatches, isLoading: batchesLoading } = useFabricBatches(
    fabricId || null,
    fabricColor || null,
  );

  const availableMeters = fabricColors.find(c => c.color === fabricColor)?.available ?? 0;

  const intersectedColors: LookupEntry[] = managedColors.filter(mc =>
    fabricColors.some(fc => fc.color === mc.name)
  );

  const fabricCost = useMemo(
    () => fabricBatchEntries.reduce((s, e) => s + (e.quantity || 0) * e.pricePerUnit, 0),
    [fabricBatchEntries],
  );

  const totalMeters = useMemo(
    () => fabricBatchEntries.reduce((s, e) => s + (e.quantity || 0), 0),
    [fabricBatchEntries],
  );

  useEffect(() => {
    ipcClient.cutting.getFabrics().then(r => { if (r.success) setFabrics(r.data); });
    ipcClient.lookups.getColors().then(r => { if (r.success) setManagedColors(r.data); });
    ipcClient.lookups.getModels().then(r => { if (r.success) setModels(r.data); });
  }, []);

  useEffect(() => {
    if (!fabricId) { setFabricColors([]); setValue('fabricColor', ''); return; }
    ipcClient.cutting.getFabricColors({ fabricItemId: fabricId }).then(r => {
      if (r.success) { setFabricColors(r.data); setValue('fabricColor', ''); }
    });
  }, [fabricId, setValue]);

  useEffect(() => {
    setFabricBatchEntries([]);
    setBatchError(null);
  }, [fabricId, fabricColor]);

  async function handleAddColor(name: string) {
    const res = await ipcClient.lookups.createColor({ name });
    if (res.success) ipcClient.lookups.getColors().then(r => { if (r.success) setManagedColors(r.data); });
    return res;
  }

  async function handleAddModel(name: string) {
    const res = await ipcClient.lookups.createModel({ name });
    if (res.success) ipcClient.lookups.getModels().then(r => { if (r.success) setModels(r.data); });
    return res;
  }

  function onSubmit(values: FormValues) {
    const activeBatchEntries = fabricBatchEntries.filter(e => e.quantity > 0);
    if (activeBatchEntries.length === 0) {
      setBatchError('اختر كمية من دفعة شراء واحدة على الأقل');
      return;
    }
    const overdraw = activeBatchEntries.find(e => e.quantity > e.availableQuantity);
    if (overdraw) {
      setBatchError('الكمية المدخلة في إحدى الدفعات تتجاوز الكمية المتاحة');
      return;
    }
    setBatchError(null);
    const metersUsed = activeBatchEntries.reduce((s, e) => s + e.quantity, 0);
    onNext({ ...values, availableMeters, metersUsed, fabricBatchEntries: activeBatchEntries, fabricCost });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" dir="rtl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">القماش *</label>
          <select {...register('fabricItemId')} className="w-full rounded-lg border border-border px-3 py-2 text-sm input-transition focus:border-primary-500 focus:outline-none">
            <option value="">اختر</option>
            {fabrics.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {errors.fabricItemId && <p className="mt-1 text-xs text-red-500">{errors.fabricItemId.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">اللون *</label>
          <ManagedDropdown
            value={fabricColor ?? ''}
            onChange={(v) => setValue('fabricColor', v, { shouldValidate: true })}
            items={intersectedColors}
            placeholder="اختر"
            addLabel="إضافة لون"
            onAddNew={handleAddColor}
            disabled={!fabricId}
            error={errors.fabricColor?.message}
          />
        </div>
      </div>

      {fabricId && fabricColor && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            دفعات الشراء المتاحة
            {availableMeters > 0 && <span className="text-text-muted text-xs mr-2">(إجمالي متاح: {availableMeters} م)</span>}
          </label>
          <BatchConsumptionTable
            batches={fabricBatches}
            isLoading={batchesLoading}
            entries={fabricBatchEntries}
            onChange={setFabricBatchEntries}
          />
          {fabricId && fabricColor && (
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-base/40 px-3 py-2 text-sm" dir="rtl">
              <span className="text-text-muted">إجمالي الأمتار:</span>
              <strong>{totalMeters.toFixed(2)} م</strong>
              <span className="text-text-muted">—</span>
              <span className="text-text-muted">تكلفة القماش:</span>
              <strong className="text-amber-600">{fabricCost.toFixed(2)} دج</strong>
            </div>
          )}
          {batchError && <p className="mt-1 text-xs text-red-500">{batchError}</p>}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">الموديل *</label>
        <ManagedDropdown
          value={watch('modelName') ?? ''}
          onChange={(v) => setValue('modelName', v, { shouldValidate: true })}
          items={models}
          placeholder="اختر الموديل"
          addLabel="إضافة موديل"
          onAddNew={handleAddModel}
          error={errors.modelName?.message}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-base/60">إلغاء</button>
        <button type="submit" className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">التالي ←</button>
      </div>
    </form>
  );
}
