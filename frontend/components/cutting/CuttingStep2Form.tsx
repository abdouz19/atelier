'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PartRowsEditor } from './PartRowsEditor';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
import { CostDistributionTable } from './CostDistributionTable';
import { ipcClient } from '@/lib/ipc-client';
import type {
  PartRow,
  ConsumptionRow,
  NonFabricItem,
  MaterialBatchConsumption,
  CostDistributionRow,
  PartCost,
} from '@/features/cutting/cutting.types';

export interface Step2Values {
  parts: PartRow[];
  consumptionRows: ConsumptionRow[];
  materialBatchConsumptions: MaterialBatchConsumption[];
  consumedMaterialsCost: number;
  partCosts: PartCost[];
  hasCostMismatch: boolean;
}

interface CuttingStep2FormProps {
  onSubmit: (values: Step2Values) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  availableMeters: number;
  modelName: string;
  totalSessionCost: number;
  onConsumedMaterialsCostChange?: (cost: number) => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function CuttingStep2Form({
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
  totalSessionCost,
  onConsumedMaterialsCostChange,
}: CuttingStep2FormProps) {
  const [partRows, setPartRows] = useState<PartRow[]>([{ partName: '', sizeLabel: '', count: 1 }]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);
  const [partError, setPartError] = useState<string | null>(null);
  const [materialBatchConsumptions, setMaterialBatchConsumptions] = useState<MaterialBatchConsumption[]>([]);
  const [costDistributionRows, setCostDistributionRows] = useState<CostDistributionRow[]>([]);
  const [partCosts, setPartCosts] = useState<PartCost[]>([]);

  useEffect(() => {
    ipcClient.cutting.getNonFabricItems().then(r => { if (r.success) setNonFabricItems(r.data); });
  }, []);

  const consumedMaterialsCost = useMemo(
    () => round2(materialBatchConsumptions.reduce(
      (s, mc) => s + mc.batches.reduce((bs, b) => bs + (b.quantity || 0) * b.pricePerUnit, 0),
      0,
    )),
    [materialBatchConsumptions],
  );

  useEffect(() => {
    onConsumedMaterialsCostChange?.(consumedMaterialsCost);
  }, [consumedMaterialsCost, onConsumedMaterialsCostChange]);

  const grandTotal = useMemo(
    () => round2(costDistributionRows.reduce((s, r) => s + round2(r.unitCost * r.count), 0)),
    [costDistributionRows],
  );

  const allLocked = costDistributionRows.length > 0 && costDistributionRows.every(r => r.lockState === 'locked');
  const hasCostMismatch = allLocked && Math.abs(grandTotal - totalSessionCost) >= 0.01;

  const handlePartCosts = useCallback((costs: PartCost[]) => {
    setPartCosts(costs);
  }, []);

  const validParts = partRows.filter(r => r.partName.trim() && r.sizeLabel.trim() && r.count >= 1);

  function handleSubmit() {
    if (partRows.length === 0) { setPartError('أضف جزءاً واحداً على الأقل'); return; }
    const invalid = partRows.find(r => !r.partName.trim() || !r.sizeLabel.trim() || r.count < 1);
    if (invalid) { setPartError('تأكد من إدخال اسم الجزء والمقاس والعدد لكل صف'); return; }
    if (hasCostMismatch) return;
    setPartError(null);
    onSubmit({
      parts: partRows,
      consumptionRows,
      materialBatchConsumptions,
      consumedMaterialsCost,
      partCosts,
      hasCostMismatch,
    });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <PartRowsEditor
        rows={partRows}
        onChange={setPartRows}
        error={partError ?? undefined}
      />

      {validParts.length > 0 && (
        <CostDistributionTable
          parts={validParts}
          totalSessionCost={totalSessionCost}
          rows={costDistributionRows}
          onChange={setCostDistributionRows}
          onPartCosts={handlePartCosts}
        />
      )}

      <ConsumedMaterialsEditor
        nonFabricItems={nonFabricItems}
        value={consumptionRows}
        onChange={setConsumptionRows}
        onBatchChange={setMaterialBatchConsumptions}
        disabled={isSubmitting}
      />

      {consumedMaterialsCost > 0 && (
        <div className="rounded-lg border border-border px-3 py-2 text-sm flex justify-between" style={{ background: 'rgba(96,165,250,0.05)' }}>
          <span className="text-text-muted">تكلفة المواد المستهلكة</span>
          <strong>{consumedMaterialsCost.toFixed(2)} دج</strong>
        </div>
      )}

      {submitError && <p className="text-xs text-red-500">{submitError}</p>}
      {hasCostMismatch && (
        <p className="text-xs text-red-500">لا يمكن الحفظ: مجموع تكاليف الأجزاء لا يساوي تكلفة الجلسة.</p>
      )}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="rounded-lg border border-border px-4 py-2 text-sm text-text-base hover:bg-base/60">→ السابق</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || hasCostMismatch}
          className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
        >
          {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الجلسة'}
        </button>
      </div>
    </div>
  );
}
