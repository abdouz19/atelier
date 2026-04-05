import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { AvgCostPoint } from '@/features/dashboard/dashboard.types';

interface Props { data: AvgCostPoint[] }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) {
  if (!active || !payload?.[0]) return null;
  const d = (payload[0] as { payload?: AvgCostPoint }).payload;
  return (
    <div className="rounded-xl px-3 py-2.5 text-right" dir="rtl"
      style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
        متوسط التكلفة: <span className="font-bold" style={{ color: '#fbbf24' }}>{d?.avgCost?.toFixed(2) ?? '—'} دج</span>
      </p>
      <p className="text-xs" style={{ color: '#475569' }}>{d?.totalPieces ?? 0} قطعة في المخزون</p>
    </div>
  );
}

const BAR_COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', '#451a03'];

export function PipelineDonutChart({ data }: Props) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>متوسط تكلفة الإنتاج</h2>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
          دج / قطعة
        </span>
      </div>
      {data.length === 0 ? (
        <div className="flex h-44 items-center justify-center">
          <p className="text-sm" style={{ color: '#334155' }}>لا توجد بيانات تكلفة في هذه الفترة</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <defs>
              {data.map((_, i) => (
                <linearGradient key={i} id={`costGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={BAR_COLORS[i % BAR_COLORS.length]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={BAR_COLORS[i % BAR_COLORS.length]} stopOpacity={0.3} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tickFormatter={v => `${v}`} tick={{ fontSize: 9, fill: '#334155' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="modelName" tick={{ fontSize: 10, fill: '#475569' }} width={72} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="avgCost" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((_, i) => <Cell key={i} fill={`url(#costGrad${i})`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
