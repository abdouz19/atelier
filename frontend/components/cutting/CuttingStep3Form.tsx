'use client';

import { useState, useMemo } from 'react';
import { PartRowsEditor } from './PartRowsEditor';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
import type { PartRow, ConsumptionRow, MaterialBatchConsumption, NonFabricItem } from '@/features/cutting/cutting.types';

export interface Step3Values {
  parts: PartRow[];
  materialBatchConsumptions: MaterialBatchConsumption[];
  consumedMaterialsCost: number;
}

interface CuttingStep3FormProps {
  fabricCost: number;
  employeeCost: number;
  modelName: string;
  nonFabricItems: NonFabricItem[];
  onNext: (values: Step3Values) => void;
  onBack: () => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function CuttingStep3Form({
  fabricCost,
  employeeCost,
  nonFabricItems,
  onNext,
  onBack,
}: CuttingStep3FormProps) {
  const [partRows, setPartRows] = useState<PartRow[]>([{ partName: '', sizeLabel: '', count: 1 }]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
  const [materialBatchConsumptions, setMaterialBatchConsumptions] = useState<MaterialBatchConsumption[]>([]);
  const [partError, setPartError] = useState<string | null>(null);

  const consumedMaterialsCost = useMemo(
    () => round2(materialBatchConsumptions.reduce(
      (s, mc) => s + mc.batches.reduce((bs, b) => bs + (b.quantity || 0) * b.pricePerUnit, 0),
      0,
    )),
    [materialBatchConsumptions],
  );

  const totalSessionCost = round2(fabricCost + employeeCost + consumedMaterialsCost);

  const validParts = partRows.filter(r => r.partName.trim() && r.sizeLabel.trim() && r.count >= 1);

  function handleNext() {
    if (validParts.length === 0) {
      setPartError('أضف جزءاً واحداً على الأقل مع تحديد الاسم والمقاس والعدد');
      return;
    }
    const invalid = partRows.find(r => !r.partName.trim() || !r.sizeLabel.trim() || r.count < 1);
    if (invalid) {
      setPartError('تأكد من إدخال اسم الجزء والمقاس والعدد لكل صف');
      return;
    }
    setPartError(null);
    onNext({ parts: partRows, materialBatchConsumptions, consumedMaterialsCost });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <PartRowsEditor
        rows={partRows}
        onChange={setPartRows}
        error={partError ?? undefined}
      />

      <ConsumedMaterialsEditor
        nonFabricItems={nonFabricItems}
        value={consumptionRows}
        onChange={setConsumptionRows}
        onBatchChange={setMaterialBatchConsumptions}
      />

      <SessionCostCard
        fabricCost={fabricCost}
        employeeCost={employeeCost}
        consumedMaterialsCost={consumedMaterialsCost}
        totalSessionCost={totalSessionCost}
      />

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="rounded-lg border border-border px-4 py-2 text-sm text-text-base hover:bg-base/60">→ السابق</button>
        <button type="button" onClick={handleNext} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">التالي ←</button>
      </div>
    </div>
  );
}

interface SessionCostCardProps {
  fabricCost: number;
  employeeCost: number;
  consumedMaterialsCost: number;
  totalSessionCost: number;
  frozen?: boolean;
}

export function SessionCostCard({ fabricCost, employeeCost, consumedMaterialsCost, totalSessionCost, frozen = false }: SessionCostCardProps) {
  return (
    <div className="rounded-lg border border-border p-3 text-sm space-y-1" dir="rtl">
      <p className="text-xs font-medium text-text-muted mb-1">{frozen ? 'ملخص تكلفة الجلسة' : 'ملخص التكلفة الحالية'}</p>
      <div className="flex justify-between text-text-muted">
        <span>تكلفة القماش</span>
        <span>{fabricCost.toFixed(2)} دج</span>
      </div>
      <div className="flex justify-between text-text-muted">
        <span>تكلفة العمال</span>
        <span>{employeeCost.toFixed(2)} دج</span>
      </div>
      <div className="flex justify-between text-text-muted">
        <span>تكلفة المواد</span>
        <span>{consumedMaterialsCost.toFixed(2)} دج</span>
      </div>
      <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
        <span>التكلفة الإجمالية للجلسة</span>
        <span className={frozen ? 'text-text-base' : 'text-amber-600'}>{totalSessionCost.toFixed(2)} دج</span>
      </div>
    </div>
  );
}
