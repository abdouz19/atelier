import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PipelineStage } from '@/features/dashboard/dashboard.types';

interface Props { stages: PipelineStage[] }

const COLORS = ['#64748b', '#f97316', '#f59e0b', '#6366f1', '#8b5cf6', '#10b981'];

type TEntry = { name?: string; value?: number };
function CustomTooltip({ active, payload }: { active?: boolean; payload?: TEntry[] }) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl px-3 py-2 text-right" dir="rtl"
      style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{p.name}</p>
      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{Number(p.value).toLocaleString('ar-DZ')} قطعة</p>
    </div>
  );
}

export function PipelineDonutChart({ stages }: Props) {
  const total = stages.reduce((s, st) => s + st.count, 0);
  const chartData = stages.filter(s => s.count > 0).map(s => ({ name: s.label, value: s.count }));

  return (
    <div className="rounded-2xl border p-5" style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>توزيع خط الإنتاج</h2>
        {total > 0 && <span className="text-[10px] tabular-nums" style={{ color: '#334155' }}>{total.toLocaleString('ar-DZ')} قطعة</span>}
      </div>
      {total === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm" style={{ color: '#334155' }}>لا توجد قطع في الإنتاج</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={chartData} dataKey="value" cx="50%" cy="50%"
                  innerRadius={46} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-lg font-bold tabular-nums leading-none" style={{ color: '#e2e8f0' }}>{total}</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#334155' }}>قطعة</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-1 flex-col gap-2">
            {chartData.map((entry, i) => {
              const pct = Math.round((entry.value / total) * 100);
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length], boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}80` }} />
                  <span className="flex-1 truncate text-[11px]" style={{ color: '#475569' }}>{entry.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: '#cbd5e1' }}>{entry.value}</span>
                    <span className="text-[10px]" style={{ color: '#334155' }}>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
