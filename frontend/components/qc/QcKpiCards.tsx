'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, ThumbsUp, Star, Sparkles, Wrench, Archive } from 'lucide-react';
import type { QcKpis } from '@/features/qc/qc.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

type C = { value: string; iconText: string; iconBg: string; glow: string; accent: string };
const COLORS: Record<string, C> = {
  blue:    { value: '#60a5fa', iconText: '#60a5fa', iconBg: 'rgba(59,130,246,0.12)',  glow: 'rgba(59,130,246,0.15)',  accent: '#3b82f6' },
  emerald: { value: '#34d399', iconText: '#34d399', iconBg: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.15)', accent: '#10b981' },
  red:     { value: '#f87171', iconText: '#f87171', iconBg: 'rgba(239,68,68,0.12)',   glow: 'rgba(239,68,68,0.18)',   accent: '#ef4444' },
  amber:   { value: '#fbbf24', iconText: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)',  glow: 'rgba(245,158,11,0.15)',  accent: '#f59e0b' },
  violet:  { value: '#a78bfa', iconText: '#a78bfa', iconBg: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.15)', accent: '#8b5cf6' },
  orange:  { value: '#fb923c', iconText: '#fb923c', iconBg: 'rgba(249,115,22,0.12)',  glow: 'rgba(249,115,22,0.15)',  accent: '#f97316' },
};

interface Card { label: string; value: string; icon: React.ElementType; color: keyof typeof COLORS }

function StatCard({ label, value, icon: Icon, color }: Card) {
  const c = COLORS[color];
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.015 }}
      className="group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200"
      style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${c.accent}30`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`, opacity: 0.8 }} />
      <div className="pointer-events-none absolute -top-5 -right-5 h-16 w-16 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${c.glow}, transparent 70%)` }} />

      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-widest leading-tight" style={{ color: '#475569' }}>{label}</p>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110" style={{ background: c.iconBg, boxShadow: `0 0 10px ${c.glow}` }}>
          <Icon size={14} style={{ color: c.iconText }} />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none tracking-tight" style={{ color: c.value }}>{value}</p>
    </motion.div>
  );
}

interface QcKpiCardsProps { kpis: QcKpis }

export function QcKpiCards({ kpis }: QcKpiCardsProps) {
  const cards: Card[] = [
    { label: 'في انتظار المراجعة', value: fmt(kpis.pendingQc),         icon: Clock,         color: 'orange'  },
    { label: 'تمت مراجعته',        value: fmt(kpis.totalReviewed),     icon: CheckCircle2,  color: 'blue'    },
    { label: 'تالف',               value: fmt(kpis.totalDamaged),      icon: XCircle,       color: 'red'     },
    { label: 'مقبول',              value: fmt(kpis.totalAcceptable),   icon: ThumbsUp,      color: 'amber'   },
    { label: 'جيد',                value: fmt(kpis.totalGood),         icon: Star,          color: 'emerald' },
    { label: 'جيد جداً',           value: fmt(kpis.totalVeryGood),     icon: Sparkles,      color: 'violet'  },
    { label: 'في انتظار التشطيب',  value: fmt(kpis.finitionPending),   icon: Wrench,        color: 'orange'  },
    { label: 'جاهز للمخزون',       value: fmt(kpis.readyForStock),     icon: Archive,       color: 'emerald' },
  ];

  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.035 } } }}
      initial="hidden" animate="visible"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
      dir="rtl"
    >
      {cards.map((c) => (
        <motion.div key={c.label} variants={{ hidden: { opacity: 0, y: 14, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 26 } } }}>
          <StatCard {...c} />
        </motion.div>
      ))}
    </motion.div>
  );
}
