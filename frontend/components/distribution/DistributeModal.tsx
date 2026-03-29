'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import { AppModal } from '@/components/shared/AppModal';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
import type { DistributionTailorSummary, AvailablePartForModel } from '@/features/distribution/distribution.types';
import type { NonFabricItem, ConsumptionRow } from '@/features/cutting/cutting.types';
import type { LookupEntry } from '@/features/lookups/lookups.types';
import { ManagedDropdown } from '@/components/shared/ManagedDropdown';

interface PartQtyRow {
  partName: string;
  quantity: number;
}

interface DistributeModalProps {
  onClose: () => void;
  onSuccess: (summary: DistributionTailorSummary) => void;
}

export function DistributeModal({ onClose, onSuccess }: DistributeModalProps) {
  const [tailorId, setTailorId] = useState('');
  const [modelName, setModelName] = useState('');
  const [sizeLabel, setSizeLabel] = useState('');
  const [color, setColor] = useState('');
  const [expectedPiecesCount, setExpectedPiecesCount] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);
  const [partRows, setPartRows] = useState<PartQtyRow[]>([]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);
  const [availableParts, setAvailableParts] = useState<AvailablePartForModel[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [activeTailors, setActiveTailors] = useState<Array<{ id: string; name: string }>>([]);
  const [modelItems, setModelItems] = useState<LookupEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ipcClient.distribution.getActiveTailors().then(r => { if (r.success) setActiveTailors(r.data); });
    ipcClient.lookups.getModels().then(r => { if (r.success) setModelItems(r.data); });
    ipcClient.cutting.getNonFabricItems().then(r => { if (r.success) setNonFabricItems(r.data); });
  }, []);

  async function handleModelChange(name: string) {
    setModelName(name);
    setSizeLabel('');
    setColor('');
    setPartRows([]);
    setAvailableParts([]);
    setAvailableSizes([]);
    setAvailableColors([]);
    if (!name) return;
    const res = await ipcClient.cutting.getAvailableSizesForModel({ modelName: name });
    if (res.success) setAvailableSizes(res.data);
  }

  async function handleSizeChange(size: string) {
    setSizeLabel(size);
    setColor('');
    setPartRows([]);
    setAvailableParts([]);
    setAvailableColors([]);
    if (!size || !modelName) return;
    const res = await ipcClient.cutting.getAvailableColorsForModelSize({ modelName, sizeLabel: size });
    if (res.success) setAvailableColors(res.data);
  }

  async function handleColorChange(c: string) {
    setColor(c);
    setPartRows([]);
    setAvailableParts([]);
    if (!c || !modelName || !sizeLabel) return;
    setIsLoadingParts(true);
    const res = await ipcClient.distribution.getAvailablePartsForModel({ modelName, sizeLabel, color: c });
    if (res.success) setAvailableParts(res.data);
    setIsLoadingParts(false);
  }

  async function handleAddModel(name: string) {
    const res = await ipcClient.lookups.createModel({ name });
    if (res.success) ipcClient.lookups.getModels().then(r => { if (r.success) setModelItems(r.data); });
    return res;
  }

  function addPartRow() {
    setPartRows(prev => [...prev, { partName: '', quantity: 1 }]);
  }

  function updatePartRow(i: number, patch: Partial<PartQtyRow>) {
    setPartRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }

  function removePartRow(i: number) {
    setPartRows(prev => prev.filter((_, idx) => idx !== i));
  }

  function getAvailable(partName: string): number {
    return availableParts.find(p => p.partName === partName)?.availableCount ?? 0;
  }

  const expectedCount = Number(expectedPiecesCount);
  const price = Number(pricePerPiece);
  const totalCost = expectedCount > 0 && price > 0 ? expectedCount * price : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tailorId) { setError('يرجى اختيار الخياط'); return; }
    if (!modelName) { setError('يرجى اختيار الموديل'); return; }
    if (!sizeLabel) { setError('يرجى اختيار المقاس'); return; }
    if (!color) { setError('يرجى اختيار اللون'); return; }
    if (expectedCount < 1) { setError('عدد القطع المتوقعة يجب أن يكون أكبر من صفر'); return; }
    if (price <= 0) { setError('سعر الخياطة يجب أن يكون أكبر من صفر'); return; }
    if (partRows.length === 0) { setError('يجب إضافة جزء واحد على الأقل'); return; }
    const invalidRow = partRows.find(r => !r.partName || r.quantity < 1);
    if (invalidRow) { setError('تأكد من اختيار اسم الجزء وإدخال الكمية لكل صف'); return; }
    for (const row of partRows) {
      const avail = getAvailable(row.partName);
      if (row.quantity > avail) { setError(`الكمية المطلوبة من "${row.partName}" (${row.quantity}) تتجاوز المتاح (${avail})`); return; }
    }
    setSubmitting(true);
    try {
      const res = await ipcClient.distribution.distribute({
        tailorId, modelName, sizeLabel, color,
        expectedPiecesCount: expectedCount,
        sewingPricePerPiece: price,
        distributionDate: new Date(distributionDate).getTime(),
        parts: partRows,
        consumptionRows,
      });
      if (res.success) { onSuccess(res.data); } else { setError(res.error); }
    } finally { setSubmitting(false); }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title="توزيع قطع"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="distribute-modal-form" disabled={submitting} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري التوزيع...' : 'توزيع'}
          </button>
        </>
      }
    >
      <form id="distribute-modal-form" onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">الخياط *</label>
          <select value={tailorId} onChange={e => setTailorId(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
            <option value="">اختر الخياط</option>
            {activeTailors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">الموديل *</label>
          <ManagedDropdown
            value={modelName}
            onChange={handleModelChange}
            items={modelItems}
            placeholder="اختر الموديل"
            addLabel="إضافة موديل"
            onAddNew={handleAddModel}
          />
        </div>
        {modelName && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">المقاس *</label>
              <select value={sizeLabel} onChange={e => handleSizeChange(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                <option value="">اختر المقاس</option>
                {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-base">اللون *</label>
              <select value={color} onChange={e => handleColorChange(e.target.value)} disabled={!sizeLabel} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50">
                <option value="">اختر اللون</option>
                {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">القطع المتوقعة (النهائية) *</label>
          <input type="number" min={1} step={1} value={expectedPiecesCount} onChange={e => setExpectedPiecesCount(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">سعر الخياطة للقطعة *</label>
          <input type="number" step="any" min={0.01} value={pricePerPiece} onChange={e => setPricePerPiece(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        {totalCost > 0 && (
          <div className="rounded-lg bg-base px-3 py-2 text-sm">الإجمالي: <strong>{totalCost.toFixed(2)} دج</strong></div>
        )}
        {color && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-text-base">الأجزاء المعطاة *</span>
              <button type="button" onClick={addPartRow} className="flex items-center gap-1 text-xs text-primary-600 hover:underline"><Plus size={13} />إضافة جزء</button>
            </div>
            {isLoadingParts && <p className="text-xs text-text-muted">جاري التحميل...</p>}
            {availableParts.length === 0 && !isLoadingParts && (
              <p className="text-xs text-amber-600">لا توجد أجزاء متاحة لهذا الاختيار</p>
            )}
            {partRows.map((row, i) => {
              const avail = getAvailable(row.partName);
              return (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <select value={row.partName} onChange={e => updatePartRow(i, { partName: e.target.value })} className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                    <option value="">اختر الجزء</option>
                    {availableParts.map(p => <option key={p.partName} value={p.partName}>{p.partName} (متاح: {p.availableCount})</option>)}
                  </select>
                  <input type="number" min={1} max={avail || undefined} value={row.quantity || ''} onChange={e => updatePartRow(i, { quantity: Number(e.target.value) })} placeholder="الكمية" className="w-24 rounded-lg border border-border px-3 py-1.5 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                  <button type="button" onClick={() => removePartRow(i)} className="text-text-muted hover:text-red-500"><X size={14} /></button>
                </div>
              );
            })}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">التاريخ *</label>
          <input type="date" value={distributionDate} onChange={e => setDistributionDate(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <ConsumedMaterialsEditor
          nonFabricItems={nonFabricItems}
          value={consumptionRows}
          onChange={setConsumptionRows}
          disabled={submitting}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </AppModal>
  );
}
