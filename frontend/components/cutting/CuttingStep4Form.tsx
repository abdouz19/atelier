'use client';

import { useState, useCallback, useMemo } from 'react';
import { CostDistributionTable } from './CostDistributionTable';
import { SessionCostCard } from './CuttingStep3Form';
import type { PartRow, CostDistributionRow, PartCost } from '@/features/cutting/cutting.types';

export interface Step4Values {
  partCosts: PartCost[];
  sessionDate: string;
  notes?: string;
}

interface CuttingStep4FormProps {
  fabricCost: number;
  employeeCost: number;
  consumedMaterialsCost: number;
  transportationCost: number;
  totalSessionCost: number;
  parts: PartRow[];
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (values: Step4Values) => void;
  onBack: () => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function CuttingStep4Form({
  fabricCost,
  employeeCost,
  consumedMaterialsCost,
  transportationCost,
  totalSessionCost,
  parts,
  isSubmitting,
  submitError,
  onSubmit,
  onBack,
}: CuttingStep4FormProps) {
  const [costDistributionRows, setCostDistributionRows] = useState<CostDistributionRow[]>([]);
  const [partCosts, setPartCosts] = useState<PartCost[]>([]);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  const validParts = useMemo(
    () => parts.filter(r => r.partName.trim() && r.sizeLabel.trim() && r.count >= 1),
    [parts],
  );

  const grandTotal = useMemo(
    () => round2(costDistributionRows.reduce((s, r) => s + round2(r.unitCost * r.count), 0)),
    [costDistributionRows],
  );

  const allLocked = costDistributionRows.length > 0 && costDistributionRows.every(r => r.lockState === 'locked');
  const hasCostMismatch = allLocked && Math.abs(grandTotal - totalSessionCost) >= 0.01;

  const handlePartCosts = useCallback((costs: PartCost[]) => {
    setPartCosts(costs);
  }, []);

  function handleSubmit() {
    if (!date) {
      setDateError('التاريخ مطلوب');
      return;
    }
    setDateError(null);
    if (hasCostMismatch) return;
    onSubmit({ partCosts, sessionDate: date, notes: notes || undefined });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <SessionCostCard
        fabricCost={fabricCost}
        employeeCost={employeeCost}
        consumedMaterialsCost={consumedMaterialsCost}
        transportationCost={transportationCost}
        totalSessionCost={totalSessionCost}
        frozen
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

      {hasCostMismatch && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-500">
          مجموع تكاليف الأجزاء لا يساوي تكلفة الجلسة
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">التاريخ *</label>
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setDateError(null); }}
            className={`w-full rounded-lg border px-3 py-2 text-sm input-transition focus:outline-none focus:border-primary-500 ${dateError ? 'border-red-400' : 'border-border'}`}
          />
          {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ملاحظات</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm input-transition focus:border-primary-500 focus:outline-none resize-none"
            placeholder="اختياري"
          />
        </div>
      </div>

      {submitError && <p className="text-xs text-red-500">{submitError}</p>}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} disabled={isSubmitting} className="rounded-lg border border-border px-4 py-2 text-sm text-text-base hover:bg-base/60 disabled:opacity-50">→ السابق</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || hasCostMismatch || !date}
          className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
        >
          {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الجلسة'}
        </button>
      </div>
    </div>
  );
}
