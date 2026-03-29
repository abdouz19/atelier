import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Scissors, Truck, RotateCcw, ShieldCheck, Sparkles, Archive } from 'lucide-react';
import type { ActivityEntry } from '@/features/dashboard/dashboard.types';

interface Props { entries: ActivityEntry[] }

const TYPE_CONFIG: Record<ActivityEntry['type'], {
  label: string;
  icon: React.ElementType;
  dot: string;
  bg: string;
  text: string;
}> = {
  cutting_session: { label: 'قص',             icon: Scissors,    dot: '#64748b', bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  distribution:   { label: 'توزيع',           icon: Truck,       dot: '#f97316', bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  return:         { label: 'إعادة',           icon: RotateCcw,   dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  qc:             { label: 'مراقبة جودة',    icon: ShieldCheck, dot: '#6366f1', bg: 'rgba(99,102,241,0.12)',   text: '#818cf8' },
  finition:       { label: 'تشطيب',           icon: Sparkles,    dot: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa' },
  final_stock:    { label: 'مخزون نهائي',     icon: Archive,     dot: '#10b981', bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
};

function getHref(entry: ActivityEntry): string {
  switch (entry.type) {
    case 'cutting_session': return `/cutting?id=${entry.id}`;
    case 'distribution':   return `/distribution?id=${entry.id}`;
    case 'return':         return `/distribution?id=${entry.id}`;
    case 'qc':             return `/qc?id=${entry.id}`;
    case 'finition':       return `/qc?id=${entry.id}`;
    case 'final_stock':    return '/final-stock';
  }
}

function formatDate(iso: string | number): string {
  return new Date(iso).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });
}

export function ActivityFeed({ entries }: Props) {
  const router = useRouter();

  return (
    <div
      className="rounded-2xl border"
      style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>آخر النشاطات</h2>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}
        >
          {entries.length} عملية
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm" style={{ color: '#334155' }}>لا توجد عمليات حديثة</p>
        </div>
      ) : (
        <div className="relative px-5 py-3">
          {/* Timeline spine */}
          <div
            className="absolute top-3 bottom-3"
            style={{ right: '34px', width: '1px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 10%, rgba(255,255,255,0.06) 90%, transparent)' }}
          />

          <div className="space-y-0.5">
            {entries.map((entry, i) => {
              const cfg = TYPE_CONFIG[entry.type];
              const Icon = cfg.icon;
              return (
                <motion.button
                  key={`${entry.type}-${entry.id}`}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 320, damping: 28 }}
                  onClick={() => router.push(getHref(entry))}
                  className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-right transition-colors duration-150"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {/* Dot */}
                  <div className="relative flex shrink-0 items-center justify-center w-4">
                    <div
                      className="h-2 w-2 rounded-full ring-2 transition-transform duration-150 group-hover:scale-125"
                      style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}80, 0 0 0 2px #0d1422` }}
                    />
                  </div>

                  {/* Icon badge */}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110"
                    style={{ background: cfg.bg }}
                  >
                    <Icon size={13} style={{ color: cfg.text }} />
                  </div>

                  {/* Label badge */}
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: cfg.bg, color: cfg.text }}
                  >
                    {cfg.label}
                  </span>

                  {/* Model name */}
                  {entry.modelName && (
                    <span className="flex-1 truncate text-sm font-medium" style={{ color: '#cbd5e1' }}>
                      {entry.modelName}
                    </span>
                  )}

                  {/* Date */}
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: '#334155' }}>
                    {formatDate(entry.eventDate)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
