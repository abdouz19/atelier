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
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <input
          type="text"
          placeholder="بحث بالموديل أو اسم القماش..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا توجد جلسات قص بعد'} />
      ) : (
        <table className="w-full text-sm" dir="rtl">
          <thead className="sticky top-0 z-10 bg-base/60 text-xs font-semibold text-text-muted">
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
          <tbody className="divide-y divide-border">
            {filtered.map((s) => (
              <CuttingSessionRow key={s.id} session={s} onClick={() => onRowClick(s.id)} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
