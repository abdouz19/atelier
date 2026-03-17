'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AddOperationModal } from './AddOperationModal';
import { EmptyState } from '@/components/shared/EmptyState';
import type { OperationGroup, OperationType, EmployeeDetail } from '@/features/employees/employees.types';

const TYPE_LABELS: Record<OperationType, string> = {
  cutting: 'قص',
  distribution: 'توزيع',
  qc: 'مراقبة الجودة',
  finition: 'تشطيب',
  custom: 'خطوة مخصصة',
};

interface OperationsHistoryProps {
  operationGroups: OperationGroup[];
  employeeId: string;
  onOperationAdded: (detail: EmployeeDetail) => void;
  onNavigate?: (operationType: OperationType, sourceReferenceId: string) => void;
}

export function OperationsHistory({ operationGroups, employeeId, onOperationAdded, onNavigate }: OperationsHistoryProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">سجل العمليات</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          <Plus size={15} />
          إضافة عملية
        </button>
      </div>

      {operationGroups.length === 0 ? (
        <EmptyState message="لا توجد عمليات بعد" />
      ) : (
        <div className="space-y-4">
          {operationGroups.map((group) => (
            <div key={group.type} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
                <span className="text-sm font-semibold text-gray-700">{TYPE_LABELS[group.type]}</span>
                <span className="text-sm font-medium text-blue-700">
                  الإجمالي: {group.subtotal.toLocaleString('en-US')} دج
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-right">التاريخ</th>
                    <th className="px-4 py-2 text-right">الموديل / اللون</th>
                    <th className="px-4 py-2 text-right">الكمية</th>
                    <th className="px-4 py-2 text-right">سعر الوحدة</th>
                    <th className="px-4 py-2 text-right">الإجمالي</th>
                    <th className="px-4 py-2 text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {group.operations.map((op) => {
                    const canNavigate = onNavigate && op.sourceReferenceId && op.operationType !== 'custom';
                    return (
                      <tr
                        key={op.id}
                        className={`hover:bg-gray-50 ${canNavigate ? 'cursor-pointer' : ''}`}
                        onClick={canNavigate ? () => onNavigate!(op.operationType, op.sourceReferenceId!) : undefined}
                      >
                        <td className="px-4 py-2 text-gray-600">
                          {new Date(op.operationDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-2 text-gray-700">
                          {op.modelName ?? '—'}{op.color ? ` / ${op.color}` : ''}
                        </td>
                        <td className="px-4 py-2 text-gray-900">{op.quantity}</td>
                        <td className="px-4 py-2 text-gray-900">{op.pricePerUnit.toLocaleString('en-US')} دج</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{op.totalAmount.toLocaleString('en-US')} دج</td>
                        <td className="px-4 py-2 text-gray-500">{op.notes ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddOperationModal
          employeeId={employeeId}
          onClose={() => setShowAdd(false)}
          onSuccess={(detail) => { setShowAdd(false); onOperationAdded(detail); }}
        />
      )}
    </div>
  );
}
