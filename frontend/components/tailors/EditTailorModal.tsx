'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ipcClient } from '@/lib/ipc-client';
import { AppModal } from '@/components/shared/AppModal';
import { FormField } from '@/components/shared/FormField';
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
    <AppModal
      open
      onClose={onClose}
      title="تعديل الخياط"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="edit-tailor-form" disabled={isSubmitting} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </>
      }
    >
      <form id="edit-tailor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="الاسم" error={errors.name?.message} required>
          <input {...register('name')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <FormField label="رقم الهاتف">
          <input {...register('phone')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <FormField label="ملاحظات">
          <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        {submitError && <p className="text-xs text-red-500">{submitError}</p>}
      </form>
    </AppModal>
  );
}
