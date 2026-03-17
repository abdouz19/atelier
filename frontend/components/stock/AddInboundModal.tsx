'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import { useLookups } from '@/hooks/useLookups';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import { NestedSupplierModal } from '@/components/stock/NestedSupplierModal';
import type { StockItemSummary } from '@/features/stock/stock.types';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

const schema = z.object({
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  color: z.string().optional(),
  transactionDate: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
  supplierId: z.string().min(1, 'المورد مطلوب'),
  pricePerUnit: z.coerce.number().positive('سعر الوحدة مطلوب'),
  totalPricePaid: z.coerce.number().positive('الإجمالي مطلوب'),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

function todayStr() { return new Date().toISOString().slice(0, 10); }

interface AddInboundModalProps {
  item: StockItemSummary;
  suppliers: SupplierSummary[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AddInboundModal({ item, suppliers: initialSuppliers, onClose, onSuccess }: AddInboundModalProps) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showNestedSupplier, setShowNestedSupplier] = useState(false);
  const totalOverridden = useRef(false);
  const { colors, refetch: refetchLookups } = useLookups();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { transactionDate: todayStr(), color: item.color ?? '' },
  });

  const quantity = watch('quantity');
  const pricePerUnit = watch('pricePerUnit');
  const colorValue = watch('color') ?? '';

  useEffect(() => {
    if (totalOverridden.current) return;
    const q = Number(quantity);
    const p = Number(pricePerUnit);
    if (q > 0 && p > 0) setValue('totalPricePaid', q * p as unknown as string);
  }, [quantity, pricePerUnit, setValue]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setServerError(null);
    const res = await ipcClient.stock.addInbound({
      stockItemId: item.id,
      quantity: values.quantity,
      color: values.color || undefined,
      transactionDate: new Date(values.transactionDate).getTime(),
      notes: values.notes || undefined,
      supplierId: values.supplierId,
      pricePerUnit: values.pricePerUnit,
      totalPricePaid: values.totalPricePaid,
    });
    setSubmitting(false);
    if (res.success) onSuccess();
    else setServerError(res.error);
  }

  function handleNewSupplier(supplier: SupplierSummary) {
    setSuppliers((prev) => [...prev, supplier]);
    setValue('supplierId', supplier.id, { shouldValidate: true });
    setShowNestedSupplier(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" dir="rtl">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">إضافة وارد — {item.name}</h2>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">اللون (اختياري)</label>
              <ManagedDropdown
                value={colorValue}
                onChange={(v) => setValue('color', v)}
                items={colors}
                placeholder="اختر اللون"
                addLabel="إضافة لون"
                onAddNew={async (name) => { const r = await ipcClient.lookups.createColor({ name }); if (r.success) refetchLookups(); return r; }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">التاريخ <span className="text-red-500">*</span></label>
              <input {...register('transactionDate')} type="date" max={todayStr()} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
              {errors.transactionDate && <p className="mt-1 text-xs text-red-600">{errors.transactionDate.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">المورد <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select {...register('supplierId')} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500">
                  <option value="">-- اختر المورد --</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNestedSupplier(true)}
                  className="rounded-lg border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 whitespace-nowrap">
                  + إضافة
                </button>
              </div>
              {errors.supplierId && <p className="mt-1 text-xs text-red-600">{errors.supplierId.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">سعر الوحدة <span className="text-red-500">*</span></label>
              <input {...register('pricePerUnit')} type="number" min="0" step="any"
                onChange={(e) => { totalOverridden.current = false; register('pricePerUnit').onChange(e); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
              {errors.pricePerUnit && <p className="mt-1 text-xs text-red-600">{errors.pricePerUnit.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">الإجمالي المدفوع (دج) <span className="text-red-500">*</span></label>
              <input {...register('totalPricePaid')} type="number" min="0" step="any"
                onChange={(e) => { totalOverridden.current = true; register('totalPricePaid').onChange(e); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
              {errors.totalPricePaid && <p className="mt-1 text-xs text-red-600">{errors.totalPricePaid.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات (اختيارية)</label>
              <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">إلغاء</button>
              <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                {submitting ? 'جاري الإضافة...' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {showNestedSupplier && (
        <NestedSupplierModal
          onClose={() => setShowNestedSupplier(false)}
          onSuccess={handleNewSupplier}
        />
      )}
    </>
  );
}
