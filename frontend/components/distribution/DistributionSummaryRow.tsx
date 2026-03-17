'use client';

import type { DistributionTailorSummary } from '@/features/distribution/distribution.types';

interface DistributionSummaryRowProps {
  summary: DistributionTailorSummary;
  onClick: () => void;
}

export function DistributionSummaryRow({ summary, onClick }: DistributionSummaryRowProps) {
  return (
    <tr
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      dir="rtl"
      onClick={onClick}
    >
      <td className="px-4 py-3 font-medium text-gray-900">{summary.tailorName}</td>
      <td className="px-4 py-3 text-gray-600">{summary.piecesInDistribution}</td>
      <td className="px-4 py-3 text-gray-600">{summary.piecesReturned}</td>
      <td className="px-4 py-3 text-gray-600">{summary.piecesNotYetReturned}</td>
      <td className="px-4 py-3 text-gray-600">{summary.totalEarned.toFixed(2)}</td>
      <td className="px-4 py-3 text-gray-600">{summary.remainingBalance.toFixed(2)}</td>
    </tr>
  );
}
