'use client';

import { SkeletonKpiGrid } from '@/components/shared/SkeletonCard';
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
  if (loading || !kpis) {
    return <SkeletonKpiGrid count={6} />;
  }

  return (
    <div className="grid grid-cols-3 gap-4" dir="rtl">
      {KPI_DEFS.map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">{label}</p>
          <p className="text-xl font-bold text-text-base">
            {typeof kpis[key] === 'number' && !Number.isInteger(kpis[key])
              ? kpis[key].toFixed(2)
              : kpis[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
