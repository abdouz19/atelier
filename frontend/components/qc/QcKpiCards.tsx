'use client';

import type { QcKpis } from '@/features/qc/qc.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface QcKpiCardsProps { kpis: QcKpis }

export function QcKpiCards({ kpis }: QcKpiCardsProps) {
  const cards = [
    { label: 'في انتظار المراجعة', value: fmt(kpis.pendingQc) },
    { label: 'تمت مراجعته', value: fmt(kpis.totalReviewed) },
    { label: 'تالف', value: fmt(kpis.totalDamaged) },
    { label: 'مقبول', value: fmt(kpis.totalAcceptable) },
    { label: 'جيد', value: fmt(kpis.totalGood) },
    { label: 'جيد جداً', value: fmt(kpis.totalVeryGood) },
    { label: 'في انتظار التشطيب', value: fmt(kpis.finitionPending) },
    { label: 'جاهز للمخزون', value: fmt(kpis.readyForStock) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" dir="rtl">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="text-lg font-bold text-text-base">{c.value}</p>
          <p className="mt-1 text-xs text-text-muted">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
