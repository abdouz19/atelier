'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import { ipcClient } from '@/lib/ipc-client';
import type { AddToFinalStockPayload } from '@/features/finition/finition.types';
import type { LookupEntry } from '@/features/lookups/lookups.types';

interface AddToStockModalProps {
  sourceType: 'finition' | 'finition_step';
  sourceId: string;
  defaultModelName: string;
  defaultSizeLabel: string;
  defaultColor: string;
  quantity: number;
  entryDate: number;
  onConfirm: (payload: AddToFinalStockPayload) => Promise<void>;
  onCancel: () => void;
}

export function AddToStockModal({
  sourceType, sourceId, defaultModelName, defaultSizeLabel, defaultColor, quantity, entryDate, onConfirm, onCancel,
}: AddToStockModalProps) {
  const [modelName, setModelName] = useState(defaultModelName);
  const [sizeLabel, setSizeLabel] = useState(defaultSizeLabel);
  const [color, setColor] = useState(defaultColor);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelItems, setModelItems] = useState<LookupEntry[]>([]);
  const [sizeItems, setSizeItems] = useState<LookupEntry[]>([]);
  const [colorItems, setColorItems] = useState<LookupEntry[]>([]);

  useEffect(() => {
    ipcClient.lookups.getModels().then(r => { if (r.success) setModelItems(r.data); });
    ipcClient.lookups.getSizes().then(r => { if (r.success) setSizeItems(r.data); });
    ipcClient.lookups.getColors().then(r => { if (r.success) setColorItems(r.data); });
  }, []);

  async function handleAddModel(name: string) {
    const res = await ipcClient.lookups.createModel({ name });
    if (res.success) { ipcClient.lookups.getModels().then(r => { if (r.success) setModelItems(r.data); }); }
    return res;
  }

  async function handleAddSize(name: string) {
    const res = await ipcClient.lookups.createSize({ name });
    if (res.success) { ipcClient.lookups.getSizes().then(r => { if (r.success) setSizeItems(r.data); }); }
    return res;
  }

  async function handleAddColor(name: string) {
    const res = await ipcClient.lookups.createColor({ name });
    if (res.success) { ipcClient.lookups.getColors().then(r => { if (r.success) setColorItems(r.data); }); }
    return res;
  }

  async function handleConfirm() {
    if (!modelName.trim()) { setError('يرجى إدخال اسم الموديل'); return; }
    if (!sizeLabel.trim()) { setError('يرجى إدخال المقاس'); return; }
    if (!color.trim()) { setError('يرجى إدخال اللون'); return; }
    setSubmitting(true);
    try {
      await onConfirm({ sourceType, sourceId, modelName, sizeLabel, color, quantity, entryDate });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" dir="rtl">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-base">إضافة إلى المخزون النهائي</h3>
          <button onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">الموديل *</label>
            <ManagedDropdown value={modelName} onChange={setModelName} items={modelItems} placeholder="اختر الموديل" addLabel="إضافة موديل" onAddNew={handleAddModel} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">المقاس *</label>
            <ManagedDropdown value={sizeLabel} onChange={setSizeLabel} items={sizeItems} placeholder="اختر المقاس" addLabel="إضافة مقاس" onAddNew={handleAddSize} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-base">اللون *</label>
            <ManagedDropdown value={color} onChange={setColor} items={colorItems} placeholder="اختر اللون" addLabel="إضافة لون" onAddNew={handleAddColor} />
          </div>
          <p className="text-sm text-text-muted">الكمية: <strong className="text-text-base">{quantity}</strong></p>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-base/60">إلغاء</button>
          <button onClick={handleConfirm} disabled={submitting}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
            {submitting ? 'جاري الحفظ...' : 'إضافة للمخزون'}
          </button>
        </div>
      </div>
    </div>
  );
}
