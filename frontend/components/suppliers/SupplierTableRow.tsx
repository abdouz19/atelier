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
      className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
      onClick={onClick}
    >
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{supplier.phone ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{supplier.address ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{supplier.productsSold ?? '—'}</td>
      <td className="max-w-xs px-4 py-3 text-sm text-gray-500">
        <span className="line-clamp-1">{supplier.notes ?? '—'}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="تعديل"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="حذف"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
