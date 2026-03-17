'use client';

import { useState, useEffect } from 'react';
import { PartSizeRowsEditor } from './PartSizeRowsEditor';
import { ConsumptionRowsEditor } from './ConsumptionRowsEditor';
import { ipcClient } from '@/lib/ipc-client';
import type { NonFabricItem } from '@/features/cutting/cutting.types';
import type { PartSizeRowData } from './PartSizeRowsEditor';
import type { ConsumptionRowData } from './ConsumptionRowsEditor';
import type { LookupEntry } from '@/features/lookups/lookups.types';

export interface Step2Values {
  pieceRows: PartSizeRowData[];
  consumptionRows: ConsumptionRowData[];
}

interface CuttingStep2FormProps {
  onSubmit: (values: Step2Values) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  availableMeters: number;
}

export function CuttingStep2Form({ onSubmit, onBack, isSubmitting, submitError }: CuttingStep2FormProps) {
  const [pieceRows, setPieceRows] = useState<PartSizeRowData[]>([{ partName: '', sizeName: '', quantity: 0 }]);
  const [consumptionRows, setConsumptionRows] = useState<ConsumptionRowData[]>([]);
  const [parts, setParts] = useState<LookupEntry[]>([]);
  const [sizes, setSizes] = useState<LookupEntry[]>([]);
  const [nonFabricItems, setNonFabricItems] = useState<NonFabricItem[]>([]);
  const [pieceError, setPieceError] = useState<string | null>(null);

  useEffect(() => {
    ipcClient.lookups.getParts().then(r => { if (r.success) setParts(r.data); });
    ipcClient.lookups.getSizes().then(r => { if (r.success) setSizes(r.data); });
    ipcClient.cutting.getNonFabricItems().then(r => { if (r.success) setNonFabricItems(r.data); });
  }, []);

  async function handleAddPart(name: string) {
    const res = await ipcClient.lookups.createPart({ name });
    if (res.success) { ipcClient.lookups.getParts().then(r => { if (r.success) setParts(r.data); }); }
    return res;
  }

  async function handleAddSize(name: string) {
    const res = await ipcClient.lookups.createSize({ name });
    if (res.success) { ipcClient.lookups.getSizes().then(r => { if (r.success) setSizes(r.data); }); }
    return res;
  }

  function handleSubmit() {
    if (pieceRows.length === 0) { setPieceError('أضف صفاً واحداً على الأقل'); return; }
    const invalid = pieceRows.find(r => !r.partName.trim() || !r.sizeName.trim() || !r.quantity || r.quantity < 1);
    if (invalid) { setPieceError('تأكد من اختيار القطعة والمقاس وإدخال الكمية (على الأقل 1) لكل صف'); return; }
    setPieceError(null);
    onSubmit({ pieceRows, consumptionRows });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <PartSizeRowsEditor
        rows={pieceRows}
        onChange={setPieceRows}
        parts={parts}
        sizes={sizes}
        onAddPart={handleAddPart}
        onAddSize={handleAddSize}
        error={pieceError ?? undefined}
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
