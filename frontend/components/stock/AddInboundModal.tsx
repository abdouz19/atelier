'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ipcClient } from '@/lib/ipc-client';
import { useLookups } from '@/hooks/useLookups';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import { NestedSupplierModal } from '@/components/stock/NestedSupplierModal';
import { AppModal } from '@/components/shared/AppModal';
import { FormField } from '@/components/shared/FormField';
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
      <AppModal
        open
        onClose={onClose}
        title={`إضافة وارد — ${item.name}`}
        size="md"
        footer={
          <>
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
            <button type="submit" form="add-inbound-form" disabled={submitting} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
              {submitting ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </>
        }
      >
        {serverError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{serverError}</div>}

        <form id="add-inbound-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="الكمية" error={errors.quantity?.message} required>
            <input {...register('quantity')} type="number" min="0" step="any" className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>

          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">اللون (اختياري)</label>
            <ManagedDropdown
              value={colorValue}
              onChange={(v) => setValue('color', v)}
              items={colors}
              placeholder="اختر اللون"
              addLabel="إضافة لون"
              onAddNew={async (name) => { const r = await ipcClient.lookups.createColor({ name }); if (r.success) refetchLookups(); return r; }}
            />
          </div>

          <FormField label="التاريخ" error={errors.transactionDate?.message} required>
            <input {...register('transactionDate')} type="date" max={todayStr()} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>

          <FormField label="المورد" error={errors.supplierId?.message} required>
            <div className="flex gap-2">
              <select {...register('supplierId')} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                <option value="">-- اختر المورد --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowNestedSupplier(true)}
                className="rounded-lg border border-primary-300 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 whitespace-nowrap">
                + إضافة
              </button>
            </div>
          </FormField>

          <FormField label="سعر الوحدة" error={errors.pricePerUnit?.message} required>
            <input {...register('pricePerUnit')} type="number" min="0" step="any"
              onChange={(e) => { totalOverridden.current = false; register('pricePerUnit').onChange(e); }}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>

          <FormField label="الإجمالي المدفوع (دج)" error={errors.totalPricePaid?.message} required>
            <input {...register('totalPricePaid')} type="number" min="0" step="any"
              onChange={(e) => { totalOverridden.current = true; register('totalPricePaid').onChange(e); }}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>

          <FormField label="ملاحظات (اختيارية)">
            <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </FormField>
        </form>
      </AppModal>
      {showNestedSupplier && (
        <NestedSupplierModal
          onClose={() => setShowNestedSupplier(false)}
          onSuccess={handleNewSupplier}
        />
      )}
    </>
  );
}
