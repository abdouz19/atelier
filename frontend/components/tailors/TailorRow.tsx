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
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      dir="rtl"
      onClick={onClick}
    >
      <td className="px-4 py-3 font-medium text-gray-900">{tailor.name}</td>
      <td className="px-4 py-3 text-gray-600">{tailor.phone ?? '—'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          tailor.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {tailor.status === 'active' ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600">{tailor.totalEarned.toFixed(2)}</td>
      <td className="px-4 py-3 text-gray-600">{tailor.balanceDue.toFixed(2)}</td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(tailor)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="تعديل"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onSetStatus(tailor)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={tailor.status === 'active' ? 'تعطيل' : 'تفعيل'}
          >
            {tailor.status === 'active' ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
          </button>
        </div>
      </td>
    </tr>
  );
}
