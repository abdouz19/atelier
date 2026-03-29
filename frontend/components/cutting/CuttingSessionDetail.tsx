'use client';

import { ArrowRight, Users, Package, Beaker } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCuttingDetail } from '@/hooks/useCuttingDetail';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import type { CuttingSessionDetail as DetailType } from '@/features/cutting/cutting.types';

interface CuttingSessionDetailProps {
  id: string;
  onBack: () => void;
}

const cardStyle = {
  background: 'var(--card-bg)',
  borderColor: 'var(--card-border)',
  boxShadow: 'var(--card-shadow)',
};

const itemVariant = { hidden: { opacity: 0, y: 10, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } } };

function SectionCard({ icon: Icon, title, accent, children }: { icon: React.ElementType; title: string; accent: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={itemVariant}
      className="relative overflow-hidden rounded-2xl border"
      style={cardStyle}
    >
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.7 }} />
      <div className="relative flex items-center gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--divider)' }}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}1a`, boxShadow: `0 0 10px ${accent}25` }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <span className="font-semibold text-sm" style={{ color: 'var(--cell-text)' }}>{title}</span>
      </div>
      <div className="relative px-5 py-4">{children}</div>
    </motion.div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border px-3 py-2.5" style={{ background: `${color}0d`, borderColor: `${color}22` }}>
      <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cell-dim)' }}>{label}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function DetailView({ detail }: { detail: DetailType }) {
  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      initial="hidden" animate="visible"
      className="space-y-4"
      dir="rtl"
    >
      {/* Overview stats row */}
      <motion.div variants={itemVariant} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="التاريخ" value={new Date(detail.sessionDate).toLocaleDateString('en-GB')} color="#60a5fa" />
        <StatPill label="الأمتار" value={`${detail.metersUsed} م`} color="#fb923c" />
        <StatPill label="الطبقات" value={String(detail.layers)} color="#a78bfa" />
        <StatPill label="سعر الطبقة" value={`${detail.pricePerLayer.toLocaleString('en-US')} دج`} color="#34d399" />
      </motion.div>

      {/* Main info card */}
      <motion.div variants={itemVariant} className="relative overflow-hidden rounded-2xl border" style={cardStyle}>
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', opacity: 0.7 }} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--cell-faint)' }}>القماش</span>
            <span className="font-medium" style={{ color: 'var(--cell-text)' }}>{detail.fabricName}</span>
            {detail.fabricColor && (
              <span className="mr-2 rounded-full px-2 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                {detail.fabricColor}
              </span>
            )}
          </div>
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--cell-faint)' }}>الموديل</span>
            <span className="font-medium" style={{ color: 'var(--cell-text)' }}>{detail.modelName}</span>
          </div>
          {detail.sizeLabel && (
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--cell-faint)' }}>المقاس</span>
              <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: 'rgba(96,165,250,0.10)', color: '#60a5fa' }}>{detail.sizeLabel}</span>
            </div>
          )}
          {detail.notes && (
            <div className="col-span-full">
              <span className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--cell-faint)' }}>ملاحظات</span>
              <span style={{ color: 'var(--text-muted)' }}>{detail.notes}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Employees */}
      <SectionCard icon={Users} title="الموظفون" accent="#60a5fa">
        <div className="divide-y divide-border/50">
          {detail.employees.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                  {e.name.charAt(0)}
                </div>
                <span className="text-sm" style={{ color: 'var(--cell-text)' }}>{e.name}</span>
              </div>
              <span className="font-semibold tabular-nums text-sm" style={{ color: '#34d399' }}>
                {e.earnings.toLocaleString('en-US')} <span className="text-xs font-normal" style={{ color: 'var(--cell-dim)' }}>دج</span>
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Parts produced */}
      <SectionCard icon={Package} title="الأجزاء المنتجة" accent="#a78bfa">
        {detail.parts.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--cell-dim)' }}>لا توجد أجزاء مسجلة (جلسة قديمة)</p>
        ) : (
          <div className="divide-y divide-border/50">
            <div className="grid grid-cols-2 pb-2">
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cell-faint)' }}>الجزء</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-left" style={{ color: 'var(--cell-faint)' }}>العدد</span>
            </div>
            {detail.parts.map((p) => (
              <div key={p.partName} className="grid grid-cols-2 py-2.5">
                <span className="text-sm" style={{ color: 'var(--cell-text)' }}>{p.partName}</span>
                <span className="text-left">
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
                    {p.count}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Consumed materials */}
      {detail.consumptionEntries.length > 0 && (
        <SectionCard icon={Beaker} title="المواد المستهلكة" accent="#fb923c">
          <div className="divide-y divide-border/50">
            {detail.consumptionEntries.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <span className="text-sm" style={{ color: 'var(--cell-text)' }}>
                  {c.stockItemName}
                  {c.color && <span className="mr-2 text-xs" style={{ color: 'var(--cell-muted)' }}>{c.color}</span>}
                </span>
                <span className="font-semibold tabular-nums text-sm" style={{ color: '#fb923c' }}>{c.quantity}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </motion.div>
  );
}

export function CuttingSessionDetail({ id, onBack }: CuttingSessionDetailProps) {
  const { detail, loading, error } = useCuttingDetail(id);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" dir="rtl">
        <div className="grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-2xl" style={{ background: 'var(--accent-bar-bg)' }} />)}
        </div>
        <div className="h-28 rounded-2xl" style={{ background: 'var(--accent-bar-bg)' }} />
        <div className="h-24 rounded-2xl" style={{ background: 'var(--accent-bar-bg)' }} />
      </div>
    );
  }
  if (error) return <div dir="rtl"><ErrorAlert message={error} /></div>;
  if (!detail) return <div dir="rtl" className="text-text-muted">الجلسة غير موجودة</div>;

  return (
    <div dir="rtl" className="space-y-5">
      <button
        onClick={onBack}
        className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors"
        style={{ color: 'var(--cell-muted)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <ArrowRight size={15} />
        العودة إلى القص
      </button>
      <DetailView detail={detail} />
    </div>
  );
}
