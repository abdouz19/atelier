'use client';

import { Pencil, UserCheck, UserX } from 'lucide-react';
import type { EmployeeSummary } from '@/features/employees/employees.types';

interface EmployeeTableRowProps {
  employee: EmployeeSummary;
  onClick: () => void;
  onEdit: (employee: EmployeeSummary) => void;
  onSetStatus: (employee: EmployeeSummary) => void;
}

export function EmployeeTableRow({ employee, onClick, onEdit, onSetStatus }: EmployeeTableRowProps) {
  const isActive = employee.status === 'active';
  const balanceColor = employee.balanceDue < 0 ? 'text-red-600' : 'text-gray-900';

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-gray-50"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        {employee.photoPath ? (
          <img
            src={employee.photoPath}
            alt={employee.name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-500">
            {employee.name.charAt(0)}
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">{employee.name}</td>
      <td className="px-4 py-3 text-gray-600">{employee.role ?? '—'}</td>
      <td className="px-4 py-3 text-gray-600">{employee.phone ?? '—'}</td>
      <td className={`px-4 py-3 font-medium ${balanceColor}`}>
        {employee.balanceDue.toLocaleString('en-US')} دج
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isActive ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(employee)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="تعديل"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onSetStatus(employee)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title={isActive ? 'تعطيل' : 'تفعيل'}
          >
            {isActive ? <UserX size={15} /> : <UserCheck size={15} />}
          </button>
        </div>
      </td>
    </tr>
  );
}
