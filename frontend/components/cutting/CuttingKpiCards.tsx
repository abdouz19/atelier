'use client';

import { motion } from 'framer-motion';
import { Layers, Package, Boxes, Ruler, CircleDollarSign } from 'lucide-react';
import type { CuttingKpis } from '@/features/cutting/cutting.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

type C = { value: string; iconText: string; iconBg: string; glow: string; accent: string };
const COLORS: Record<string, C> = {
  blue:    { value: '#60a5fa', iconText: '#60a5fa', iconBg: 'rgba(59,130,246,0.12)',  glow: 'rgba(59,130,246,0.15)',  accent: '#3b82f6' },
  emerald: { value: '#34d399', iconText: '#34d399', iconBg: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.15)', accent: '#10b981' },
  violet:  { value: '#a78bfa', iconText: '#a78bfa', iconBg: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.15)', accent: '#8b5cf6' },
  orange:  { value: '#fb923c', iconText: '#fb923c', iconBg: 'rgba(249,115,22,0.12)',  glow: 'rgba(249,115,22,0.15)',  accent: '#f97316' },
  amber:   { value: '#fbbf24', iconText: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)',  glow: 'rgba(245,158,11,0.15)',  accent: '#f59e0b' },
};

interface Card {
  label: string;
  value: string;
  icon: React.ElementType;
  color: keyof typeof COLORS;
}

function StatCard({ label, value, icon: Icon, color }: Card) {
  const c = COLORS[color];
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.015 }}
      className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200"
      style={{
        background: '#0d1422',
        borderColor: 'rgba(255,255,255,0.07)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${c.accent}30`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`, opacity: 0.8 }} />
      <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${c.glow}, transparent 70%)` }} />

      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: '#475569' }}>{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110" style={{ background: c.iconBg, boxShadow: `0 0 12px ${c.glow}` }}>
          <Icon size={16} style={{ color: c.iconText }} />
        </div>
      </div>
      <p className="text-[26px] font-bold tabular-nums leading-none tracking-tight" style={{ color: c.value }}>{value}</p>
    </motion.div>
  );
}

interface CuttingKpiCardsProps { kpis: CuttingKpis }

export function CuttingKpiCards({ kpis }: CuttingKpiCardsProps) {
  const cards: Card[] = [
    { label: 'إجمالي الجلسات',   value: kpis.totalSessions.toString(),              icon: Layers,             color: 'blue'    },
    { label: 'الأجزاء المنتجة',  value: kpis.totalPartsProduced.toString(),          icon: Package,            color: 'emerald' },
    { label: 'الأجزاء المتاحة',  value: kpis.totalPartsAvailable.toString(),         icon: Boxes,              color: 'violet'  },
    { label: 'الأمتار المستهلكة', value: `${fmt(kpis.totalMetersConsumed)} م`,        icon: Ruler,              color: 'orange'  },
    { label: 'التكلفة الإجمالية', value: `${fmt(kpis.totalCostPaid)} دج`,             icon: CircleDollarSign,   color: 'amber'   },
  ];

  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      initial="hidden" animate="visible"
      className="grid grid-cols-2 gap-3 md:grid-cols-5"
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
