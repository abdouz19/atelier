import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { EmployeeDebtPoint } from '@/features/dashboard/dashboard.types';

interface Props { data: EmployeeDebtPoint[] }

type TEntry = { value?: number };
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TEntry[]; label?: string }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-right" dir="rtl"
      style={{ background: '#131b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{label}</p>
      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
        الرصيد: <span className="font-bold" style={{ color: '#f87171' }}>{Number(payload[0].value).toLocaleString('ar-DZ')} د.ج</span>
      </p>
    </div>
  );
}

export function EmployeeDebtChart({ data }: Props) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: '#0d1422', borderColor: 'rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>ديون الموظفين</h2>
        {data.length > 0 && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
            {data.length} موظف
          </span>
        )}
      </div>
      {data.length === 0 ? (
        <div className="flex h-44 items-center justify-center">
          <p className="text-sm" style={{ color: '#334155' }}>لا يوجد موظفون بأرصدة مستحقة</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="debtG" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#ef4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9, fill: '#334155' }}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} width={72} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="balance" fill="url(#debtG)" radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
