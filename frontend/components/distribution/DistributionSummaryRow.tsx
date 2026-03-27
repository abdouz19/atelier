'use client';

import type { DistributionTailorSummary } from '@/features/distribution/distribution.types';

interface DistributionSummaryRowProps {
  summary: DistributionTailorSummary;
  onClick: () => void;
}

export function DistributionSummaryRow({ summary, onClick }: DistributionSummaryRowProps) {
  return (
    <tr
      className="cursor-pointer odd:bg-surface even:bg-base/30 hover:bg-primary-50 transition-colors"
      dir="rtl"
      onClick={onClick}
    >
      <td className="px-4 py-3 font-medium text-text-base">{summary.tailorName}</td>
      <td className="px-4 py-3 text-text-muted">{summary.piecesInDistribution}</td>
      <td className="px-4 py-3 text-text-muted">{summary.piecesReturned}</td>
      <td className="px-4 py-3 text-text-muted">{summary.piecesNotYetReturned}</td>
      <td className="px-4 py-3 text-text-muted">{summary.totalEarned.toFixed(2)}</td>
      <td className="px-4 py-3 text-text-muted">{summary.remainingBalance.toFixed(2)}</td>
    </tr>
  );
}
