'use client';

import { useState, useMemo, useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
import { PartGivenRowsEditor } from './PartGivenRowsEditor';
import { DistributionCostCard } from './DistributionCostCard';
import type { Step1Values, AvailablePartWithCost, PartGivenRow } from '@/features/distribution/distribution.types';
import type { NonFabricItem, ConsumptionRow, MaterialBatchConsumption } from '@/features/cutting/cutting.types';

interface DistributeStep1FormProps {
  nonFabricItems: NonFabricItem[];
  onNext: (values: Step1Values) => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function CascadingSelectors({
  tailors, models, sizes, colors,
  tailorId, modelName, sizeLabel, color,
  onTailorChange, onModelChange, onSizeChange, onColorChange,
}: {
  tailors: Array<{ id: string; name: string }>;
  models: string[];
  sizes: string[];
  colors: string[];
  tailorId: string; modelName: string; sizeLabel: string; color: string;
  onTailorChange: (id: string, name: string) => void;
  onModelChange: (v: string) => void;
  onSizeChange: (v: string) => void;
  onColorChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">الخياط *</label>
        <select
          value={tailorId}
          onChange={e => {
            const t = tailors.find(t => t.id === e.target.value);
            onTailorChange(e.target.value, t?.name ?? '');
          }}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">اختر الخياط</option>
          {tailors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">الموديل *</label>
        <select
          value={modelName}
          onChange={e => onModelChange(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">اختر الموديل</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">المقاس *</label>
          <select
            value={sizeLabel}
            onChange={e => onSizeChange(e.target.value)}
            disabled={!modelName}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
          >
            <option value="">اختر المقاس</option>
            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">اللون *</label>
          <select
            value={color}
            onChange={e => onColorChange(e.target.value)}
            disabled={!sizeLabel}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
          >
            <option value="">اختر اللون</option>
            {colors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function SewingCostLine({ expectedQty, sewingPrice }: { expectedQty: number; sewingPrice: number }) {
  const sewingCost = round2(expectedQty * sewingPrice);
  if (!expectedQty || sewingPrice < 0) return null;
  return (
    <p className="text-xs text-text-muted">
      {expectedQty} × {sewingPrice.toFixed(2)} دج = <span className="font-medium">{sewingCost.toFixed(2)} دج</span> إجمالي تكلفة الخياطة
    </p>
  );
}

export function DistributeStep1Form({ nonFabricItems, onNext }: DistributeStep1FormProps) {
  const [tailorId, setTailorId] = useState('');
  const [tailorName, setTailorName] = useState('');
  const [modelName, setModelName] = useState('');
  const [sizeLabel, setSizeLabel] = useState('');
  const [color, setColor] = useState('');
  const [expectedQtyStr, setExpectedQtyStr] = useState('');
  const [sewingPriceStr, setSewingPriceStr] = useState('');
  const [distributionDate, setDistributionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [partRows, setPartRows] = useState<PartGivenRow[]>([{ partName: '', quantity: 1, avgUnitCost: 0, availableCount: 0 }]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
  const [materialBatchConsumptions, setMaterialBatchConsumptions] = useState<MaterialBatchConsumption[]>([]);
  const [partRowError, setPartRowError] = useState<string | null>(null);

  const [tailors, setTailors] = useState<Array<{ id: string; name: string }>>([]);
  const [models, setModels] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [availableParts, setAvailableParts] = useState<AvailablePartWithCost[]>([]);

  useEffect(() => {
    ipcClient.distribution.getActiveTailors().then(r => { if (r.success) setTailors(r.data); });
    ipcClient.distribution.getModelsWithPieces().then(r => { if (r.success) setModels(r.data); });
  }, []);

  async function handleModelChange(v: string) {
    setModelName(v); setSizeLabel(''); setColor('');
    setSizes([]); setColors([]); setAvailableParts([]);
    setPartRows([{ partName: '', quantity: 1, avgUnitCost: 0, availableCount: 0 }]);
    if (!v) return;
    const r = await ipcClient.distribution.getSizesForModel({ modelName: v });
    if (r.success) setSizes(r.data);
  }

  async function handleSizeChange(v: string) {
    setSizeLabel(v); setColor('');
    setColors([]); setAvailableParts([]);
    setPartRows([{ partName: '', quantity: 1, avgUnitCost: 0, availableCount: 0 }]);
    if (!v || !modelName) return;
    const r = await ipcClient.distribution.getColorsForModelSize({ modelName, sizeLabel: v });
    if (r.success) setColors(r.data);
  }

  async function handleColorChange(v: string) {
    setColor(v); setAvailableParts([]);
    setPartRows([{ partName: '', quantity: 1, avgUnitCost: 0, availableCount: 0 }]);
    if (!v || !modelName || !sizeLabel) return;
    const r = await ipcClient.distribution.getPartsWithCostForModelSizeColor({ modelName, sizeLabel, color: v });
    if (r.success) setAvailableParts(r.data);
  }

  const expectedQty = Math.max(0, Number(expectedQtyStr) || 0);
  const sewingPrice = Math.max(0, Number(sewingPriceStr) || 0);

  const consumedMaterialsCost = useMemo(
    () => round2(materialBatchConsumptions.reduce(
      (s, mc) => s + mc.batches.reduce((bs, b) => bs + (b.quantity || 0) * b.pricePerUnit, 0),
      0,
    )),
    [materialBatchConsumptions],
  );

  const piecesCost = useMemo(
    () => round2(partRows.reduce((s, r) => s + round2(r.quantity * r.avgUnitCost), 0)),
    [partRows],
  );

  const sewingCost = round2(expectedQty * sewingPrice);
  const totalCost = round2(piecesCost + sewingCost + consumedMaterialsCost);
  const costPerFinalItem = expectedQty > 0 ? round2(totalCost / expectedQty) : 0;

  const hasValidPartRow = partRows.some(r => r.partName && r.quantity >= 1 && r.quantity <= r.availableCount);
  const hasOverLimitRow = partRows.some(r => r.partName && r.quantity > r.availableCount);
  const canProceed = tailorId && modelName && sizeLabel && color && expectedQty >= 1 && sewingPriceStr !== '' && hasValidPartRow && !hasOverLimitRow && distributionDate;

  function handleNext() {
    if (!canProceed) {
      if (!hasValidPartRow) setPartRowError('أضف جزءاً واحداً على الأقل مع تحديد الاسم والكمية الصحيحة');
      return;
    }
    setPartRowError(null);
    onNext({
      tailorId, tailorName, modelName, sizeLabel, color,
      expectedFinalQuantity: expectedQty,
      sewingPricePerPiece: sewingPrice,
      distributionDate,
      partRows: partRows.filter(r => r.partName && r.quantity >= 1),
      consumedMaterialsCost,
      materialBatchConsumptions,
      piecesCost, sewingCost, totalCost, costPerFinalItem,
    });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <CascadingSelectors
        tailors={tailors} models={models} sizes={sizes} colors={colors}
        tailorId={tailorId} modelName={modelName} sizeLabel={sizeLabel} color={color}
        onTailorChange={(id, name) => { setTailorId(id); setTailorName(name); }}
        onModelChange={handleModelChange}
        onSizeChange={handleSizeChange}
        onColorChange={handleColorChange}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">القطع المتوقعة النهائية *</label>
          <input
            type="number" min={1} step={1} value={expectedQtyStr}
            onChange={e => setExpectedQtyStr(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">سعر الخياطة للقطعة *</label>
          <input
            type="number" min={0} step="any" value={sewingPriceStr}
            onChange={e => setSewingPriceStr(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>
      <SewingCostLine expectedQty={expectedQty} sewingPrice={sewingPrice} />

      {color && (
        <PartGivenRowsEditor
          availableParts={availableParts}
          rows={partRows}
          onChange={setPartRows}
          error={partRowError ?? undefined}
        />
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">التاريخ *</label>
        <input
          type="date" value={distributionDate}
          onChange={e => setDistributionDate(e.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <ConsumedMaterialsEditor
        nonFabricItems={nonFabricItems}
        value={consumptionRows}
        onChange={setConsumptionRows}
        onBatchChange={setMaterialBatchConsumptions}
      />

      <DistributionCostCard
        piecesCost={piecesCost}
        sewingCost={sewingCost}
        materialsCost={consumedMaterialsCost}
        totalCost={totalCost}
        costPerFinalItem={costPerFinalItem}
        expectedFinalQuantity={expectedQty}
      />

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
        >
          التالي ←
        </button>
      </div>
    </div>
  );
}
