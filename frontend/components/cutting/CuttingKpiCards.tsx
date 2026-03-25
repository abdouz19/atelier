'use client';

import type { CuttingKpis } from '@/features/cutting/cutting.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface CuttingKpiCardsProps { kpis: CuttingKpis }

export function CuttingKpiCards({ kpis }: CuttingKpiCardsProps) {
  const cards = [
    { label: 'إجمالي الجلسات', value: kpis.totalSessions.toString() },
    { label: 'الأجزاء المنتجة', value: kpis.totalPartsProduced.toString() },
    { label: 'الأجزاء المتاحة', value: kpis.totalPartsAvailable.toString() },
    { label: 'الأمتار المستهلكة', value: `${fmt(kpis.totalMetersConsumed)} م` },
    { label: 'التكلفة الإجمالية', value: `${fmt(kpis.totalCostPaid)} دج` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5" dir="rtl">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-lg font-bold text-gray-900">{c.value}</p>
          <p className="mt-1 text-xs text-gray-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
