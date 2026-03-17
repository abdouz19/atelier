'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useDistributeForm } from '@/hooks/useDistributeForm';
import { ipcClient } from '@/lib/ipc-client';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';
import { AvailabilityTableSelector } from './AvailabilityTableSelector';
import type { DistributionTailorSummary } from '@/features/distribution/distribution.types';
import type { LookupEntry } from '@/features/lookups/lookups.types';

interface DistributeModalProps {
  onClose: () => void;
  onSuccess: (summary: DistributionTailorSummary) => void;
}

export function DistributeModal({ onClose, onSuccess }: DistributeModalProps) {
  const {
    tailorId, setTailorId,
    modelName, setModelName,
    availabilityCombinations, selectedCombination, selectCombination,
    isLoadingCombinations, modelSuggestions, activeTailors,
  } = useDistributeForm();

  const [quantity, setQuantity] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modelItems, setModelItems] = useState<LookupEntry[]>([]);

  useEffect(() => {
    ipcClient.lookups.getModels().then(r => { if (r.success) setModelItems(r.data); });
  }, []);

  // Reset quantity when combination changes
  useEffect(() => { setQuantity(''); }, [selectedCombination]);

  async function handleAddModel(name: string) {
    const res = await ipcClient.lookups.createModel({ name });
    if (res.success) ipcClient.lookups.getModels().then(r => { if (r.success) setModelItems(r.data); });
    return res;
  }

  const available = selectedCombination?.notDistributedCount ?? 0;
  const qty = Number(quantity);
  const price = Number(pricePerPiece);
  const totalCost = qty > 0 && price > 0 ? qty * price : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tailorId) { setError('يرجى اختيار الخياط'); return; }
    if (!modelName) { setError('يرجى إدخال اسم النموذج'); return; }
    if (!selectedCombination) { setError('يرجى اختيار تركيبة من الجدول'); return; }
    if (qty < 1) { setError('الكمية يجب أن تكون أكبر من صفر'); return; }
    if (qty > available) { setError(`الكمية (${qty}) تتجاوز المتاح (${available})`); return; }
    if (price <= 0) { setError('سعر القطعة يجب أن يكون أكبر من صفر'); return; }
    setSubmitting(true);
    try {
      const res = await ipcClient.distribution.distribute({
        tailorId, modelName,
        partName: selectedCombination.partName,
        sizeLabel: selectedCombination.sizeLabel,
        color: selectedCombination.color,
        quantity: qty,
        sewingPricePerPiece: price,
        distributionDate: new Date(distributionDate).getTime(),
      });
      if (res.success) { onSuccess(res.data); } else { setError(res.error); }
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">توزيع قطع</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">الخياط *</label>
            <select value={tailorId} onChange={e => setTailorId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none">
              <option value="">اختر الخياط</option>
              {activeTailors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">النموذج *</label>
            <ManagedDropdown
              value={modelName}
              onChange={setModelName}
              items={modelItems}
              placeholder="اختر الموديل"
              addLabel="إضافة موديل"
              onAddNew={handleAddModel}
            />
          </div>
          {modelName && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                اختر التركيبة (قطعة / مقاس / لون) *
              </label>
              {isLoadingCombinations ? (
                <div className="rounded-lg border border-gray-200 py-4 text-center text-sm text-gray-400">جاري التحميل...</div>
              ) : (
                <AvailabilityTableSelector
                  combinations={availabilityCombinations}
                  selected={selectedCombination}
                  onSelect={selectCombination}
                />
              )}
            </div>
          )}
          {selectedCombination && (
            <>
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                متاح: <strong>{available}</strong> قطعة
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">الكمية *</label>
                <input
                  type="number" min={1} max={available}
                  value={quantity} onChange={e => setQuantity(e.target.value)}
                  disabled={available === 0}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none disabled:bg-gray-50"
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">سعر الخياطة للقطعة *</label>
            <input type="number" step="any" min={0.01} value={pricePerPiece} onChange={e => setPricePerPiece(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          {totalCost > 0 && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
              الإجمالي: <strong>{totalCost.toFixed(2)} دج</strong>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">التاريخ *</label>
            <input type="date" value={distributionDate} onChange={e => setDistributionDate(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">إلغاء</button>
            <button type="submit" disabled={submitting || !selectedCombination || available === 0} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'جاري التوزيع...' : 'توزيع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
