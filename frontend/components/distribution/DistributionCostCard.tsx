'use client';

interface DistributionCostCardProps {
  piecesCost: number;
  sewingCost: number;
  materialsCost: number;
  transportationCost: number;
  totalCost: number;
  costPerFinalItem: number;
  expectedFinalQuantity: number;
  frozen?: boolean;
}

export function DistributionCostCard({
  piecesCost,
  sewingCost,
  materialsCost,
  transportationCost,
  totalCost,
  costPerFinalItem,
  expectedFinalQuantity,
  frozen = false,
}: DistributionCostCardProps) {
  return (
    <div className="rounded-lg border border-border p-3 text-sm space-y-1" dir="rtl">
      <p className="text-xs font-medium text-text-muted mb-1">
        {frozen ? 'ملخص تكلفة التوزيع' : 'ملخص التكلفة الحالية'}
      </p>
      <div className="flex justify-between text-text-muted">
        <span>تكلفة الأجزاء المعطاة</span>
        <span>{piecesCost.toFixed(2)} دج</span>
      </div>
      <div className="flex justify-between text-text-muted">
        <span>تكلفة الخياطة</span>
        <span>{sewingCost.toFixed(2)} دج</span>
      </div>
      <div className="flex justify-between text-text-muted">
        <span>تكلفة المواد المستهلكة</span>
        <span>{materialsCost.toFixed(2)} دج</span>
      </div>
      {transportationCost > 0 && (
        <div className="flex justify-between text-text-muted">
          <span>رسوم النقل</span>
          <span>{transportationCost.toFixed(2)} دج</span>
        </div>
      )}
      <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
        <span>التكلفة الإجمالية للتوزيع</span>
        <span className={frozen ? 'text-text-base' : 'text-amber-600'}>{totalCost.toFixed(2)} دج</span>
      </div>
      <div className="flex justify-between text-text-muted text-xs pt-0.5">
        <span>تكلفة القطعة النهائية الواحدة</span>
        <span>{expectedFinalQuantity > 0 ? costPerFinalItem.toFixed(2) : '—'} {expectedFinalQuantity > 0 ? 'دج' : ''}</span>
      </div>
    </div>
  );
}
