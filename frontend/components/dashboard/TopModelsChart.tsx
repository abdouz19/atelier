import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TopModelPoint } from '@/features/dashboard/dashboard.types';

interface Props {
  data: TopModelPoint[];
}

export function TopModelsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">أفضل 5 موديلات (مخزون نهائي)</h2>
        <p className="text-center text-sm text-gray-400 py-8">لا توجد بيانات</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">أفضل 5 موديلات (مخزون نهائي)</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
          <YAxis type="category" dataKey="modelName" tick={{ fontSize: 10 }} width={80} />
          <Tooltip formatter={(v: unknown) => [Number(v).toLocaleString('ar-DZ'), 'قطعة']} />
          <Bar dataKey="pieces" fill="#22c55e" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
