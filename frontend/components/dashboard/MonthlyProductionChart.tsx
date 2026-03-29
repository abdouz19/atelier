import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { MonthlyProductionPoint, MonthlyDistributedPoint } from '@/features/dashboard/dashboard.types';

interface ChartRow { month: string; pieces: number; distributed: number }
interface Props { data: MonthlyProductionPoint[]; distributedData?: MonthlyDistributedPoint[] }

function buildChartData(production: MonthlyProductionPoint[], distributed: MonthlyDistributedPoint[]): ChartRow[] {
  const now = new Date();
  const prodMap = new Map(production.map(d => [d.month, d.pieces]));
  const distMap = new Map(distributed.map(d => [d.month, d.distributed]));
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { month: key, pieces: prodMap.get(key) ?? 0, distributed: distMap.get(key) ?? 0 };
  });
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
          <span style={{ color: '#64748b' }}>{p.dataKey === 'pieces' ? 'المنتج' : 'الموزع'}</span>
          <span className="font-bold tabular-nums" style={{ color: '#e2e8f0' }}>{Number(p.value).toLocaleString('ar-DZ')}</span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyProductionChart({ data, distributedData = [] }: Props) {
  const filled = buildChartData(data, distributedData);
  const hasData = filled.some(d => d.pieces > 0 || d.distributed > 0);

  return (
    <div className="rounded-2xl border p-5" style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>الإنتاج والتوزيع الشهري</h2>
        <span className="text-[10px]" style={{ color: '#334155' }}>آخر 12 شهراً</span>
      </div>
      {!hasData ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm" style={{ color: '#334155' }}>لا توجد بيانات</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={filled} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barGap={2}>
            <defs>
              <linearGradient id="bProd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#818cf8" stopOpacity={1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="bDist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#34d399" stopOpacity={1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#334155' }} tickFormatter={v => String(v).slice(5)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#334155' }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend iconType="circle" iconSize={7}
              formatter={v => <span style={{ color: '#475569', fontSize: 11 }}>{v === 'pieces' ? 'المنتج' : 'الموزع'}</span>}
            />
            <Bar dataKey="pieces"      fill="url(#bProd)" radius={[4,4,0,0]} maxBarSize={18} />
            <Bar dataKey="distributed" fill="url(#bDist)" radius={[4,4,0,0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
