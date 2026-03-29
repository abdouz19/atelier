'use client';

import { useState, useEffect } from 'react';
import { PartRowsEditor } from './PartRowsEditor';
import { ConsumedMaterialsEditor } from '@/components/shared/ConsumedMaterialsEditor';
import { ipcClient } from '@/lib/ipc-client';
import type { PartRow, ConsumptionRow, NonFabricItem } from '@/features/cutting/cutting.types';

export interface Step2Values {
  parts: PartRow[];
  consumptionRows: ConsumptionRow[];
}

interface CuttingStep2FormProps {
  onSubmit: (values: Step2Values) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  availableMeters: number;
  modelName: string;
}

export function CuttingStep2Form({ onSubmit, onBack, isSubmitting, submitError, modelName }: CuttingStep2FormProps) {
  const [partRows, setPartRows] = useState<PartRow[]>([{ partName: '', sizeLabel: '', count: 1 }]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRow[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);
  const [partError, setPartError] = useState<string | null>(null);

  useEffect(() => {
    ipcClient.cutting.getNonFabricItems().then(r => { if (r.success) setNonFabricItems(r.data); });
  }, []);

  function handleSubmit() {
    if (partRows.length === 0) { setPartError('أضف جزءاً واحداً على الأقل'); return; }
    const invalid = partRows.find(r => !r.partName.trim() || !r.sizeLabel.trim() || r.count < 1);
    if (invalid) { setPartError('تأكد من إدخال اسم الجزء والمقاس والعدد لكل صف'); return; }
    setPartError(null);
    onSubmit({ parts: partRows, consumptionRows });
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
        disabled={isSubmitting}
      />
      {submitError && <p className="text-xs text-red-500">{submitError}</p>}
      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="rounded-lg border border-border px-4 py-2 text-sm text-text-base hover:bg-base/60">→ السابق</button>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
          {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الجلسة'}
        </button>
      </div>
    </div>
  );
}
