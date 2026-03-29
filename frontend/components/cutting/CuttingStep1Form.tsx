'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ipcClient } from '@/lib/ipc-client';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import type { FabricItem, FabricColorOption } from '@/features/cutting/cutting.types';
import type { EmployeeSummary } from '@/features/employees/employees.types';
import type { LookupEntry } from '@/features/lookups/lookups.types';

const schema = z.object({
  fabricItemId: z.string().min(1, 'اختر القماش'),
  fabricColor: z.string().min(1, 'اختر اللون'),
  modelName: z.string().min(1, 'الموديل مطلوب'),
  metersUsed: z.coerce.number().positive('يجب أن تكون الأمتار أكبر من صفر'),
  employeeIds: z.array(z.string()).min(1, 'اختر موظفاً واحداً على الأقل'),
  layers: z.coerce.number().int().positive('عدد الطبقات مطلوب'),
  pricePerLayer: z.coerce.number().positive('سعر الطبقة مطلوب'),
  sessionDate: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export interface Step1Values extends FormValues { availableMeters: number }

interface CuttingStep1FormProps { onNext: (values: Step1Values) => void; onClose: () => void }

export function CuttingStep1Form({ onNext, onClose }: CuttingStep1FormProps) {
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [fabricColors, setFabricColors] = useState<FabricColorOption[]>([]);
  const [managedColors, setManagedColors] = useState<LookupEntry[]>([]);
  const [models, setModels] = useState<LookupEntry[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: { sessionDate: new Date().toISOString().split('T')[0], employeeIds: [] } });
  const fabricId = watch('fabricItemId');
  const fabricColor = watch('fabricColor');
  const layers = watch('layers');
  const price = watch('pricePerLayer');
  const totalCost = (Number(layers) || 0) * (Number(price) || 0);
  const availableMeters = fabricColors.find(c => c.color === fabricColor)?.available ?? 0;

  // Intersection: managed colors that also have available stock for selected fabric
  const intersectedColors: LookupEntry[] = managedColors.filter(mc =>
    fabricColors.some(fc => fc.color === mc.name)
  );

  useEffect(() => {
    ipcClient.cutting.getFabrics().then(r => { if (r.success) setFabrics(r.data); });
    ipcClient.employees.getAll().then(r => { if (r.success) setEmployees(r.data.filter(e => e.status === 'active')); });
    ipcClient.lookups.getColors().then(r => { if (r.success) setManagedColors(r.data); });
    ipcClient.lookups.getModels().then(r => { if (r.success) setModels(r.data); });
  }, []);

  useEffect(() => {
    if (!fabricId) { setFabricColors([]); setValue('fabricColor', ''); return; }
    ipcClient.cutting.getFabricColors({ fabricItemId: fabricId }).then(r => {
      if (r.success) { setFabricColors(r.data); setValue('fabricColor', ''); }
    });
  }, [fabricId, setValue]);

  async function handleAddColor(name: string) {
    const res = await ipcClient.lookups.createColor({ name });
    if (res.success) {
      ipcClient.lookups.getColors().then(r => { if (r.success) setManagedColors(r.data); });
    }
    return res;
  }

  async function handleAddModel(name: string) {
    const res = await ipcClient.lookups.createModel({ name });
    if (res.success) {
      ipcClient.lookups.getModels().then(r => { if (r.success) setModels(r.data); });
    }
    return res;
  }

  function onSubmit(values: FormValues) {
    if (values.metersUsed > availableMeters) {
      setError('metersUsed', { message: 'الكمية المطلوبة تتجاوز المتاح' });
      return;
    }
    onNext({ ...values, availableMeters });
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
      <div>
        <label className="mb-1 block text-sm font-medium">الأمتار المستخدمة * {fabricColor && <span className="text-text-muted">(متاح: {availableMeters} م)</span>}</label>
        <input type="number" step="any" {...register('metersUsed')} className="w-full rounded-lg border border-border px-3 py-2 text-sm input-transition focus:border-primary-500 focus:outline-none" />
        {errors.metersUsed && <p className="mt-1 text-xs text-red-500">{errors.metersUsed.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">الموظفون *</label>
        <div className="max-h-28 overflow-y-auto rounded-lg border border-border p-2">
          {employees.map(e => (
            <label key={e.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input type="checkbox" value={e.id} {...register('employeeIds')} className="rounded" />{e.name}
            </label>
          ))}
        </div>
        {errors.employeeIds && <p className="mt-1 text-xs text-red-500">{errors.employeeIds.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">عدد الطبقات *</label>
          <input type="number" min={1} {...register('layers')} className="w-full rounded-lg border border-border px-3 py-2 text-sm input-transition focus:border-primary-500 focus:outline-none" />
          {errors.layers && <p className="mt-1 text-xs text-red-500">{errors.layers.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">سعر الطبقة *</label>
          <input type="number" step="any" {...register('pricePerLayer')} className="w-full rounded-lg border border-border px-3 py-2 text-sm input-transition focus:border-primary-500 focus:outline-none" />
          {errors.pricePerLayer && <p className="mt-1 text-xs text-red-500">{errors.pricePerLayer.message}</p>}
        </div>
      </div>
      {totalCost > 0 && (
        <div className="rounded-lg border px-3 py-2 text-sm" style={{ background: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.2)', color: '#94a3b8' }}>
          التكلفة لكل موظف: <strong style={{ color: '#60a5fa' }}>{totalCost.toLocaleString('en-US')} دج</strong>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">التاريخ *</label>
          <input type="date" {...register('sessionDate')} className="w-full rounded-lg border border-border px-3 py-2 text-sm input-transition focus:border-primary-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ملاحظات</label>
          <input {...register('notes')} className="w-full rounded-lg border border-border px-3 py-2 text-sm input-transition focus:border-primary-500 focus:outline-none" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-base/60">إلغاء</button>
        <button type="submit" className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">التالي ←</button>
      </div>
    </form>
  );
}
