'use client';

import type { DistributionKpis } from '@/features/distribution/distribution.types';

interface DistributionKpiCardsProps {
  kpis: DistributionKpis | null;
  loading: boolean;
}

const KPI_DEFS = [
  { key: 'piecesInDistribution', label: 'القطع في التوزيع' },
  { key: 'piecesReturned', label: 'القطع المرتجعة' },
  { key: 'piecesNotYetReturned', label: 'القطع غير المرتجعة' },
  { key: 'tailorsWithActiveDist', label: 'خياطون نشطون' },
  { key: 'totalSewingCost', label: 'إجمالي تكلفة الخياطة' },
  { key: 'totalUnsettledCost', label: 'التكلفة غير المسددة' },
] as const;

export function DistributionKpiCards({ kpis, loading }: DistributionKpiCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4" dir="rtl">
      {KPI_DEFS.map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          {loading || !kpis ? (
            <div className="h-7 w-20 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="text-xl font-bold text-gray-900">
              {typeof kpis[key] === 'number' && !Number.isInteger(kpis[key])
                ? kpis[key].toFixed(2)
                : kpis[key]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
