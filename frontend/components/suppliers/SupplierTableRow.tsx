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
      className="cursor-pointer odd:bg-surface even:bg-base/30 hover:bg-primary-50"
      onClick={onClick}
    >
      <td className="px-4 py-3 text-sm font-medium text-text-base">{supplier.name}</td>
      <td className="px-4 py-3 text-sm text-text-muted">{supplier.phone ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-text-muted">{supplier.address ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-text-muted">{supplier.productsSold ?? '—'}</td>
      <td className="max-w-xs px-4 py-3 text-sm text-text-muted">
        <span className="line-clamp-1">{supplier.notes ?? '—'}</span>
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
            className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600"
            title="حذف"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
