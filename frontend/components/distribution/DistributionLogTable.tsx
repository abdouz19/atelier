'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { ipcClient } from '@/lib/ipc-client';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import type { DistributionBatchLogRow } from '@/features/distribution/distribution.types';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB');
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  in_distribution: { label: 'في التوزيع', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  partial_return: { label: 'ارتجاع جزئي', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  fully_returned: { label: 'مكتمل', color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
};

function BatchLogRow({ row }: { row: DistributionBatchLogRow }) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = STATUS_LABELS[row.status] ?? STATUS_LABELS.in_distribution;

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      {/* Main row */}
      <button
        className="w-full text-right px-4 py-3 flex items-center gap-3 transition-colors hover:bg-white/[0.02]"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1 grid grid-cols-[1fr_auto_auto_auto_auto_auto] items-center gap-4 text-sm" dir="rtl">
          {/* Tailor + model */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium" style={{ color: 'var(--cell-text)' }}>{row.tailorName}</span>
              <span style={{ color: '#475569' }}>—</span>
              <span style={{ color: 'var(--cell-muted)' }}>{row.modelName}</span>
              {row.sizeLabel && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa' }}>{row.sizeLabel}</span>}
              {row.color && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa' }}>{row.color}</span>}
            </div>
          </div>

          {/* Status */}
          <span className="rounded-full px-2 py-0.5 text-xs whitespace-nowrap" style={{ background: statusInfo.bg, color: statusInfo.color }}>
            {statusInfo.label}
          </span>

          {/* Expected / returned */}
          <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: 'var(--cell-muted)' }}>
            {row.quantityReturned}/{row.expectedPiecesCount}
          </span>

          {/* Total cost */}
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#fbbf24' }}>
            {row.totalCost.toFixed(2)} دج
          </span>

          {/* Date */}
          <span className="text-xs tabular-nums" style={{ color: '#475569' }}>
            {formatDate(row.distributionDate)}
          </span>
        </div>

        <span style={{ color: '#475569' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ background: 'rgba(255,255,255,0.01)' }}>
          {/* Parts */}
          {row.parts.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium" style={{ color: '#475569' }}>الأجزاء المعطاة</p>
              <div className="flex flex-wrap gap-2">
                {row.parts.map(p => (
                  <div key={p.partName} className="rounded-lg px-2.5 py-1 text-xs" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}>
                    <span style={{ color: '#60a5fa' }}>{p.partName}</span>
                    <span className="mx-1" style={{ color: '#475569' }}>×</span>
                    <span style={{ color: 'var(--cell-text)' }}>{p.quantity}</span>
                    {p.avgUnitCost != null && (
                      <span className="mr-1" style={{ color: 'var(--cell-muted)' }}>({p.avgUnitCost.toFixed(2)} دج)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consumed materials */}
          {row.consumedMaterials.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium" style={{ color: '#475569' }}>المواد المستهلكة</p>
              <div className="flex flex-wrap gap-2">
                {row.consumedMaterials.map((m, i) => (
                  <span key={i} className="rounded px-2 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--cell-muted)' }}>
                    {m.itemName}{m.color ? ` (${m.color})` : ''}: {m.quantity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cost breakdown */}
          {(row.piecesCost != null || row.sewingCost != null) && (
            <div className="flex flex-wrap gap-4 text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.1)' }}>
              {row.piecesCost != null && <span style={{ color: 'var(--cell-muted)' }}>أجزاء: <strong style={{ color: '#fbbf24' }}>{row.piecesCost.toFixed(2)} دج</strong></span>}
              {row.sewingCost != null && <span style={{ color: 'var(--cell-muted)' }}>خياطة: <strong style={{ color: '#fbbf24' }}>{row.sewingCost.toFixed(2)} دج</strong></span>}
              {row.materialsCost != null && row.materialsCost > 0 && <span style={{ color: 'var(--cell-muted)' }}>مواد: <strong style={{ color: '#fbbf24' }}>{row.materialsCost.toFixed(2)} دج</strong></span>}
              {row.costPerFinalItem != null && <span style={{ color: 'var(--cell-muted)' }}>تكلفة/قطعة: <strong style={{ color: '#fbbf24' }}>{row.costPerFinalItem.toFixed(2)} دج</strong></span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DistributionLogTable() {
  const [rows, setRows] = useState<DistributionBatchLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    setLoading(true);
    ipcClient.distribution.getAllBatches()
      .then(res => { if (res.success) setRows(res.data); else setError(res.error); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allModels = useMemo(() => [...new Set(rows.map(r => r.modelName))].sort(), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (search && !r.tailorName.toLowerCase().includes(search.toLowerCase()) && !r.modelName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (modelFilter && r.modelName !== modelFilter) return false;
    if (dateFrom && r.distributionDate < new Date(dateFrom).getTime()) return false;
    if (dateTo && r.distributionDate > new Date(dateTo).getTime() + 86399999) return false;
    return true;
  }), [rows, search, statusFilter, modelFilter, dateFrom, dateTo]);

  const hasFilters = search || statusFilter || modelFilter || dateFrom || dateTo;

  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
          <input
            type="text" placeholder="بحث بالخياط أو الموديل..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border py-1.5 pr-8 pl-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}
            dir="rtl"
          />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border py-1.5 px-3 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: statusFilter ? '#e2e8f0' : '#475569' }}
          dir="rtl">
          <option value="">كل الحالات</option>
          <option value="in_distribution">في التوزيع</option>
          <option value="partial_return">ارتجاع جزئي</option>
          <option value="fully_returned">مكتمل</option>
        </select>

        {allModels.length > 0 && (
          <select value={modelFilter} onChange={e => setModelFilter(e.target.value)}
            className="rounded-lg border py-1.5 px-3 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: modelFilter ? '#e2e8f0' : '#475569' }}
            dir="rtl">
            <option value="">كل الموديلات</option>
            {allModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}

        <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }} dir="rtl">
          <Filter size={12} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border py-1.5 px-2 text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }} />
          <span>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border py-1.5 px-2 text-xs outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }} />
        </div>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setModelFilter(''); setDateFrom(''); setDateTo(''); }}
            className="text-xs transition-colors hover:underline" style={{ color: '#475569' }}>
            مسح الفلاتر
          </button>
        )}

        {!loading && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums mr-auto" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
            {filtered.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)', opacity: 0.5 }} />

        {loading ? (
          <div className="animate-pulse divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3">
                <div className="h-4 w-36 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="h-4 w-20 rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
                <div className="h-4 w-16 rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message={hasFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد سجلات توزيع'} />
        ) : (
          <div>
            {filtered.map(row => <BatchLogRow key={row.id} row={row} />)}
          </div>
        )}
      </div>
    </div>
  );
}
