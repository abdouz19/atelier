'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

const schema = z.object({
  name: z.string().min(1, 'اسم المورد مطلوب'),
  phone: z.string().optional(),
  address: z.string().optional(),
  productsSold: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface NestedSupplierModalProps {
  onClose: () => void;
  onSuccess: (supplier: SupplierSummary) => void;
}

export function NestedSupplierModal({ onClose, onSuccess }: NestedSupplierModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await ipcClient.suppliers.create({
      name: values.name,
      phone: values.phone || undefined,
      address: values.address || undefined,
      productsSold: values.productsSold || undefined,
      notes: values.notes || undefined,
    });
    setSubmitting(false);
    if (res.success) onSuccess(res.data);
    else setServerError(res.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" dir="rtl">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-base">إضافة مورد جديد</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:text-text-muted"><X size={20} /></button>
        </div>

        {serverError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">اسم المورد <span className="text-red-500">*</span></label>
            <input {...register('name')} className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-base outline-none focus:border-primary-500" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">رقم الهاتف (اختياري)</label>
            <input {...register('phone')} className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-base outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">العنوان (اختياري)</label>
            <input {...register('address')} className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-base outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">المنتجات (اختياري)</label>
            <input {...register('productsSold')} className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-base outline-none focus:border-primary-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">ملاحظات (اختيارية)</label>
            <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-base outline-none focus:border-primary-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-base hover:bg-base/60">إلغاء</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
              {submitting ? 'جاري الإضافة...' : 'إضافة المورد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
