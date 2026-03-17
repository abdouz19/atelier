'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import { useLookups } from '@/hooks/useLookups';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">إضافة صنف جديد</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {serverError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">اسم الصنف <span className="text-red-500">*</span></label>
            <input {...register('name')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            {duplicateWarning && <p className="mt-1 text-xs text-amber-600">يوجد صنف آخر بنفس الاسم</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">النوع <span className="text-red-500">*</span></label>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">الوحدة <span className="text-red-500">*</span></label>
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">الكمية الابتدائية <span className="text-red-500">*</span></label>
              <input {...register('initialQuantity')} type="number" min="0" step="any" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
              {errors.initialQuantity && <p className="mt-1 text-xs text-red-600">{errors.initialQuantity.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">اللون (اختياري)</label>
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">المورد (اختياري)</label>
            <select {...register('supplierId')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500">
              <option value="">-- بدون مورد --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {supplierId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">سعر الوحدة <span className="text-red-500">*</span></label>
                <input
                  {...register('pricePerUnit')}
                  type="number" min="0" step="any"
                  onChange={(e) => { totalOverridden.current = false; register('pricePerUnit').onChange(e); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
                {errors.pricePerUnit && <p className="mt-1 text-xs text-red-600">{errors.pricePerUnit.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الإجمالي (دج)</label>
                <input
                  {...register('totalPricePaid')}
                  type="number" min="0" step="any"
                  onChange={(e) => { totalOverridden.current = true; register('totalPricePaid').onChange(e); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الصورة (اختيارية)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="w-full text-sm text-gray-500" />
            {imageData && <p className="mt-1 text-xs text-green-600">تم اختيار الصورة</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الوصف (اختياري)</label>
            <input {...register('description')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات (اختيارية)</label>
            <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
