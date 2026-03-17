import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { EmployeeDebtPoint } from '@/features/dashboard/dashboard.types';

interface Props {
  data: EmployeeDebtPoint[];
}

export function EmployeeDebtChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">ديون الموظفين</h2>
        <p className="text-center text-sm text-gray-400 py-8">لا يوجد موظفون بأرصدة مستحقة</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">ديون الموظفين</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v.toLocaleString('ar-DZ')}`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
          <Tooltip formatter={(v: unknown) => [`${Number(v).toLocaleString('ar-DZ')} د.ج`, 'الرصيد']} />
          <Bar dataKey="balance" radius={[0, 3, 3, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#ef4444' : '#f87171'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
