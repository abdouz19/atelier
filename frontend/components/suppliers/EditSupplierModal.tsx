'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ipcClient } from '@/lib/ipc-client';
import { AppModal } from '@/components/shared/AppModal';
import { FormField } from '@/components/shared/FormField';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

const schema = z.object({
  name: z.string().min(1, 'اسم المورد مطلوب'),
  phone: z.string().optional(),
  address: z.string().optional(),
  productsSold: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditSupplierModalProps {
  supplier: SupplierSummary;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSupplierModal({ supplier, onClose, onSuccess }: EditSupplierModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: supplier.name,
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
      productsSold: supplier.productsSold ?? '',
      notes: supplier.notes ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await ipcClient.suppliers.update({
      id: supplier.id,
      name: values.name,
      phone: values.phone || null,
      address: values.address || null,
      productsSold: values.productsSold || null,
      notes: values.notes || null,
    });
    setSubmitting(false);
    if (res.success) onSuccess();
    else setServerError(res.error);
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="تعديل مورد"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="edit-supplier-form" disabled={submitting} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </>
      }
    >
      {serverError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>}

      <form id="edit-supplier-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="اسم المورد" error={errors.name?.message} required>
          <input {...register('name')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>

        <FormField label="رقم الهاتف (اختياري)">
          <input {...register('phone')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>

        <FormField label="العنوان (اختياري)">
          <input {...register('address')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>

        <FormField label="المنتجات (اختياري)">
          <input {...register('productsSold')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>

        <FormField label="ملاحظات (اختيارية)">
          <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
      </form>
    </AppModal>
  );
}
