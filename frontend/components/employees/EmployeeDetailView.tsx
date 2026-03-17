'use client';

import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { EmployeeDetailPanel } from './EmployeeDetailPanel';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import type { EmployeeDetail } from '@/features/employees/employees.types';

interface EmployeeDetailViewProps {
  id: string;
  onBack: () => void;
}

export function EmployeeDetailView({ id, onBack }: EmployeeDetailViewProps) {
  const { detail, loading, error, setDetail } = useEmployeeDetail(id);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" dir="rtl">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 rounded-xl bg-gray-200" />
          <div className="h-32 rounded-xl bg-gray-200" />
        </div>
        <div className="h-48 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error) return <div dir="rtl"><ErrorAlert message={error} /></div>;
  if (!detail) return <div dir="rtl" className="text-gray-400">الموظف غير موجود</div>;

  function handleDetailUpdate(updated: EmployeeDetail) {
    setDetail(updated);
  }

  return (
    <EmployeeDetailPanel
      detail={detail}
      onBack={onBack}
      onDetailUpdate={handleDetailUpdate}
    />
  );
}
