import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { TopTailorPoint } from '@/features/dashboard/dashboard.types';

interface Props {
  data: TopTailorPoint[];
}

export function TopTailorsChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">أكثر 5 خياطين إعادةً</h2>
        <p className="text-center text-sm text-gray-400 py-8">لا توجد إعادات في هذه الفترة</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">أكثر 5 خياطين إعادةً</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
          <Tooltip formatter={(v: unknown) => [Number(v).toLocaleString('ar-DZ'), 'قطعة مُعادة']} />
          <Bar dataKey="returned" radius={[0, 3, 3, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#ef4444' : '#f97316'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
