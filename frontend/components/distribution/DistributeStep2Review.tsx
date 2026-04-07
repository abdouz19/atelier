'use client';

import { DistributionCostCard } from './DistributionCostCard';
import type { Step1Values } from '@/features/distribution/distribution.types';

interface DistributeStep2ReviewProps {
  step1Data: Step1Values;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onBack: () => void;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function DistributeStep2Review({
  step1Data,
  isSubmitting,
  submitError,
  onSubmit,
  onBack,
}: DistributeStep2ReviewProps) {
  const hasMaterials = step1Data.materialBatchConsumptions.length > 0;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Info grid */}
      <div className="rounded-lg border border-border p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-text-muted text-xs">الخياط</span>
          <p className="font-medium">{step1Data.tailorName}</p>
        </div>
        <div>
          <span className="text-text-muted text-xs">الموديل</span>
          <p className="font-medium">{step1Data.modelName}</p>
        </div>
        <div>
          <span className="text-text-muted text-xs">المقاس</span>
          <p className="font-medium">{step1Data.sizeLabel}</p>
        </div>
        <div>
          <span className="text-text-muted text-xs">اللون</span>
          <p className="font-medium">{step1Data.color}</p>
        </div>
        <div>
          <span className="text-text-muted text-xs">التاريخ</span>
          <p className="font-medium">{formatDate(step1Data.distributionDate)}</p>
        </div>
      </div>

      {/* Parts table */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-1">الأجزاء المعطاة</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-text-muted border-b border-border">
              <th className="text-right pb-1">الجزء</th>
              <th className="text-center pb-1">الكمية</th>
              <th className="text-center pb-1">متوسط التكلفة</th>
              <th className="text-left pb-1">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {step1Data.partRows.map((row, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-1 text-right">{row.partName}</td>
                <td className="py-1 text-center">{row.quantity}</td>
                <td className="py-1 text-center">{row.avgUnitCost.toFixed(2)} دج</td>
                <td className="py-1 text-left">{round2(row.quantity * row.avgUnitCost).toFixed(2)} دج</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sewing info */}
      <div className="rounded-lg bg-base px-3 py-2 text-sm flex justify-between">
        <span className="text-text-muted">القطع المتوقعة × سعر الخياطة</span>
        <span>{step1Data.expectedFinalQuantity} × {step1Data.sewingPricePerPiece.toFixed(2)} = {step1Data.sewingCost.toFixed(2)} دج</span>
      </div>

      {/* Consumed materials summary */}
      {hasMaterials && (
        <div className="rounded-lg border border-border px-3 py-2 text-sm">
          <p className="text-xs font-medium text-text-muted mb-1">
            المواد المستهلكة ({step1Data.materialBatchConsumptions.length} عنصر)
          </p>
          <p className="text-xs text-text-muted">
            الإجمالي: {step1Data.consumedMaterialsCost.toFixed(2)} دج
          </p>
        </div>
      )}

      {/* Cost card (frozen) */}
      <DistributionCostCard
        piecesCost={step1Data.piecesCost}
        sewingCost={step1Data.sewingCost}
        materialsCost={step1Data.consumedMaterialsCost}
        transportationCost={step1Data.transportationCost}
        totalCost={step1Data.totalCost}
        costPerFinalItem={step1Data.costPerFinalItem}
        expectedFinalQuantity={step1Data.expectedFinalQuantity}
        frozen
      />

      {submitError && <p className="text-xs text-red-500">{submitError}</p>}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-base hover:bg-base/60 disabled:opacity-50"
        >
          → السابق
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
        >
          {isSubmitting ? 'جاري التوزيع...' : 'توزيع ←'}
        </button>
      </div>
    </div>
  );
}
