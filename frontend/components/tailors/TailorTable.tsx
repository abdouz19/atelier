'use client';

import { useState } from 'react';
import { TailorRow } from './TailorRow';
import { EmptyState } from '@/components/shared/EmptyState';
import type { TailorSummary } from '@/features/tailors/tailors.types';

interface TailorTableProps {
  tailors: TailorSummary[];
  onRowClick: (id: string) => void;
  onEdit: (t: TailorSummary) => void;
  onSetStatus: (t: TailorSummary) => void;
}

export function TailorTable({ tailors, onRowClick, onEdit, onSetStatus }: TailorTableProps) {
  const [search, setSearch] = useState('');

  const filtered = tailors.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.phone ?? '').includes(search)
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <input
          type="text"
          placeholder="بحث بالاسم أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا يوجد خياطون بعد'} />
      ) : (
        <table className="w-full text-sm" dir="rtl">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-right">الاسم</th>
              <th className="px-4 py-3 text-right">الهاتف</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">إجمالي المكتسب</th>
              <th className="px-4 py-3 text-right">الرصيد المستحق</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((tailor) => (
              <TailorRow
                key={tailor.id}
                tailor={tailor}
                onClick={() => onRowClick(tailor.id)}
                onEdit={onEdit}
                onSetStatus={onSetStatus}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
