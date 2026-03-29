'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import type { FinitionRecordSummary } from '@/features/finition/finition.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface FinitionTableProps {
  records: FinitionRecordSummary[];
}

export function FinitionTable({ records }: FinitionTableProps) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = records.filter(
    (r) =>
      r.modelName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.color.toLowerCase().includes(search.toLowerCase()),
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
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)', opacity: 0.7 }} />

      {/* search */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--divider)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--cell-dim)' }} />
          <input
            type="text"
            placeholder="بحث بالموديل أو الموظف أو اللون..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-1.5 pr-8 pl-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--cell-text)' }}
            dir="rtl"
          />
        </div>
        {records.length > 0 && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
            {filtered.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا توجد سجلات تشطيب بعد'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
              <tr>
                {['التاريخ', 'الموديل / المقاس / اللون', 'الموظف', 'الكمية', 'التكلفة', 'الحالة', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-right" style={{ color: 'var(--cell-faint)', borderBottom: '1px solid var(--table-head-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className="odd:bg-surface even:bg-base/30 row-hover transition-colors">
                    <td className="px-4 py-3 text-xs tabular-nums" style={{ color: 'var(--cell-dim)' }}>
                      {new Date(r.finitionDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: 'var(--cell-text)' }}>{r.modelName}</span>
                      {r.sizeLabel && (
                        <span className="mx-1 rounded px-1.5 py-0.5 text-xs" style={{ background: 'rgba(96,165,250,0.10)', color: '#60a5fa' }}>{r.sizeLabel}</span>
                      )}
                      {r.color && <span className="text-xs" style={{ color: 'var(--cell-muted)' }}>{r.color}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--cell-muted)' }}>{r.employeeName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
                        {fmt(r.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: '#34d399' }}>
                      {fmt(r.totalCost)} <span className="text-xs font-normal" style={{ color: 'var(--cell-dim)' }}>دج</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={r.isReady
                          ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
                          : { background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }
                        }
                      >
                        {r.isReady ? 'جاهز' : 'قيد المعالجة'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.steps.length > 0 && (
                        <button
                          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors"
                          style={{ color: 'var(--cell-dim)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#475569'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <Layers size={12} />
                          {r.steps.length}
                          {expandedId === r.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </td>
                  </tr>

                  {expandedId === r.id && r.steps.map((step, stepIdx) => (
                    <tr key={step.id} style={{ background: 'rgba(139,92,246,0.04)' }}>
                      <td className="py-2 pr-8 pl-4 text-xs tabular-nums" style={{ color: 'var(--cell-faint)' }}>
                        {new Date(step.stepDate).toLocaleDateString('en-GB')}
                      </td>
                      <td colSpan={2} className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
                          >
                            {step.stepOrder}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {step.stepName}
                            {step.employeeName && <span style={{ color: 'var(--cell-dim)' }}> — {step.employeeName}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs tabular-nums" style={{ color: 'var(--cell-muted)' }}>{fmt(step.quantity)}</td>
                      <td className="px-4 py-2" />
                      <td className="px-4 py-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={step.isReady
                            ? { background: 'rgba(16,185,129,0.12)', color: '#34d399' }
                            : { background: 'rgba(100,116,139,0.12)', color: 'var(--cell-muted)' }
                          }
                        >
                          {step.isReady ? 'جاهز' : 'قيد التنفيذ'}
                        </span>
                      </td>
                      <td />
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
