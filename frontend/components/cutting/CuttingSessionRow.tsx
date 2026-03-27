'use client';

import type { CuttingSessionSummary } from '@/features/cutting/cutting.types';

interface CuttingSessionRowProps {
  session: CuttingSessionSummary;
  onClick: () => void;
}

export function CuttingSessionRow({ session, onClick }: CuttingSessionRowProps) {
  return (
    <tr className="cursor-pointer transition-colors odd:bg-surface even:bg-base/30 hover:bg-primary-50" onClick={onClick}>
      <td className="px-4 py-3 text-text-muted">
        {new Date(session.sessionDate).toLocaleDateString('en-GB')}
      </td>
      <td className="px-4 py-3 font-medium text-text-base">
        {session.fabricName} — {session.fabricColor}
      </td>
      <td className="px-4 py-3 text-text-base">{session.modelName}</td>
      <td className="px-4 py-3 text-text-muted">{session.sizeLabel || '—'}</td>
      <td className="px-4 py-3 text-text-muted">{session.metersUsed} م</td>
      <td className="px-4 py-3 text-text-base">{session.totalPieces}</td>
      <td className="px-4 py-3 text-text-muted">{session.employeeNames.join('، ')}</td>
      <td className="px-4 py-3 font-medium text-text-base">
        {session.totalCost.toLocaleString('en-US')} دج
      </td>
    </tr>
  );
}
