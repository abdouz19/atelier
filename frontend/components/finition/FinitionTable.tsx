'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import type { FinitionRecordSummary } from '@/features/finition/finition.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface FinitionTableProps {
  records: FinitionRecordSummary[];
}

export function FinitionTable({ records }: FinitionTableProps) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = records.filter(
    (r) =>
      r.modelName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.color.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <input
          type="text"
          placeholder="بحث بالموديل أو الموظف أو اللون..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا توجد سجلات تشطيب بعد'} />
      ) : (
        <table className="w-full text-sm" dir="rtl">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">الموديل / المقاس / اللون</th>
              <th className="px-4 py-3 text-right">الموظف</th>
              <th className="px-4 py-3 text-right">الكمية</th>
              <th className="px-4 py-3 text-right">التكلفة</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <React.Fragment key={r.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{new Date(r.finitionDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.modelName} / {r.sizeLabel} / {r.color}</td>
                  <td className="px-4 py-3 text-gray-700">{r.employeeName}</td>
                  <td className="px-4 py-3 text-gray-900">{fmt(r.quantity)}</td>
                  <td className="px-4 py-3 text-gray-700">{fmt(r.totalCost)} دج</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.isReady ? 'جاهز' : 'قيد المعالجة'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.steps.length > 0 && (
                      <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="text-gray-400 hover:text-gray-600">
                        {expandedId === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === r.id && r.steps.map((step) => (
                  <tr key={step.id} className="bg-gray-50/50">
                    <td className="py-2 pr-8 pl-4 text-xs text-gray-500">{new Date(step.stepDate).toLocaleDateString('en-GB')}</td>
                    <td colSpan={2} className="px-4 py-2 text-xs text-gray-700">خطوة {step.stepOrder}: {step.stepName}{step.employeeName ? ` — ${step.employeeName}` : ''}</td>
                    <td className="px-4 py-2 text-xs text-gray-700">{fmt(step.quantity)}</td>
                    <td colSpan={2} className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${step.isReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {step.isReady ? 'جاهز' : 'قيد التنفيذ'}
                      </span>
                    </td>
                    <td />
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
