'use client';

import { useState } from 'react';
import { CuttingSessionRow } from './CuttingSessionRow';
import { EmptyState } from '@/components/shared/EmptyState';
import type { CuttingSessionSummary } from '@/features/cutting/cutting.types';

interface CuttingSessionTableProps {
  sessions: CuttingSessionSummary[];
  onRowClick: (id: string) => void;
}

export function CuttingSessionTable({ sessions, onRowClick }: CuttingSessionTableProps) {
  const [search, setSearch] = useState('');
  const filtered = sessions.filter(
    (s) =>
      s.modelName.toLowerCase().includes(search.toLowerCase()) ||
      s.fabricName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <input
          type="text"
          placeholder="بحث بالموديل أو اسم القماش..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا توجد جلسات قص بعد'} />
      ) : (
        <table className="w-full text-sm" dir="rtl">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">القماش واللون</th>
              <th className="px-4 py-3 text-right">الموديل</th>
              <th className="px-4 py-3 text-right">المقاس</th>
              <th className="px-4 py-3 text-right">الأمتار</th>
              <th className="px-4 py-3 text-right">القطع</th>
              <th className="px-4 py-3 text-right">الموظفون</th>
              <th className="px-4 py-3 text-right">التكلفة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <CuttingSessionRow key={s.id} session={s} onClick={() => onRowClick(s.id)} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
