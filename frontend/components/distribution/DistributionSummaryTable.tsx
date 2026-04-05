'use client';

import { Search, GitBranch } from 'lucide-react';
import { useState } from 'react';
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
  const [search, setSearch] = useState('');

  if (error) return <ErrorAlert message={error} />;

  const filtered = search.trim()
    ? summary.filter((s) => s.tailorName.toLowerCase().includes(search.toLowerCase()))
    : summary;

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #10b981, transparent)', opacity: 0.7 }} />

      {/* header bar */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--divider)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
          <input
            type="text"
            placeholder="بحث بالخياط..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-1.5 pr-8 pl-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}
            dir="rtl"
          />
        </div>
        {!loading && summary.length > 0 && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
            {filtered.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse divide-y divide-border/30">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <div className="h-4 w-32 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="h-4 w-16 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="h-4 w-20 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا توجد توزيعات بعد'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
              <tr>
                {['الخياط', 'في التوزيع', 'مرتجع', 'غير مرتجع', 'إجمالي المكتسب', 'الرصيد المستحق'].map((h) => (
                  <th key={h} className="px-4 py-3 text-right" style={{ color: '#334155', borderBottom: '1px solid var(--table-head-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((s) => (
                <DistributionSummaryRow key={s.tailorId} summary={s} onClick={() => onRowClick(s.tailorId)} />
              ))}
            </tbody>
            {filtered.length > 1 && (() => {
              const totals = filtered.reduce((acc, s) => ({
                piecesInDistribution: acc.piecesInDistribution + s.piecesInDistribution,
                piecesReturned: acc.piecesReturned + s.piecesReturned,
                piecesNotYetReturned: acc.piecesNotYetReturned + s.piecesNotYetReturned,
                totalEarned: acc.totalEarned + s.totalEarned,
                remainingBalance: acc.remainingBalance + s.remainingBalance,
              }), { piecesInDistribution: 0, piecesReturned: 0, piecesNotYetReturned: 0, totalEarned: 0, remainingBalance: 0 });
              return (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--divider)', background: 'rgba(255,255,255,0.02)' }}>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#475569' }}>الإجمالي ({filtered.length})</td>
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums" style={{ color: '#60a5fa' }}>{totals.piecesInDistribution}</td>
                    <td className="px-4 py-3 text-xs tabular-nums" style={{ color: 'var(--cell-muted)' }}>{totals.piecesReturned}</td>
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums" style={{ color: '#fb923c' }}>{totals.piecesNotYetReturned}</td>
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums" style={{ color: '#34d399' }}>{totals.totalEarned.toFixed(2)} <span style={{ color: 'var(--cell-faint)' }}>دج</span></td>
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums" style={{ color: totals.remainingBalance > 0 ? '#f87171' : '#475569' }}>{totals.remainingBalance.toFixed(2)} <span style={{ color: 'var(--cell-faint)' }}>دج</span></td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      )}
    </div>
  );
}
