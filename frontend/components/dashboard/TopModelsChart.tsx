import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { QcRejectionPoint } from '@/features/dashboard/dashboard.types';

interface Props { data: QcRejectionPoint[] }

type TEntry = { value?: number };
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TEntry[]; label?: string }) {
  if (!active || !payload?.[0]) return null;
  const entry = payload[0] as unknown as { payload: QcRejectionPoint };
  const d = (entry as unknown as { payload?: QcRejectionPoint }).payload;
  return (
    <div className="rounded-xl px-3 py-2.5 text-right" dir="rtl"
      style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
        نسبة الرفض: <span className="font-bold" style={{ color: '#f87171' }}>{d?.rejectionRate ?? 0}%</span>
      </p>
      <p className="text-xs" style={{ color: '#475569' }}>
        {d?.totalRejected ?? 0} مرفوض / {d?.totalChecked ?? 0} مفحوص
      </p>
    </div>
  );
}

export function TopModelsChart({ data }: Props) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>نسبة الرفض في QC</h2>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
          حسب الموديل
        </span>
      </div>
      {data.length === 0 ? (
        <div className="flex h-44 items-center justify-center">
          <p className="text-sm" style={{ color: '#334155' }}>لا توجد سجلات مراقبة في هذه الفترة</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="qcRejGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 9, fill: '#334155' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="modelName" tick={{ fontSize: 10, fill: '#475569' }} width={72} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="rejectionRate" radius={[0, 4, 4, 0]} maxBarSize={18} fill="url(#qcRejGrad)">
              {data.map((d, i) => (
                <Cell key={i} fill={d.rejectionRate > 20 ? '#ef4444' : d.rejectionRate > 10 ? '#f97316' : '#f59e0b'}
                  fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
