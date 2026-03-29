'use client';

import { motion } from 'framer-motion';
import { Archive, Layers, Grid3X3 } from 'lucide-react';
import type { FinalStockKpis } from '@/features/final-stock/final-stock.types';

type C = { value: string; iconText: string; iconBg: string; glow: string; accent: string };
const COLORS: Record<string, C> = {
  emerald: { value: '#34d399', iconText: '#34d399', iconBg: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.15)', accent: '#10b981' },
  blue:    { value: '#60a5fa', iconText: '#60a5fa', iconBg: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.15)', accent: '#3b82f6' },
  violet:  { value: '#a78bfa', iconText: '#a78bfa', iconBg: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.15)', accent: '#8b5cf6' },
};

interface Card { label: string; value: string; icon: React.ElementType; color: keyof typeof COLORS }

function StatCard({ label, value, icon: Icon, color }: Card) {
  const c = COLORS[color];
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.015 }}
      className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200"
      style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)' }}
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
      <p className="text-[28px] font-bold tabular-nums leading-none tracking-tight" style={{ color: c.value }}>{value}</p>
    </motion.div>
  );
}

interface FinalStockKpiCardsProps { kpis: FinalStockKpis }

export function FinalStockKpiCards({ kpis }: FinalStockKpiCardsProps) {
  const cards: Card[] = [
    { label: 'إجمالي القطع في المخزون', value: kpis.totalPieces.toLocaleString('ar-DZ'),             icon: Archive,  color: 'emerald' },
    { label: 'عدد الموديلات المختلفة',  value: kpis.totalDistinctModels.toLocaleString('ar-DZ'),      icon: Layers,   color: 'blue'    },
    { label: 'تركيبات المقاس/اللون',    value: kpis.totalDistinctSizeColorCombos.toLocaleString('ar-DZ'), icon: Grid3X3, color: 'violet'  },
  ];

  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      initial="hidden" animate="visible"
      className="grid grid-cols-3 gap-3"
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
