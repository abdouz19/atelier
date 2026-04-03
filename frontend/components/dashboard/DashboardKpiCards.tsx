import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import {
  Users, Package, Scissors, Truck, Search,
  CheckCircle, Wrench, Archive, CreditCard, ShoppingCart,
  AlertTriangle, TrendingDown, ArrowUpLeft,
} from 'lucide-react';
import type { DashboardSnapshotKpis, DashboardPeriodKpis } from '@/features/dashboard/dashboard.types';

interface Props {
  snapshotKpis: DashboardSnapshotKpis;
  periodKpis: DashboardPeriodKpis;
}

type ColorKey = 'blue' | 'emerald' | 'orange' | 'red' | 'violet' | 'amber' | 'slate' | 'indigo';

interface KpiDef {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: ColorKey;
  onClick?: () => void;
  description?: string;
}

const C: Record<ColorKey, { value: string; iconText: string; iconBg: string; glow: string; accent: string }> = {
  blue:    { value: '#60a5fa', iconText: '#60a5fa', iconBg: 'rgba(59,130,246,0.12)',   glow: 'rgba(59,130,246,0.15)',   accent: '#3b82f6' },
  emerald: { value: '#34d399', iconText: '#34d399', iconBg: 'rgba(16,185,129,0.12)',  glow: 'rgba(16,185,129,0.15)',  accent: '#10b981' },
  orange:  { value: '#fb923c', iconText: '#fb923c', iconBg: 'rgba(249,115,22,0.12)',   glow: 'rgba(249,115,22,0.15)',   accent: '#f97316' },
  red:     { value: '#f87171', iconText: '#f87171', iconBg: 'rgba(239,68,68,0.12)',    glow: 'rgba(239,68,68,0.18)',    accent: '#ef4444' },
  violet:  { value: '#a78bfa', iconText: '#a78bfa', iconBg: 'rgba(139,92,246,0.12)',   glow: 'rgba(139,92,246,0.15)',   accent: '#8b5cf6' },
  amber:   { value: '#fbbf24', iconText: '#fbbf24', iconBg: 'rgba(245,158,11,0.12)',   glow: 'rgba(245,158,11,0.15)',   accent: '#f59e0b' },
  slate:   { value: '#94a3b8', iconText: '#94a3b8', iconBg: 'rgba(100,116,139,0.12)',  glow: 'rgba(100,116,139,0.12)',  accent: '#64748b' },
  indigo:  { value: '#818cf8', iconText: '#818cf8', iconBg: 'rgba(99,102,241,0.12)',   glow: 'rgba(99,102,241,0.15)',   accent: '#6366f1' },
};

function KpiCard({ label, value, icon: Icon, color, onClick, description }: KpiDef) {
  const c = C[color];
  const clickable = !!onClick;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.015 }}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200"
      style={{
        background: '#0d1422',
        borderColor: 'rgba(255,255,255,0.07)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
        cursor: clickable ? 'pointer' : 'default',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${c.accent}30`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`, opacity: 0.8 }}
      />
      <div
        className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${c.glow}, transparent 70%)` }}
      />

      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: '#475569' }}>
          {label}
        </p>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
          style={{ background: c.iconBg, boxShadow: `0 0 12px ${c.glow}` }}
        >
          <Icon size={16} style={{ color: c.iconText }} />
        </div>
      </div>

      <p className="text-[28px] font-bold tabular-nums leading-none tracking-tight" style={{ color: c.value }}>
        {value}
      </p>

      {description && (
        <p className="mt-1.5 text-[11px]" style={{ color: '#334155' }}>{description}</p>
      )}

      {clickable && (
        <div
          className="mt-3 flex items-center gap-1 text-[11px] font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ color: c.value }}
        >
          <ArrowUpLeft size={11} />
          <span>عرض التفاصيل</span>
        </div>
      )}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#1e293b' }}>
      {children}
    </p>
  );
}

export function DashboardKpiCards({ snapshotKpis, periodKpis }: Props) {
  const router = useRouter();

  const fabricCards: KpiDef[] = snapshotKpis.fabricItems.map(fabric => ({
    label: fabric.name,
    value: `${fabric.availableMeters.toLocaleString('ar-DZ')} م`,
    icon: Package,
    color: 'indigo' as ColorKey,
    description: 'متر متاح',
  }));

  const productionCards: KpiDef[] = [
    { label: 'قطع غير موزعة',    value: snapshotKpis.piecesNotDistributed.toLocaleString('ar-DZ'),          icon: Scissors,    color: 'slate'   },
    { label: 'في التوزيع',        value: snapshotKpis.piecesInDistribution.toLocaleString('ar-DZ'),          icon: Truck,       color: 'orange'  },
    { label: 'انتظار المراقبة',   value: snapshotKpis.piecesAwaitingQc.toLocaleString('ar-DZ'),              icon: Search,      color: 'violet'  },
    { label: 'انتظار التشطيب',   value: snapshotKpis.piecesAwaitingFinition.toLocaleString('ar-DZ'),         icon: CheckCircle, color: 'blue'    },
    { label: 'في التشطيب',        value: snapshotKpis.piecesInFinition.toLocaleString('ar-DZ'),              icon: Wrench,      color: 'amber'   },
    { label: 'المخزون النهائي',   value: snapshotKpis.piecesInFinalStock.toLocaleString('ar-DZ'),            icon: Archive,     color: 'emerald' },
    { label: 'خياطون نشطون',      value: snapshotKpis.activeTailorsWithPendingDistributions.toLocaleString('ar-DZ'), icon: Users, color: 'blue' },
  ];

  const alertCards: KpiDef[] = [
    { label: 'مخزون صفري',        value: snapshotKpis.zeroStockNonFabricCount.toLocaleString('ar-DZ'),      icon: AlertTriangle, color: 'red',   onClick: () => router.push('/stock?zeroStock=1')               },
    { label: 'بدون مخزون',        value: snapshotKpis.zeroStockCombosCount.toLocaleString('ar-DZ'),         icon: TrendingDown,  color: 'red',   onClick: () => router.push('/distribution?tab=availability') },
    { label: 'مخزون منخفض',       value: snapshotKpis.lowStockCombosCount.toLocaleString('ar-DZ'),          icon: AlertTriangle, color: 'amber', onClick: () => router.push('/distribution?tab=availability') },
  ];

  const financialCards: KpiDef[] = [
    { label: 'ديون الموظفين',     value: `${periodKpis.totalEmployeeDebt.toLocaleString('ar-DZ')} د.ج`,    icon: CreditCard,   color: 'red',     onClick: () => router.push('/employees')  },
    { label: 'مشتريات الفترة',    value: `${periodKpis.totalPurchases.toLocaleString('ar-DZ')} د.ج`,       icon: ShoppingCart, color: 'emerald', onClick: () => router.push('/suppliers')  },
  ];

  return (
    <div className="space-y-6">
      {fabricCards.length > 0 && (
        <div>
          <SubLabel>المخزون الخام</SubLabel>
          <motion.div variants={containerVariants} initial="hidden" animate="visible"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fabricCards.map(c => <motion.div key={c.label} variants={itemVariants}><KpiCard {...c} /></motion.div>)}
          </motion.div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SubLabel>تنبيهات المخزون</SubLabel>
          <motion.div variants={containerVariants} initial="hidden" animate="visible"
            className="grid grid-cols-3 gap-3">
            {alertCards.map(c => <motion.div key={c.label} variants={itemVariants}><KpiCard {...c} /></motion.div>)}
          </motion.div>
        </div>
        <div className="lg:col-span-2">
          <SubLabel>المالية</SubLabel>
          <motion.div variants={containerVariants} initial="hidden" animate="visible"
            className="grid grid-cols-2 gap-3">
            {financialCards.map(c => <motion.div key={c.label} variants={itemVariants}><KpiCard {...c} /></motion.div>)}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
