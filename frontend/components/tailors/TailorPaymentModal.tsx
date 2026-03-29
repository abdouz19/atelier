'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ipcClient } from '@/lib/ipc-client';
import { AppModal } from '@/components/shared/AppModal';
import { FormField } from '@/components/shared/FormField';
import type { TailorDetail, TailorPaymentRecord } from '@/features/tailors/tailors.types';

const schema = z.object({
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  paymentDate: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface TailorPaymentModalProps {
  tailorId: string;
  payment?: TailorPaymentRecord | null;
  onClose: () => void;
  onSuccess: (detail: TailorDetail) => void;
}

export function TailorPaymentModal({ tailorId, payment, onClose, onSuccess }: TailorPaymentModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEdit = !!payment;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: payment ? String(payment.amount) : '',
      paymentDate: payment
        ? new Date(payment.paymentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes: payment?.notes ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const res = isEdit
      ? await ipcClient.tailors.updatePayment({
          id: payment!.id,
          amount: values.amount,
          paymentDate: new Date(values.paymentDate).getTime(),
          notes: values.notes || null,
        })
      : await ipcClient.tailors.addPayment({
          tailorId,
          amount: values.amount,
          paymentDate: new Date(values.paymentDate).getTime(),
          notes: values.notes || undefined,
        });
    if (res.success) { onSuccess(res.data); } else { setSubmitError(res.error); }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title={isEdit ? 'تعديل الدفعة' : 'تسجيل دفعة'}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="tailor-payment-form" disabled={isSubmitting} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {isSubmitting ? 'جاري الحفظ...' : isEdit ? 'حفظ' : 'تسجيل'}
          </button>
        </>
      }
    >
      <form id="tailor-payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="المبلغ" error={errors.amount?.message} required>
          <input type="number" step="any" {...register('amount')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <FormField label="التاريخ" error={errors.paymentDate?.message} required>
          <input type="date" {...register('paymentDate')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <FormField label="ملاحظات">
          <input {...register('notes')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        {submitError && <p className="text-xs text-red-500">{submitError}</p>}
      </form>
    </AppModal>
  );
}
