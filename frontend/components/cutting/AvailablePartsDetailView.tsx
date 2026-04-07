'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronUp, Filter, Calendar, Scissors, User, Package } from 'lucide-react';
import { useCuttingSessionsWithParts, type SessionsWithPartsFilters } from '@/hooks/useCuttingSessionsWithParts';
import type { SessionWithPartsRow } from '@/features/cutting/cutting.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Group flat rows into (model, size, color, partName) → sessions
interface GroupedPart {
  modelName: string;
  sizeLabel: string;
  color: string;
  partName: string;
  availableCount: number;
  totalProduced: number;
  avgUnitCost: number | null;
  sessions: SessionWithPartsRow[];
}

function groupRows(rows: SessionWithPartsRow[]): GroupedPart[] {
  const map = new Map<string, GroupedPart>();
  for (const r of rows) {
    const key = `${r.modelName}__${r.sizeLabel}__${r.color}__${r.partName}`;
    if (!map.has(key)) {
      map.set(key, {
        modelName: r.modelName,
        sizeLabel: r.sizeLabel,
        color: r.color,
        partName: r.partName,
        availableCount: r.availableCount,
        totalProduced: 0,
        avgUnitCost: null,
        sessions: [],
      });
    }
    const g = map.get(key)!;
    g.totalProduced += r.sessionCount;
    g.sessions.push(r);
  }
  // Compute weighted average unit cost
  for (const g of map.values()) {
    const costsWithCount = g.sessions.filter((s) => s.unitCost !== null);
    if (costsWithCount.length > 0) {
      const totalCount = costsWithCount.reduce((s, r) => s + r.sessionCount, 0);
      const weightedSum = costsWithCount.reduce((s, r) => s + (r.unitCost! * r.sessionCount), 0);
      g.avgUnitCost = totalCount > 0 ? weightedSum / totalCount : null;
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.modelName !== b.modelName) return a.modelName.localeCompare(b.modelName);
    if (a.sizeLabel !== b.sizeLabel) return a.sizeLabel.localeCompare(b.sizeLabel);
    if (a.color !== b.color) return a.color.localeCompare(b.color);
    return a.partName.localeCompare(b.partName);
  });
}

interface FilterBarProps {
  filters: SessionsWithPartsFilters;
  onChange: (f: SessionsWithPartsFilters) => void;
  options: {
    models: string[];
    sizes: string[];
    colors: string[];
    partNames: string[];
    fabrics: string[];
    employees: string[];
  };
}

function FilterBar({ filters, onChange, options }: FilterBarProps) {
  function set(key: keyof SessionsWithPartsFilters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const selects: Array<{ key: keyof SessionsWithPartsFilters; label: string; options: string[] }> = [
    { key: 'model',        label: 'الموديل',    options: options.models },
    { key: 'size',         label: 'المقاس',     options: options.sizes },
    { key: 'color',        label: 'اللون',      options: options.colors },
    { key: 'partName',     label: 'الجزء',      options: options.partNames },
    { key: 'fabricName',   label: 'القماش',     options: options.fabrics },
    { key: 'employeeName', label: 'الموظف',     options: options.employees },
  ];

  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <Filter size={13} style={{ color: '#475569' }} />
      {selects.map(({ key, label, options: opts }) => (
        <div key={key} className="relative">
          <select
            value={filters[key]}
            onChange={(e) => set(key, e.target.value)}
            className="appearance-none rounded-lg border py-1.5 pl-6 pr-3 text-xs outline-none"
            style={{
              background: filters[key] ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: filters[key] ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)',
              color: filters[key] ? '#a78bfa' : '#64748b',
            }}
          >
            <option value="">{label}</option>
            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={10} className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
        </div>
      ))}
      {/* Date filters */}
      {(['dateFrom', 'dateTo'] as const).map((key) => (
        <input
          key={key}
          type="date"
          value={filters[key]}
          onChange={(e) => set(key, e.target.value)}
          className="rounded-lg border py-1.5 px-2 text-xs outline-none"
          style={{
            background: filters[key] ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
            borderColor: filters[key] ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)',
            color: filters[key] ? '#a78bfa' : '#64748b',
            colorScheme: 'dark',
          }}
        />
      ))}
      {hasFilter && (
        <button
          onClick={() => onChange({ model: '', size: '', color: '', partName: '', fabricName: '', employeeName: '', dateFrom: '', dateTo: '' })}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          مسح
        </button>
      )}
    </div>
  );
}

interface PartCardProps {
  group: GroupedPart;
}

function PartCard({ group }: PartCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isZero = group.availableCount === 0;
  const accentColor = isZero ? '#ef4444' : '#a78bfa';
  const accentBg = isZero ? 'rgba(239,68,68,0.08)' : 'rgba(139,92,246,0.07)';
  const accentBorder = isZero ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.15)';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border"
      style={{ background: accentBg, borderColor: accentBorder }}
    >
      {/* Part header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center gap-4 px-4 py-3 text-right"
      >
        {/* Tags */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {[group.modelName, group.sizeLabel, group.color].filter(Boolean).map((tag, i) => (
            <span key={i} className="text-sm font-semibold" style={{ color: accentColor }}>
              {i > 0 && <span className="mx-1 opacity-30">·</span>}
              {tag}
            </span>
          ))}
          <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>— {group.partName}</span>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs tabular-nums" style={{ color: '#64748b' }}>
          {group.avgUnitCost !== null && (
            <div className="flex items-center gap-1">
              <span style={{ color: '#475569' }}>تكلفة:</span>
              <span style={{ color: '#fbbf24' }}>{fmt(group.avgUnitCost)} دج</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span style={{ color: '#475569' }}>مُنتَج:</span>
            <span>{group.totalProduced}</span>
          </div>
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold"
            style={isZero
              ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' }
              : { background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
          >
            <span>متاح:</span>
            <span>{group.availableCount}</span>
          </div>
          {expanded ? <ChevronUp size={14} style={{ color: '#475569' }} /> : <ChevronDown size={14} style={{ color: '#475569' }} />}
        </div>
      </button>

      {/* Sessions breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ borderTop: `1px solid ${accentBorder}` }}
          >
            <div className="divide-y divide-white/5">
              {group.sessions.map((s) => (
                <div key={s.sessionId} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5">
                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                    <Calendar size={11} style={{ color: '#475569' }} />
                    <span style={{ color: '#94a3b8' }}>{fmtDate(s.sessionDate)}</span>
                  </div>
                  {/* Fabric */}
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                    <Scissors size={11} style={{ color: '#475569' }} />
                    <span style={{ color: '#94a3b8' }}>{s.fabricName}</span>
                    {s.color && <span style={{ color: '#475569' }}>({s.color})</span>}
                  </div>
                  {/* Employees */}
                  {s.employeeNames.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748b' }}>
                      <User size={11} style={{ color: '#475569' }} />
                      <span style={{ color: '#94a3b8' }}>{s.employeeNames.join('، ')}</span>
                    </div>
                  )}
                  {/* Count and cost */}
                  <div className="mr-auto flex items-center gap-3 text-xs tabular-nums">
                    <span style={{ color: '#64748b' }}>
                      <span style={{ color: '#475569' }}>عدد:</span>{' '}
                      <span style={{ color: '#e2e8f0' }}>{s.sessionCount}</span>
                    </span>
                    {s.unitCost !== null && (
                      <span style={{ color: '#64748b' }}>
                        <span style={{ color: '#475569' }}>تكلفة/قطعة:</span>{' '}
                        <span style={{ color: '#fbbf24' }}>{fmt(s.unitCost)} دج</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface AvailablePartsDetailViewProps {
  onBack: () => void;
  initialFilter?: 'all' | 'available';
}

export function AvailablePartsDetailView({ onBack, initialFilter = 'available' }: AvailablePartsDetailViewProps) {
  const { rows, loading, error, filters, setFilters, options } = useCuttingSessionsWithParts();
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(initialFilter === 'available');

  const groups = useMemo(() => {
    const g = groupRows(rows);
    return showOnlyAvailable ? g.filter((gr) => gr.availableCount > 0) : g;
  }, [rows, showOnlyAvailable]);

  const totalAvailable = useMemo(() => groups.reduce((s, g) => s + g.availableCount, 0), [groups]);
  const totalCombos = groups.length;

  return (
    <div dir="rtl" className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ArrowRight size={14} />
          رجوع
        </button>
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>الأجزاء المتاحة — تفاصيل</h1>
          <p className="text-xs" style={{ color: '#475569' }}>تفاصيل القطع مع التكلفة والجلسات والموظفين</p>
        </div>
      </div>

      {/* Summary pills */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'تركيبات', value: totalCombos, color: '#a78bfa' },
            { label: 'قطع متاحة', value: totalAvailable, color: '#34d399' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <Package size={13} style={{ color }} />
              <span className="text-xs" style={{ color: '#64748b' }}>{label}:</span>
              <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
            </div>
          ))}
          {/* Toggle available only */}
          <button
            onClick={() => setShowOnlyAvailable((p) => !p)}
            className="rounded-xl border px-3 py-2 text-xs font-medium transition-all"
            style={showOnlyAvailable
              ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }
              : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', color: '#64748b' }}
          >
            {showOnlyAvailable ? 'المتاح فقط ✓' : 'عرض الكل'}
          </button>
        </div>
      )}

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} options={options} />

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
          حدث خطأ: {error}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border py-16" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <Package size={32} style={{ color: '#334155' }} />
          <p className="mt-3 text-sm" style={{ color: '#475569' }}>لا توجد نتائج مطابقة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <PartCard
              key={`${g.modelName}__${g.sizeLabel}__${g.color}__${g.partName}`}
              group={g}
            />
          ))}
        </div>
      )}
    </div>
  );
}
