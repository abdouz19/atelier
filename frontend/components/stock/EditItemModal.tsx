'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ipcClient } from '@/lib/ipc-client';
import { AppModal } from '@/components/shared/AppModal';
import { FormField } from '@/components/shared/FormField';
import type { StockItemDetail } from '@/features/stock/stock.types';

const schema = z.object({
  name: z.string().min(1, 'اسم الصنف مطلوب'),
  type: z.string().min(1, 'النوع مطلوب'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  color: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  removeImage: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditItemModalProps {
  item: StockItemDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditItemModal({ item, onClose, onSuccess }: EditItemModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item.name,
      type: item.type,
      unit: item.unit,
      color: item.color ?? '',
      description: item.description ?? '',
      notes: item.notes ?? '',
      removeImage: false,
    },
  });

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
    const res = await ipcClient.stock.update({
      id: item.id,
      name: values.name,
      type: values.type,
      unit: values.unit,
      color: values.color || null,
      description: values.description || null,
      notes: values.notes || null,
      imageData: values.removeImage ? null : (imageData ?? undefined),
      imageMimeType: imageMimeType ?? undefined,
    });
    setSubmitting(false);
    if (res.success) onSuccess();
    else setServerError(res.error);
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="تعديل بيانات الصنف"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="edit-item-form" disabled={submitting} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </>
      }
    >
      {serverError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>}

      <form id="edit-item-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="اسم الصنف" error={errors.name?.message} required>
          <input {...register('name')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="النوع" error={errors.type?.message} required>
            <input {...register('type')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>
          <FormField label="الوحدة" error={errors.unit?.message} required>
            <input {...register('unit')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>
        </div>

        <FormField label="اللون (اختياري)">
          <input {...register('color')} placeholder="مثال: أبيض" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>

        <FormField label="الصورة">
          {item.imagePath && !imageData && (
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs text-text-muted">يوجد صورة حالية</span>
              <label className="flex items-center gap-1 text-xs text-red-600">
                <input type="checkbox" {...register('removeImage')} className="mr-1" />
                حذف الصورة
              </label>
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="w-full text-sm text-text-muted" />
          {imageData && <p className="mt-1 text-xs text-green-600">تم اختيار صورة جديدة</p>}
        </FormField>

        <FormField label="الوصف (اختياري)">
          <input {...register('description')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>

        <FormField label="ملاحظات (اختيارية)">
          <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
      </form>
    </AppModal>
  );
}
