'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">تعديل بيانات الصنف</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {serverError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">اسم الصنف <span className="text-red-500">*</span></label>
            <input {...register('name')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">النوع <span className="text-red-500">*</span></label>
              <input {...register('type')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
              {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">الوحدة <span className="text-red-500">*</span></label>
              <input {...register('unit')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
              {errors.unit && <p className="mt-1 text-xs text-red-600">{errors.unit.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">اللون (اختياري)</label>
            <input {...register('color')} placeholder="مثال: أبيض" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الصورة</label>
            {item.imagePath && !imageData && (
              <div className="mb-2 flex items-center gap-3">
                <span className="text-xs text-gray-500">يوجد صورة حالية</span>
                <label className="flex items-center gap-1 text-xs text-red-600">
                  <input type="checkbox" {...register('removeImage')} className="mr-1" />
                  حذف الصورة
                </label>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="w-full text-sm text-gray-500" />
            {imageData && <p className="mt-1 text-xs text-green-600">تم اختيار صورة جديدة</p>}
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
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
