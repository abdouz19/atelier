import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { MonthlyProductionPoint, MonthlyDistributedPoint } from '@/features/dashboard/dashboard.types';

interface ChartRow {
  month: string;
  pieces: number;
  distributed: number;
}

interface Props {
  data: MonthlyProductionPoint[];
  distributedData?: MonthlyDistributedPoint[];
}

function buildChartData(production: MonthlyProductionPoint[], distributed: MonthlyDistributedPoint[]): ChartRow[] {
  const now = new Date();
  const result: ChartRow[] = [];
  const prodMap = new Map(production.map(d => [d.month, d.pieces]));
  const distMap = new Map(distributed.map(d => [d.month, d.distributed]));
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ month: key, pieces: prodMap.get(key) ?? 0, distributed: distMap.get(key) ?? 0 });
  }
  return result;
}

export function MonthlyProductionChart({ data, distributedData = [] }: Props) {
  const filled = buildChartData(data, distributedData);
  const hasData = filled.some(d => d.pieces > 0 || d.distributed > 0);

  if (!hasData) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">الإنتاج والتوزيع الشهري</h2>
        <p className="py-8 text-center text-sm text-gray-400">لا توجد بيانات</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">الإنتاج والتوزيع الشهري (آخر 12 شهر)</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={filled} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => String(v).slice(5)} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip formatter={(v: unknown) => [Number(v).toLocaleString('ar-DZ'), '']} labelFormatter={l => `شهر ${l}`} />
          <Legend formatter={(value) => value === 'pieces' ? 'المنتج' : 'الموزع'} />
          <Bar dataKey="pieces" fill="#3b82f6" radius={[3, 3, 0, 0]} name="pieces" />
          <Bar dataKey="distributed" fill="#10b981" radius={[3, 3, 0, 0]} name="distributed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
