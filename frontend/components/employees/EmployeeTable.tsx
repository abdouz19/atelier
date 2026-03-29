'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
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
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* blue accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)', opacity: 0.7 }} />

      {/* search */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--divider)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--cell-dim)' }} />
          <input
            type="text"
            placeholder="بحث بالاسم أو الدور..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border py-1.5 pr-8 pl-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--cell-text)' }}
            dir="rtl"
          />
        </div>
        {employees.length > 0 && (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
            {filtered.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={search ? 'لا توجد نتائج مطابقة' : 'لا يوجد موظفون بعد'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
              <tr>
                {['الصورة', 'الاسم', 'الدور', 'الهاتف', 'الرصيد المستحق', 'الحالة', 'إجراءات'].map((h) => (
                  <th key={h} className="px-4 py-3 text-right" style={{ color: 'var(--cell-faint)', borderBottom: '1px solid var(--table-head-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
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
        </div>
      )}
    </div>
  );
}
