'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">إضافة عملية</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">نوع العملية</label>
            <select {...register('operationType')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
              {OPERATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">التاريخ</label>
            <input type="date" {...register('operationDate')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
            {errors.operationDate && <p className="mt-1 text-xs text-red-500">{errors.operationDate.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">الكمية</label>
              <input type="number" step="any" {...register('quantity')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">سعر الوحدة</label>
              <input type="number" step="any" {...register('pricePerUnit')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
              {errors.pricePerUnit && <p className="mt-1 text-xs text-red-500">{errors.pricePerUnit.message}</p>}
            </div>
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm">
            الإجمالي: <strong>{total.toLocaleString('en-US')} دج</strong>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">ملاحظات</label>
            <input {...register('notes')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          {submitError && <p className="text-xs text-red-500">{submitError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {isSubmitting ? 'جاري الحفظ...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
