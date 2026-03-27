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
        <div className="h-4 w-32 rounded bg-border" />
        <div className="h-24 rounded-xl bg-border" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 rounded-xl bg-border" />
          <div className="h-32 rounded-xl bg-border" />
        </div>
        <div className="h-48 rounded-xl bg-border" />
      </div>
    );
  }

  if (error) return <div dir="rtl"><ErrorAlert message={error} /></div>;
  if (!detail) return <div dir="rtl" className="text-text-muted">الموظف غير موجود</div>;

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
