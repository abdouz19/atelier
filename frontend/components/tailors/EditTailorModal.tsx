'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import type { TailorSummary } from '@/features/tailors/tailors.types';

const schema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditTailorModalProps {
  tailor: TailorSummary;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTailorModal({ tailor, onClose, onSuccess }: EditTailorModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: tailor.name,
      phone: tailor.phone ?? '',
      notes: tailor.notes ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const res = await ipcClient.tailors.update({
      id: tailor.id,
      name: values.name,
      phone: values.phone || null,
      notes: values.notes || null,
    });
    if (res.success) { onSuccess(); } else { setSubmitError(res.error); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">تعديل الخياط</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">الاسم *</label>
            <input {...register('name')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">رقم الهاتف</label>
            <input {...register('phone')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ملاحظات</label>
            <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
