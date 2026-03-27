'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState';
import type { QcRecordSummary } from '@/features/qc/qc.types';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

interface QcTableProps {
  records: QcRecordSummary[];
}

export function QcTable({ records }: QcTableProps) {
  const [search, setSearch] = useState('');
  const filtered = records.filter(
    (r) =>
      r.tailorName.toLowerCase().includes(search.toLowerCase()) ||
      r.modelName.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <input
          type="text"
          placeholder="بحث بالخياط أو الموديل أو الموظف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border px-3 py-1.5 text-sm text-text-base focus:border-primary-500 focus:outline-none"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا توجد سجلات مراقبة جودة بعد'} />
      ) : (
        <table className="w-full text-sm" dir="rtl">
          <thead className="sticky top-0 z-10 bg-base/60 text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">الخياط</th>
              <th className="px-4 py-3 text-right">الموديل / المقاس / اللون</th>
              <th className="px-4 py-3 text-right">الموظف</th>
              <th className="px-4 py-3 text-right">المراجعة</th>
              <th className="px-4 py-3 text-right">تالف</th>
              <th className="px-4 py-3 text-right">مقبول</th>
              <th className="px-4 py-3 text-right">جيد</th>
              <th className="px-4 py-3 text-right">جيد جداً</th>
              <th className="px-4 py-3 text-right">التكلفة</th>
              <th className="px-4 py-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id} className="odd:bg-surface even:bg-base/30 hover:bg-primary-50">
                <td className="px-4 py-3 text-text-base">{new Date(r.reviewDate).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3 font-medium text-text-base">{r.tailorName}</td>
                <td className="px-4 py-3 text-text-base">{r.modelName} / {r.sizeLabel} / {r.color}</td>
                <td className="px-4 py-3 text-text-base">{r.employeeName}</td>
                <td className="px-4 py-3 text-text-base">{fmt(r.quantityReviewed)}</td>
                <td className="px-4 py-3 text-red-600">{fmt(r.qtyDamaged)}</td>
                <td className="px-4 py-3 text-yellow-600">{fmt(r.qtyAcceptable)}</td>
                <td className="px-4 py-3 text-blue-600">{fmt(r.qtyGood)}</td>
                <td className="px-4 py-3 text-green-600">{fmt(r.qtyVeryGood)}</td>
                <td className="px-4 py-3 text-text-base">{fmt(r.totalCost)} دج</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.batchStatus === 'مكتمل' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.batchStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
