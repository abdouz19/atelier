'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { OperationsSummaryCard } from './OperationsSummaryCard';
import { OperationsHistory } from './OperationsHistory';
import { PaymentsHistory } from './PaymentsHistory';
import type { EmployeeDetail, OperationType } from '@/features/employees/employees.types';

interface EmployeeDetailPanelProps {
  detail: EmployeeDetail;
  onBack: () => void;
  onDetailUpdate: (detail: EmployeeDetail) => void;
}

export function EmployeeDetailPanel({ detail, onBack, onDetailUpdate }: EmployeeDetailPanelProps) {
  const router = useRouter();
  const isActive = detail.status === 'active';

  function handleNavigate(operationType: OperationType, sourceReferenceId: string) {
    const routes: Partial<Record<OperationType, string>> = {
      cutting: `/cutting?id=${sourceReferenceId}`,
      distribution: `/distribution?id=${sourceReferenceId}`,
      qc: `/qc?id=${sourceReferenceId}`,
      finition: `/qc?id=${sourceReferenceId}`,
    };
    const path = routes[operationType];
    if (path) router.push(path);
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-base"
      >
        <ArrowRight size={16} />
        العودة إلى قائمة الموظفين
      </button>

      {/* Profile section */}
      <div className="flex items-start gap-4 rounded-xl border border-border bg-white p-5">
        {detail.photoPath ? (
          <img src={detail.photoPath} alt={detail.name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-border text-xl font-bold text-text-muted">
            {detail.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-base">{detail.name}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {isActive ? 'نشط' : 'غير نشط'}
            </span>
          </div>
          {detail.role && <p className="mt-0.5 text-sm text-text-muted">{detail.role}</p>}
          {detail.phone && <p className="mt-0.5 text-sm text-text-muted">{detail.phone}</p>}
          {detail.notes && <p className="mt-1 text-sm text-text-muted">{detail.notes}</p>}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FinancialSummaryCard
          totalEarned={detail.totalEarned}
          totalPaid={detail.totalPaid}
          balanceDue={detail.balanceDue}
        />
        <OperationsSummaryCard operationGroups={detail.operationGroups} />
      </div>

      {/* Operations history */}
      <OperationsHistory
        operationGroups={detail.operationGroups}
        employeeId={detail.id}
        onOperationAdded={onDetailUpdate}
        onNavigate={handleNavigate}
      />

      {/* Payments history */}
      <PaymentsHistory
        payments={detail.payments}
        employeeId={detail.id}
        onPaymentMutated={onDetailUpdate}
      />
    </div>
  );
}
