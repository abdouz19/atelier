'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ipcClient } from '@/lib/ipc-client';
import { useLookups } from '@/hooks/useLookups';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import { AppModal } from '@/components/shared/AppModal';
import { FormField } from '@/components/shared/FormField';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

const schema = z.object({
  name: z.string().min(1, 'اسم الصنف مطلوب'),
  type: z.string().min(1, 'النوع مطلوب'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  initialQuantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  color: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  supplierId: z.string().optional(),
  pricePerUnit: z.coerce.number().optional(),
  totalPricePaid: z.coerce.number().optional(),
}).superRefine((val, ctx) => {
  if (val.supplierId && !val.pricePerUnit) {
    ctx.addIssue({ code: 'custom', path: ['pricePerUnit'], message: 'السعر مطلوب عند اختيار مورد' });
  }
  if (val.pricePerUnit && val.pricePerUnit <= 0) {
    ctx.addIssue({ code: 'custom', path: ['pricePerUnit'], message: 'السعر يجب أن يكون أكبر من صفر' });
  }
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface AddItemModalProps {
  suppliers: SupplierSummary[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemModal({ suppliers, onClose, onSuccess }: AddItemModalProps) {
  const { types, colors, units, refetch: refetchLookups } = useLookups();
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const totalOverridden = useRef(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
  });

  const nameValue = watch('name');
  const supplierId = watch('supplierId');
  const initialQuantity = watch('initialQuantity');
  const pricePerUnit = watch('pricePerUnit');
  const typeValue = watch('type') ?? '';
  const colorValue = watch('color') ?? '';
  const unitValue = watch('unit') ?? '';

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (nameValue && nameValue.trim().length > 1) {
        const res = await ipcClient.stock.checkDuplicate({ name: nameValue.trim() });
        if (res.success) setDuplicateWarning(res.data);
      } else {
        setDuplicateWarning(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [nameValue]);

  useEffect(() => {
    if (totalOverridden.current) return;
    const q = Number(initialQuantity);
    const p = Number(pricePerUnit);
    if (q > 0 && p > 0) setValue('totalPricePaid', q * p as unknown as string);
  }, [initialQuantity, pricePerUnit, setValue]);

  useEffect(() => {
    if (!supplierId) {
      setValue('pricePerUnit', '' as unknown as undefined);
      setValue('totalPricePaid', '' as unknown as undefined);
      totalOverridden.current = false;
    }
  }, [supplierId, setValue]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { alert('صيغة الصورة غير مدعومة (jpg, png, webp فقط)'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('حجم الصورة يجب أن لا يتجاوز 5 ميغابايت'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImageData(result.split(',')[1]);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await ipcClient.stock.create({
      ...values,
      imageData: imageData ?? undefined,
      imageMimeType: imageMimeType ?? undefined,
      supplierId: values.supplierId || undefined,
      pricePerUnit: values.pricePerUnit || undefined,
      totalPricePaid: values.totalPricePaid || undefined,
    });
    setSubmitting(false);
    if (res.success) onSuccess();
    else setServerError(res.error);
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="إضافة صنف جديد"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="add-item-form" disabled={submitting} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري الإضافة...' : 'إضافة'}
          </button>
        </>
      }
    >
      {serverError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>}

      <form id="add-item-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="اسم الصنف" error={errors.name?.message} required>
          <input {...register('name')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          {duplicateWarning && <p className="mt-1 text-xs text-amber-600">يوجد صنف آخر بنفس الاسم</p>}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">النوع <span className="text-red-500">*</span></label>
            <ManagedDropdown
              value={typeValue}
              onChange={(v) => setValue('type', v, { shouldValidate: true })}
              items={types}
              placeholder="اختر النوع"
              addLabel="إضافة نوع"
              onAddNew={async (name) => { const r = await ipcClient.lookups.createType({ name }); if (r.success) refetchLookups(); return r; }}
              error={errors.type?.message}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">الوحدة <span className="text-red-500">*</span></label>
            <ManagedDropdown
              value={unitValue}
              onChange={(v) => setValue('unit', v, { shouldValidate: true })}
              items={units}
              placeholder="اختر الوحدة"
              addLabel="إضافة وحدة"
              onAddNew={async (name) => { const r = await ipcClient.lookups.createUnit({ name }); if (r.success) refetchLookups(); return r; }}
              error={errors.unit?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="الكمية الابتدائية" error={errors.initialQuantity?.message} required>
            <input {...register('initialQuantity')} type="number" min="0" step="any" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">اللون (اختياري)</label>
            <ManagedDropdown
              value={colorValue}
              onChange={(v) => setValue('color', v)}
              items={colors}
              placeholder="اختر اللون"
              addLabel="إضافة لون"
              onAddNew={async (name) => { const r = await ipcClient.lookups.createColor({ name }); if (r.success) refetchLookups(); return r; }}
            />
          </div>
        </div>

        <FormField label="المورد (اختياري)">
          <select {...register('supplierId')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
            <option value="">-- بدون مورد --</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>

        {supplierId && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="سعر الوحدة" error={errors.pricePerUnit?.message} required>
              <input
                {...register('pricePerUnit')}
                type="number" min="0" step="any"
                onChange={(e) => { totalOverridden.current = false; register('pricePerUnit').onChange(e); }}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </FormField>
            <FormField label="الإجمالي (دج)">
              <input
                {...register('totalPricePaid')}
                type="number" min="0" step="any"
                onChange={(e) => { totalOverridden.current = true; register('totalPricePaid').onChange(e); }}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </FormField>
          </div>
        )}

        <FormField label="الصورة (اختيارية)">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="w-full text-sm text-text-muted" />
          {imageData && <p className="mt-1 text-xs text-green-600">تم اختيار الصورة</p>}
        </FormField>

        <FormField label="الوصف (اختياري)">
          <input {...register('description')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>

        <FormField label="ملاحظات (اختيارية)">
          <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
      </form>
    </AppModal>
  );
}
