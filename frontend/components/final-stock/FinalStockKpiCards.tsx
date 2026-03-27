import type { FinalStockKpis } from '@/features/final-stock/final-stock.types';

interface FinalStockKpiCardsProps {
  kpis: FinalStockKpis;
}

function fmt(n: number): string {
  return n.toLocaleString('ar-DZ');
}

export function FinalStockKpiCards({ kpis }: FinalStockKpiCardsProps) {
  const cards = [
    { label: 'إجمالي القطع في المخزون', value: fmt(kpis.totalPieces) },
    { label: 'عدد الموديلات المختلفة', value: fmt(kpis.totalDistinctModels) },
    { label: 'تركيبات المقاس/اللون', value: fmt(kpis.totalDistinctSizeColorCombos) },
  ];

  return (
    <div className="grid grid-cols-3 gap-3" dir="rtl">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-text-base">{c.value}</p>
          <p className="mt-1 text-xs text-text-muted">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
