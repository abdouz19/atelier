'use client';

import type { OperationGroup, OperationType } from '@/features/employees/employees.types';

const TYPE_LABELS: Record<OperationType, string> = {
  cutting: 'قص',
  distribution: 'توزيع',
  qc: 'مراقبة الجودة',
  finition: 'تشطيب',
  custom: 'خطوة مخصصة',
};

interface OperationsSummaryCardProps {
  operationGroups: OperationGroup[];
}

export function OperationsSummaryCard({ operationGroups }: OperationsSummaryCardProps) {
  if (operationGroups.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-500">ملخص العمليات</h3>
        <p className="text-sm text-gray-400">لا توجد عمليات بعد</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-500">ملخص العمليات</h3>
      <div className="space-y-2">
        {operationGroups.map((group) => (
          <div key={group.type} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">{TYPE_LABELS[group.type]}</p>
              <p className="text-xs text-gray-400">{group.count} عملية</p>
            </div>
            <span className="text-sm font-semibold text-blue-700">
              {group.subtotal.toLocaleString('en-US')} دج
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
