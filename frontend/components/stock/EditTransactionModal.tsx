'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import type { StockTransaction } from '@/features/stock/stock.types';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

const schema = z.object({
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  transactionDate: z.string().min(1, 'التاريخ مطلوب'),
  supplierId: z.string().optional(),
  pricePerUnit: z.coerce.number().optional(),
  totalPricePaid: z.coerce.number().optional(),
}).superRefine((val, ctx) => {
  if (val.supplierId && !val.pricePerUnit) {
    ctx.addIssue({ code: 'custom', path: ['pricePerUnit'], message: 'السعر مطلوب عند اختيار مورد' });
  }
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

interface EditTransactionModalProps {
  transaction: StockTransaction;
  suppliers: SupplierSummary[];
  onClose: () => void;
  onSuccess: () => void;
}

function toDateStr(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function EditTransactionModal({ transaction, suppliers, onClose, onSuccess }: EditTransactionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const totalOverridden = useRef(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: transaction.quantity,
      transactionDate: toDateStr(transaction.transactionDate),
      supplierId: transaction.supplierName ? '' : '', // will be resolved via supplier list
      pricePerUnit: transaction.pricePerUnit ?? undefined,
      totalPricePaid: transaction.totalPricePaid ?? undefined,
    },
  });

  const supplierId = watch('supplierId');
  const quantity = watch('quantity');
  const pricePerUnit = watch('pricePerUnit');

  // Auto-calculate total when quantity or pricePerUnit changes (unless manually overridden)
  useEffect(() => {
    if (totalOverridden.current) return;
    const q = Number(quantity);
    const p = Number(pricePerUnit);
    if (q > 0 && p > 0) {
      setValue('totalPricePaid', q * p as unknown as string);
    }
  }, [quantity, pricePerUnit, setValue]);

  // Clear price fields when supplier is deselected
  useEffect(() => {
    if (!supplierId) {
      setValue('pricePerUnit', '' as unknown as undefined);
      setValue('totalPricePaid', '' as unknown as undefined);
      totalOverridden.current = false;
    }
  }, [supplierId, setValue]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await ipcClient.stock.updateTransaction({
      id: transaction.id,
      quantity: values.quantity,
      transactionDate: new Date(values.transactionDate).getTime(),
      supplierId: values.supplierId || null,
      pricePerUnit: values.pricePerUnit || null,
      totalPricePaid: values.totalPricePaid || null,
    });
    setSubmitting(false);
    if (res.success) onSuccess();
    else setServerError(res.error);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">تعديل معاملة واردة</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {serverError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الكمية <span className="text-red-500">*</span></label>
            <input {...register('quantity')} type="number" min="0" step="any" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
            {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">التاريخ <span className="text-red-500">*</span></label>
            <input {...register('transactionDate')} type="date" max={todayStr()} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
            {errors.transactionDate && <p className="mt-1 text-xs text-red-600">{errors.transactionDate.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">المورد (اختياري)</label>
            <select {...register('supplierId')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500">
              <option value="">-- بدون مورد --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {supplierId && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">سعر الوحدة <span className="text-red-500">*</span></label>
                <input
                  {...register('pricePerUnit')}
                  type="number"
                  min="0"
                  step="any"
                  onChange={(e) => {
                    totalOverridden.current = false;
                    register('pricePerUnit').onChange(e);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
                {errors.pricePerUnit && <p className="mt-1 text-xs text-red-600">{errors.pricePerUnit.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الإجمالي المدفوع (دج)</label>
                <input
                  {...register('totalPricePaid')}
                  type="number"
                  min="0"
                  step="any"
                  onChange={(e) => {
                    totalOverridden.current = true;
                    register('totalPricePaid').onChange(e);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

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
