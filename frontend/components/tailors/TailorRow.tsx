'use client';

import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import type { TailorSummary } from '@/features/tailors/tailors.types';

interface TailorRowProps {
  tailor: TailorSummary;
  onClick: () => void;
  onEdit: (t: TailorSummary) => void;
  onSetStatus: (t: TailorSummary) => void;
}

export function TailorRow({ tailor, onClick, onEdit, onSetStatus }: TailorRowProps) {
  return (
    <tr
      className="cursor-pointer odd:bg-surface even:bg-base/30 hover:bg-white/3 transition-colors"
      dir="rtl"
      onClick={onClick}
    >
      <td className="px-4 py-3 font-medium text-text-base">{tailor.name}</td>
      <td className="px-4 py-3 text-text-muted">{tailor.phone ?? '—'}</td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={tailor.status === 'active'
            ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
            : { background: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}
        >
          {tailor.status === 'active' ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td className="px-4 py-3 text-text-muted">{tailor.totalEarned.toFixed(2)}</td>
      <td className="px-4 py-3 text-text-muted">{tailor.balanceDue.toFixed(2)}</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(tailor)}
            className="rounded p-1 text-text-muted hover:bg-base hover:text-text-muted"
            title="تعديل"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onSetStatus(tailor)}
            className="rounded p-1 text-text-muted hover:bg-base hover:text-text-muted"
            title={tailor.status === 'active' ? 'تعطيل' : 'تفعيل'}
          >
            {tailor.status === 'active' ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
          </button>
        </div>
      </td>
    </tr>
  );
}
