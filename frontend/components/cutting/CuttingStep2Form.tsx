'use client';

import { useState, useEffect } from 'react';
import { PartRowsEditor } from './PartRowsEditor';
import { ConsumptionRowsEditor } from './ConsumptionRowsEditor';
import { ipcClient } from '@/lib/ipc-client';
import type { PartRow, NonFabricItem } from '@/features/cutting/cutting.types';
import type { ConsumptionRowData } from './ConsumptionRowsEditor';

export interface Step2Values {
  parts: PartRow[];
  consumptionRows: ConsumptionRowData[];
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
  const [partRows, setPartRows] = useState<PartRow[]>([{ partName: '', count: 1 }]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRowData[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);
  const [partError, setPartError] = useState<string | null>(null);

  useEffect(() => {
    ipcClient.cutting.getNonFabricItems().then(r => { if (r.success) setNonFabricItems(r.data); });
  }, []);

  function handleSubmit() {
    if (partRows.length === 0) { setPartError('أضف جزءاً واحداً على الأقل'); return; }
    const invalid = partRows.find(r => !r.partName.trim() || r.count < 1);
    if (invalid) { setPartError('تأكد من إدخال اسم الجزء والعدد (على الأقل 1) لكل صف'); return; }
    setPartError(null);
    onSubmit({ parts: partRows, consumptionRows });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <PartRowsEditor
        rows={partRows}
        onChange={setPartRows}
        modelName={modelName}
        error={partError ?? undefined}
      />
      <ConsumptionRowsEditor rows={consumptionRows} onChange={setConsumptionRows} items={nonFabricItems} />
      {submitError && <p className="text-xs text-red-500">{submitError}</p>}
      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">→ السابق</button>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
          {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الجلسة'}
        </button>
      </div>
    </div>
  );
}
