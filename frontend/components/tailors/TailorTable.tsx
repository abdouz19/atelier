'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
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
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* emerald accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #34d399, transparent)', opacity: 0.7 }} />

      {/* search */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--divider)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--cell-dim)' }} />
          <input
            type="text"
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-1.5 pr-8 pl-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}
            dir="rtl"
          />
        </div>
        {tailors.length > 0 && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
            {filtered.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا يوجد خياطون بعد'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
              <tr>
                {['الاسم', 'الهاتف', 'الحالة', 'إجمالي المكتسب', 'الرصيد المستحق', 'إجراءات'].map((h) => (
                  <th key={h} className="px-4 py-3 text-right" style={{ color: 'var(--cell-faint)', borderBottom: '1px solid var(--table-head-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
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
        </div>
      )}
    </div>
  );
}
