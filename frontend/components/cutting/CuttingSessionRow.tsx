'use client';

import type { CuttingSessionSummary } from '@/features/cutting/cutting.types';

interface CuttingSessionRowProps {
  session: CuttingSessionSummary;
  onClick: () => void;
}

export function CuttingSessionRow({ session, onClick }: CuttingSessionRowProps) {
  return (
    <tr
      className="group cursor-pointer transition-colors odd:bg-surface even:bg-base/30 row-hover"
      onClick={onClick}
    >
      <td className="px-4 py-3 text-xs tabular-nums" style={{ color: 'var(--cell-dim)' }}>
        {new Date(session.sessionDate).toLocaleDateString('en-GB')}
      </td>
      <td className="px-4 py-3">
        <span className="font-medium text-text-base">{session.fabricName}</span>
        {session.fabricColor && (
          <span className="mr-2 inline-block rounded-full px-2 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            {session.fabricColor}
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-text-base">{session.modelName}</td>
      <td className="px-4 py-3">
        {session.sizeLabel
          ? <span className="rounded-md px-2 py-0.5 text-xs" style={{ background: 'rgba(96,165,250,0.10)', color: '#60a5fa' }}>{session.sizeLabel}</span>
          : <span style={{ color: 'var(--cell-faint)' }}>—</span>
        }
      </td>
      <td className="px-4 py-3 tabular-nums text-sm" style={{ color: 'var(--text-muted)' }}>{session.metersUsed} م</td>
      <td className="px-4 py-3">
        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
          {session.totalPieces}
        </span>
      </td>
      <td className="px-4 py-3 max-w-35 truncate text-xs" style={{ color: 'var(--cell-muted)' }}>
        {session.employeeNames.join('، ')}
      </td>
      <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: '#34d399' }}>
        {session.totalCost.toLocaleString('en-US')} <span className="text-xs font-normal" style={{ color: 'var(--cell-dim)' }}>دج</span>
      </td>
    </tr>
  );
}
