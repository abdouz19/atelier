'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import type { EmployeeDetail, PaymentRecord } from '@/features/employees/employees.types';

const schema = z.object({
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  paymentDate: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface EditPaymentModalProps {
  payment: PaymentRecord;
  onClose: () => void;
  onSuccess: (detail: EmployeeDetail) => void;
}

export function EditPaymentModal({ payment, onClose, onSuccess }: EditPaymentModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: payment.amount,
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      notes: payment.notes ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const res = await ipcClient.employees.updatePayment({
      id: payment.id,
      amount: values.amount,
      paymentDate: new Date(values.paymentDate).getTime(),
      notes: values.notes || null,
    });
    if (res.success) { onSuccess(res.data); } else { setSubmitError(res.error); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">تعديل الدفعة</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">المبلغ *</label>
            <input type="number" step="any" {...register('amount')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">التاريخ *</label>
            <input type="date" {...register('paymentDate')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
            {errors.paymentDate && <p className="mt-1 text-xs text-red-500">{errors.paymentDate.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ملاحظات</label>
            <input {...register('notes')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
          </div>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
