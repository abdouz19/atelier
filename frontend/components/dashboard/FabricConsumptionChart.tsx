import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { FabricConsumptionRawPoint, FabricConsumptionPoint } from '@/features/dashboard/dashboard.types';

interface Props { data: FabricConsumptionRawPoint[] }

const COLORS = ['#818cf8', '#fb923c', '#34d399', '#a78bfa', '#fbbf24', '#f87171'];

function pivotData(raw: FabricConsumptionRawPoint[]): { pivoted: FabricConsumptionPoint[]; fabrics: string[] } {
  const fabricSet = new Set<string>();
  const monthMap = new Map<string, FabricConsumptionPoint>();
  for (const row of raw) {
    fabricSet.add(row.fabricName);
    if (!monthMap.has(row.month)) monthMap.set(row.month, { month: row.month });
    monthMap.get(row.month)![row.fabricName] = row.metersConsumed;
  }
  return {
    pivoted: Array.from(monthMap.values()).sort((a, b) => (a.month as string).localeCompare(b.month as string)),
    fabrics: Array.from(fabricSet),
  };
}

type TEntry = { dataKey?: string; value?: number; color?: string };
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-right" dir="rtl"
      style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#334155' }}>شهر {label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: '#64748b' }}>{p.dataKey}</span>
          <span className="font-bold" style={{ color: '#e2e8f0' }}>{Number(p.value)} م</span>
        </div>
      ))}
    </div>
  );
}

export function FabricConsumptionChart({ data }: Props) {
  const { pivoted, fabrics } = pivotData(data);

  return (
    <div className="rounded-2xl border p-5" style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>استهلاك القماش</h2>
        <span className="text-[10px]" style={{ color: '#334155' }}>آخر 6 أشهر</span>
      </div>
      {pivoted.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm" style={{ color: '#334155' }}>لا توجد بيانات استهلاك</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={pivoted} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              {fabrics.map((fabric, i) => (
                <linearGradient key={fabric} id={`fg${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#334155' }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#334155' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <Legend iconType="circle" iconSize={7}
              formatter={(v) => <span style={{ color: '#475569', fontSize: 11 }}>{v}</span>}
            />
            {fabrics.map((fabric, i) => (
              <Area key={fabric} type="monotone" dataKey={fabric}
                stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                fill={`url(#fg${i})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
