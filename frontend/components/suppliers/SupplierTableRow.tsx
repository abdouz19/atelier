'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

interface SupplierTableRowProps {
  supplier: SupplierSummary;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SupplierTableRow({ supplier, onClick, onEdit, onDelete }: SupplierTableRowProps) {
  return (
    <tr
      className="cursor-pointer odd:bg-surface even:bg-base/30 hover:bg-white/3 transition-colors"
      onClick={onClick}
    >
      <td className="px-4 py-3 text-sm font-medium text-text-base">{supplier.name}</td>
      <td className="px-4 py-3 text-sm text-text-muted">{supplier.phone ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-text-muted">{supplier.address ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-text-muted">{supplier.productsSold ?? '—'}</td>
      <td className="px-4 py-3 text-sm tabular-nums">
        {supplier.purchaseCount > 0 ? (
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
            {supplier.purchaseCount}
          </span>
        ) : (
          <span className="text-text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm font-semibold tabular-nums">
        {supplier.totalSpent > 0 ? (
          <span style={{ color: '#34d399' }}>{supplier.totalSpent.toLocaleString('en-US', { maximumFractionDigits: 2 })} <span className="text-xs font-normal" style={{ color: 'var(--cell-faint)' }}>دج</span></span>
        ) : (
          <span className="text-text-muted text-xs">لا توجد مشتريات</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-text-muted hover:bg-base hover:text-text-muted"
            title="تعديل"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="حذف"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
