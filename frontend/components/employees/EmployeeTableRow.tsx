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
  const balanceColor = employee.balanceDue < 0 ? 'text-red-400' : 'text-text-base';

  return (
    <tr
      className="cursor-pointer transition-colors odd:bg-surface even:bg-base/30 hover:bg-white/3"
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
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-border text-sm font-semibold text-text-muted">
            {employee.name.charAt(0)}
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-medium text-text-base">{employee.name}</td>
      <td className="px-4 py-3 text-text-muted">{employee.role ?? '—'}</td>
      <td className="px-4 py-3 text-text-muted">{employee.phone ?? '—'}</td>
      <td className={`px-4 py-3 font-medium ${balanceColor}`}>
        {employee.balanceDue.toLocaleString('en-US')} دج
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={isActive
            ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
            : { background: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}
        >
          {isActive ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(employee)}
            className="rounded p-1.5 text-text-muted hover:bg-base hover:text-text-base"
            title="تعديل"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onSetStatus(employee)}
            className="rounded p-1.5 text-text-muted hover:bg-base hover:text-text-base"
            title={isActive ? 'تعطيل' : 'تفعيل'}
          >
            {isActive ? <UserX size={15} /> : <UserCheck size={15} />}
          </button>
        </div>
      </td>
    </tr>
  );
}
