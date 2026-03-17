'use client';

import type { CuttingSessionSummary } from '@/features/cutting/cutting.types';

interface CuttingSessionRowProps {
  session: CuttingSessionSummary;
  onClick: () => void;
}

export function CuttingSessionRow({ session, onClick }: CuttingSessionRowProps) {
  return (
    <tr className="cursor-pointer transition-colors hover:bg-gray-50" onClick={onClick}>
      <td className="px-4 py-3 text-gray-600">
        {new Date(session.sessionDate).toLocaleDateString('en-GB')}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">
        {session.fabricName} — {session.fabricColor}
      </td>
      <td className="px-4 py-3 text-gray-700">{session.modelName}</td>
      <td className="px-4 py-3 text-gray-600">{session.metersUsed} م</td>
      <td className="px-4 py-3 text-gray-700">{session.totalPieces}</td>
      <td className="px-4 py-3 text-gray-600">{session.employeeNames.join('، ')}</td>
      <td className="px-4 py-3 font-medium text-gray-900">
        {session.totalCost.toLocaleString('en-US')} دج
      </td>
    </tr>
  );
}
