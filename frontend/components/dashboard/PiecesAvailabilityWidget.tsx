'use client';

import { useRouter } from 'next/navigation';
import type { CriticalCombination } from '@/features/dashboard/dashboard.types';

interface Props {
  criticalCombinations: CriticalCombination[];
}

export function PiecesAvailabilityWidget({ criticalCombinations }: Props) {
  const router = useRouter();

  if (criticalCombinations.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">أبرز التركيبات الحرجة</h2>
        <p className="py-4 text-center text-sm text-gray-400">لا توجد بيانات</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">أبرز التركيبات الحرجة</h2>
        <button
          onClick={() => router.push('/distribution?tab=availability')}
          className="text-xs text-primary-600 hover:underline"
        >
          عرض الكل
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2 text-right font-medium text-gray-500">النموذج</th>
              <th className="pb-2 text-right font-medium text-gray-500">القطعة</th>
              <th className="pb-2 text-right font-medium text-gray-500">المقاس</th>
              <th className="pb-2 text-right font-medium text-gray-500">اللون</th>
              <th className="pb-2 text-right font-medium text-gray-500">غير موزع</th>
            </tr>
          </thead>
          <tbody>
            {criticalCombinations.map((combo, idx) => (
              <tr
                key={idx}
                onClick={() => router.push('/distribution?tab=availability')}
                className="cursor-pointer border-t border-gray-50 hover:bg-gray-50"
              >
                <td className="py-1.5 pr-1">{combo.modelName}</td>
                <td className="py-1.5">{combo.partName ?? '—'}</td>
                <td className="py-1.5">{combo.sizeLabel}</td>
                <td className="py-1.5">{combo.color}</td>
                <td className="py-1.5 font-medium">
                  <span className={combo.notDistributed === 0 ? 'text-red-600' : 'text-amber-600'}>
                    {combo.notDistributed}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
