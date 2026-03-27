'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { SupplierTableRow } from './SupplierTableRow';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

interface SupplierTableProps {
  suppliers: SupplierSummary[];
  onRowClick: (id: string) => void;
  onEdit: (supplier: SupplierSummary) => void;
  onDelete: (supplier: SupplierSummary) => void;
}

export function SupplierTable({ suppliers, onRowClick, onEdit, onDelete }: SupplierTableProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? suppliers.filter((s) => s.name.includes(search) || (s.phone ?? '').includes(search))
    : suppliers;

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <p className="text-base font-medium text-gray-500">لا يوجد موردون بعد</p>
        <p className="mt-1 text-sm text-gray-400">أضف أول مورد باستخدام الزر أعلاه</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف..."
          className="w-full rounded-lg border border-border py-2 pr-9 pl-3 text-sm text-text-base outline-none focus:border-primary-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-right">
          <thead className="sticky top-0 z-10 border-b border-border bg-base/60">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-text-muted">الاسم</th>
              <th className="px-4 py-3 text-sm font-semibold text-text-muted">الهاتف</th>
              <th className="px-4 py-3 text-sm font-semibold text-text-muted">العنوان</th>
              <th className="px-4 py-3 text-sm font-semibold text-text-muted">المنتجات</th>
              <th className="px-4 py-3 text-sm font-semibold text-text-muted">ملاحظات</th>
              <th className="px-4 py-3 text-sm font-semibold text-text-muted"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">لا توجد نتائج</td>
              </tr>
            ) : (
              filtered.map((s) => (
                <SupplierTableRow
                  key={s.id}
                  supplier={s}
                  onClick={() => onRowClick(s.id)}
                  onEdit={() => onEdit(s)}
                  onDelete={() => onDelete(s)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
