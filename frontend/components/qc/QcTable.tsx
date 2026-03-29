'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import type { QcRecordSummary } from '@/features/qc/qc.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function GradePill({ value, color, bg }: { value: string; color: string; bg: string }) {
  if (value === '0') return <span style={{ color: 'var(--cell-faint)' }}>—</span>;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{ background: bg, color }}
    >
      {value}
    </span>
  );
}

interface QcTableProps {
  records: QcRecordSummary[];
}

export function QcTable({ records }: QcTableProps) {
  const [search, setSearch] = useState('');
  const filtered = records.filter(
    (r) =>
      r.tailorName.toLowerCase().includes(search.toLowerCase()) ||
      r.modelName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()),
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
      {/* accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', opacity: 0.7 }} />

      {/* search */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--divider)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--cell-dim)' }} />
          <input
            type="text"
            placeholder="بحث بالخياط أو الموديل أو الموظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-1.5 pr-8 pl-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--cell-text)' }}
            dir="rtl"
          />
        </div>
        {records.length > 0 && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
            {filtered.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا توجد سجلات مراقبة جودة بعد'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
              <tr>
                {['التاريخ', 'الخياط', 'الموديل / المقاس / اللون', 'الموظف', 'مراجعة', 'تالف', 'مقبول', 'جيد', 'جيد جداً', 'التكلفة', 'الحالة'].map((h) => (
                  <th key={h} className="px-4 py-3 text-right" style={{ color: 'var(--cell-faint)', borderBottom: '1px solid var(--table-head-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((r) => (
                <tr key={r.id} className="odd:bg-surface even:bg-base/30 row-hover transition-colors">
                  <td className="px-4 py-3 text-xs tabular-nums" style={{ color: 'var(--cell-dim)' }}>
                    {new Date(r.reviewDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--cell-text)' }}>{r.tailorName}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: 'var(--cell-text)' }}>{r.modelName}</span>
                    {r.sizeLabel && (
                      <span className="mx-1 rounded px-1.5 py-0.5 text-xs" style={{ background: 'rgba(96,165,250,0.10)', color: '#60a5fa' }}>{r.sizeLabel}</span>
                    )}
                    {r.color && <span className="text-xs" style={{ color: 'var(--cell-muted)' }}>{r.color}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--cell-muted)' }}>{r.employeeName}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                      {fmt(r.quantityReviewed)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <GradePill value={fmt(r.qtyDamaged)}    color="#f87171" bg="rgba(239,68,68,0.12)" />
                  </td>
                  <td className="px-4 py-3">
                    <GradePill value={fmt(r.qtyAcceptable)} color="#fbbf24" bg="rgba(245,158,11,0.12)" />
                  </td>
                  <td className="px-4 py-3">
                    <GradePill value={fmt(r.qtyGood)}       color="#60a5fa" bg="rgba(59,130,246,0.12)" />
                  </td>
                  <td className="px-4 py-3">
                    <GradePill value={fmt(r.qtyVeryGood)}   color="#34d399" bg="rgba(16,185,129,0.12)" />
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium" style={{ color: '#34d399' }}>
                    {fmt(r.totalCost)} <span className="text-xs font-normal" style={{ color: 'var(--cell-dim)' }}>دج</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={r.batchStatus === 'مكتمل'
                        ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
                        : { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }
                      }
                    >
                      {r.batchStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
