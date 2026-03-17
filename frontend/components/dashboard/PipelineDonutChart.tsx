import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PipelineStage } from '@/features/dashboard/dashboard.types';

interface Props {
  stages: PipelineStage[];
}

const COLORS = ['#6b7280', '#f97316', '#eab308', '#3b82f6', '#a855f7', '#22c55e'];

export function PipelineDonutChart({ stages }: Props) {
  const total = stages.reduce((s, st) => s + st.count, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">توزيع خط الإنتاج</h2>
        <p className="text-center text-sm text-gray-400 py-8">لا توجد قطع في الإنتاج</p>
      </div>
    );
  }

  const chartData = stages.filter(s => s.count > 0).map(s => ({
    name: s.label,
    value: s.count,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">توزيع خط الإنتاج</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: unknown) => [Number(v).toLocaleString('ar-DZ'), 'قطعة']} />
          <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
