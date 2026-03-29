'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ipcClient } from '@/lib/ipc-client';
import { AppModal } from '@/components/shared/AppModal';
import { FormField } from '@/components/shared/FormField';
import type { EmployeeDetail, OperationType } from '@/features/employees/employees.types';

const OPERATION_TYPES: { value: OperationType; label: string }[] = [
  { value: 'cutting', label: 'قص' },
  { value: 'distribution', label: 'توزيع' },
  { value: 'qc', label: 'مراقبة الجودة' },
  { value: 'finition', label: 'تشطيب' },
  { value: 'custom', label: 'خطوة مخصصة' },
];

const schema = z.object({
  operationType: z.enum(['cutting', 'distribution', 'qc', 'finition', 'custom']),
  operationDate: z.string().min(1, 'التاريخ مطلوب'),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  pricePerUnit: z.coerce.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
  notes: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface AddOperationModalProps {
  employeeId: string;
  onClose: () => void;
  onSuccess: (detail: EmployeeDetail) => void;
}

export function AddOperationModal({ employeeId, onClose, onSuccess }: AddOperationModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      operationType: 'cutting',
      operationDate: new Date().toISOString().split('T')[0],
      quantity: undefined,
      pricePerUnit: undefined,
    },
  });

  const qty = watch('quantity') ?? 0;
  const price = watch('pricePerUnit') ?? 0;
  const total = (Number(qty) || 0) * (Number(price) || 0);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const res = await ipcClient.employees.addOperation({
      employeeId,
      operationType: values.operationType,
      operationDate: new Date(values.operationDate).getTime(),
      quantity: values.quantity,
      pricePerUnit: values.pricePerUnit,
      notes: values.notes || undefined,
    });
    if (res.success) { onSuccess(res.data); } else { setSubmitError(res.error); }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="إضافة عملية"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="add-operation-form" disabled={isSubmitting} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {isSubmitting ? 'جاري الحفظ...' : 'إضافة'}
          </button>
        </>
      }
    >
      <form id="add-operation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="نوع العملية">
          <select {...register('operationType')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
            {OPERATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FormField>
        <FormField label="التاريخ" error={errors.operationDate?.message}>
          <input type="date" {...register('operationDate')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="الكمية" error={errors.quantity?.message}>
            <input type="number" step="any" {...register('quantity')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>
          <FormField label="سعر الوحدة" error={errors.pricePerUnit?.message}>
            <input type="number" step="any" {...register('pricePerUnit')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>
        </div>
        <div className="rounded-lg bg-primary-50 px-3 py-2 text-sm">
          الإجمالي: <strong>{total.toLocaleString('en-US')} دج</strong>
        </div>
        <FormField label="ملاحظات">
          <input {...register('notes')} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </FormField>
        {submitError && <p className="text-xs text-red-500">{submitError}</p>}
      </form>
    </AppModal>
  );
}
