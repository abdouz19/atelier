'use client';

import type { ColorVariant } from '@/features/stock/stock.types';

interface ColorVariantCardProps {
  variant: ColorVariant;
  unit: string;
}

export function ColorVariantCard({ variant, unit }: ColorVariantCardProps) {
  const label = variant.color ?? 'بدون لون';

  return (
    <div className={`rounded-lg border p-4 ${variant.isLow ? 'border-red-200 bg-red-50' : 'border-border bg-white'}`}>
      <div className="mb-1 text-sm font-medium text-text-base">{label}</div>
      <div className={`text-xl font-bold ${variant.isLow ? 'text-red-600' : 'text-text-base'}`}>
        {variant.quantity} <span className="text-sm font-normal text-text-muted">{unit}</span>
      </div>
      {variant.isLow && (
        <div className="mt-1 text-xs text-red-500">كمية منخفضة</div>
      )}
    </div>
  );
}
