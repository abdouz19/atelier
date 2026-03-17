import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { FabricConsumptionRawPoint, FabricConsumptionPoint } from '@/features/dashboard/dashboard.types';

interface Props {
  data: FabricConsumptionRawPoint[];
}

const LINE_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#eab308', '#ef4444'];

function pivotData(raw: FabricConsumptionRawPoint[]): { pivoted: FabricConsumptionPoint[]; fabrics: string[] } {
  const fabricSet = new Set<string>();
  const monthMap = new Map<string, FabricConsumptionPoint>();

  for (const row of raw) {
    fabricSet.add(row.fabricName);
    if (!monthMap.has(row.month)) monthMap.set(row.month, { month: row.month });
    monthMap.get(row.month)![row.fabricName] = row.metersConsumed;
  }

  const pivoted = Array.from(monthMap.values()).sort((a, b) => (a.month as string).localeCompare(b.month as string));
  return { pivoted, fabrics: Array.from(fabricSet) };
}

export function FabricConsumptionChart({ data }: Props) {
  const { pivoted, fabrics } = pivotData(data);

  if (pivoted.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">استهلاك القماش (آخر 6 أشهر)</h2>
        <p className="text-center text-sm text-gray-400 py-8">لا توجد بيانات استهلاك</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">استهلاك القماش (آخر 6 أشهر)</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={pivoted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: unknown) => [`${Number(v)} م`, '']} labelFormatter={l => `شهر ${l}`} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          {fabrics.map((fabric, i) => (
            <Line
              key={fabric}
              type="monotone"
              dataKey={fabric}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
