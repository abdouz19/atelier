import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { PipelineStage } from '@/features/dashboard/dashboard.types';

interface Props { stages: PipelineStage[] }

const STAGE_COLORS = [
  { accent: '#64748b', glow: 'rgba(100,116,139,0.25)', badge: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  { accent: '#f97316', glow: 'rgba(249,115,22,0.25)',  badge: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  { accent: '#f59e0b', glow: 'rgba(245,158,11,0.25)',  badge: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  { accent: '#6366f1', glow: 'rgba(99,102,241,0.25)',  badge: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  { accent: '#8b5cf6', glow: 'rgba(139,92,246,0.25)',  badge: 'rgba(139,92,246,0.12)',  text: '#a78bfa' },
  { accent: '#10b981', glow: 'rgba(16,185,129,0.25)',  badge: 'rgba(16,185,129,0.12)',  text: '#34d399' },
];

export function PipelineWidget({ stages }: Props) {
  const router = useRouter();
  const total = stages.reduce((s, st) => s + st.count, 0);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>خط الإنتاج</h2>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#64748b' }}>
            {total.toLocaleString('ar-DZ')} قطعة
          </span>
        </div>
      </div>

      <div className="flex items-stretch gap-1.5">
        {stages.map((stage, i) => {
          const sc = STAGE_COLORS[i % STAGE_COLORS.length];
          const pct = total > 0 ? (stage.count / total) * 100 : 0;
          const isLast = i === stages.length - 1;

          return (
            <div key={stage.label} className="flex flex-1 items-center gap-1.5">
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(stage.href)}
                className="flex flex-1 flex-col gap-3 rounded-xl p-3 text-right transition-all duration-200"
                style={{
                  background: sc.badge,
                  border: `1px solid ${sc.accent}22`,
                  boxShadow: `inset 0 1px 0 ${sc.accent}18`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 1px 0 ${sc.accent}30, 0 0 16px ${sc.glow}`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${sc.accent}44`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 1px 0 ${sc.accent}18`;
                  (e.currentTarget as HTMLElement).style.borderColor = `${sc.accent}22`;
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold tabular-nums leading-none" style={{ color: sc.text }}>
                    {stage.count.toLocaleString('ar-DZ')}
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{ background: `${sc.accent}22`, color: sc.text }}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>

                <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="h-full rounded-full"
                    style={{ background: sc.accent, boxShadow: `0 0 8px ${sc.glow}` }}
                  />
                </div>

                <p className="text-[11px] font-medium leading-tight" style={{ color: '#475569' }}>
                  {stage.label}
                </p>
              </motion.button>

              {!isLast && (
                <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
                  <path d="M1 5h7M5 1l4 4-4 4" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
