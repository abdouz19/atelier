'use client';

import { DistributionSummaryRow } from './DistributionSummaryRow';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import type { DistributionTailorSummary } from '@/features/distribution/distribution.types';

interface DistributionSummaryTableProps {
  summary: DistributionTailorSummary[];
  loading: boolean;
  error: string | null;
  onRowClick: (tailorId: string) => void;
}

export function DistributionSummaryTable({ summary, loading, error, onRowClick }: DistributionSummaryTableProps) {
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {loading ? (
        <div className="animate-pulse divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <div className="h-4 w-32 rounded bg-border" />
              <div className="h-4 w-16 rounded bg-border" />
              <div className="h-4 w-16 rounded bg-border" />
            </div>
          ))}
        </div>
      ) : summary.length === 0 ? (
        <EmptyState message="لا توجد توزيعات بعد" />
      ) : (
        <table className="w-full text-sm" dir="rtl">
          <thead className="sticky top-0 z-10 bg-base/60 text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-4 py-3 text-right">الخياط</th>
              <th className="px-4 py-3 text-right">في التوزيع</th>
              <th className="px-4 py-3 text-right">مرتجع</th>
              <th className="px-4 py-3 text-right">غير مرتجع</th>
              <th className="px-4 py-3 text-right">إجمالي المكتسب</th>
              <th className="px-4 py-3 text-right">الرصيد المستحق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {summary.map((s) => (
              <DistributionSummaryRow key={s.tailorId} summary={s} onClick={() => onRowClick(s.tailorId)} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
