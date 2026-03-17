'use client';

import { useState } from 'react';
import { EmployeeTableRow } from './EmployeeTableRow';
import { EmptyState } from '@/components/shared/EmptyState';
import type { EmployeeSummary } from '@/features/employees/employees.types';

interface EmployeeTableProps {
  employees: EmployeeSummary[];
  onRowClick: (id: string) => void;
  onEdit: (employee: EmployeeSummary) => void;
  onSetStatus: (employee: EmployeeSummary) => void;
}

export function EmployeeTable({ employees, onRowClick, onEdit, onSetStatus }: EmployeeTableProps) {
  const [search, setSearch] = useState('');

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.role ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <input
          type="text"
          placeholder="بحث بالاسم أو الدور..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا يوجد موظفون بعد'} />
      ) : (
        <table className="w-full text-sm" dir="rtl">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-right">الصورة</th>
              <th className="px-4 py-3 text-right">الاسم</th>
              <th className="px-4 py-3 text-right">الدور</th>
              <th className="px-4 py-3 text-right">الهاتف</th>
              <th className="px-4 py-3 text-right">الرصيد المستحق</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((employee) => (
              <EmployeeTableRow
                key={employee.id}
                employee={employee}
                onClick={() => onRowClick(employee.id)}
                onEdit={onEdit}
                onSetStatus={onSetStatus}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
