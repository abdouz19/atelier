'use client';

import { ChevronLeft } from 'lucide-react';
import type { DistributionTailorSummary } from '@/features/distribution/distribution.types';

interface DistributionSummaryRowProps {
  summary: DistributionTailorSummary;
  onClick: () => void;
}

export function DistributionSummaryRow({ summary, onClick }: DistributionSummaryRowProps) {
  const hasBalance = summary.remainingBalance > 0;

  return (
    <tr
      className="group cursor-pointer transition-colors odd:bg-surface even:bg-base/30 row-hover"
      dir="rtl"
      onClick={onClick}
    >
      {/* Tailor name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}
          >
            {summary.tailorName.charAt(0)}
          </div>
          <span className="font-medium" style={{ color: 'var(--cell-text)' }}>{summary.tailorName}</span>
        </div>
      </td>

      {/* In distribution */}
      <td className="px-4 py-3">
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
          style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
        >
          {summary.piecesInDistribution}
        </span>
      </td>

      {/* Returned */}
      <td className="px-4 py-3">
        <span className="tabular-nums text-sm" style={{ color: 'var(--cell-muted)' }}>
          {summary.piecesReturned}
        </span>
      </td>

      {/* Not yet returned */}
      <td className="px-4 py-3">
        {summary.piecesNotYetReturned > 0 ? (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
            style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}
          >
            {summary.piecesNotYetReturned}
          </span>
        ) : (
          <span className="tabular-nums text-sm" style={{ color: 'var(--cell-faint)' }}>0</span>
        )}
      </td>

      {/* Total earned */}
      <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: '#34d399' }}>
        {summary.totalEarned.toFixed(2)}
        <span className="mr-1 text-xs font-normal" style={{ color: 'var(--cell-dim)' }}>دج</span>
      </td>

      {/* Balance due */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-semibold tabular-nums text-sm"
            style={{ color: hasBalance ? '#f87171' : '#475569' }}
          >
            {summary.remainingBalance.toFixed(2)}
            <span className="mr-1 text-xs font-normal" style={{ color: 'var(--cell-faint)' }}>دج</span>
          </span>
          <ChevronLeft size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--text-muted)' }} />
        </div>
      </td>
    </tr>
  );
}
