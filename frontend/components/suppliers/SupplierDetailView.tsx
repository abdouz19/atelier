'use client';

import { useSupplierDetail } from '@/hooks/useSupplierDetail';
import { SupplierDetailPanel } from './SupplierDetailPanel';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

interface SupplierDetailViewProps {
  id: string;
  onBack: () => void;
}

export function SupplierDetailView({ id, onBack }: SupplierDetailViewProps) {
  const { supplier, loading, error } = useSupplierDetail(id);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" dir="rtl">
        <div className="h-8 w-48 rounded bg-border" />
        <div className="h-4 w-32 rounded bg-border" />
        <div className="mt-4 h-32 rounded-xl bg-border" />
      </div>
    );
  }

  if (error) return <div dir="rtl"><ErrorAlert message={error} /></div>;
  if (!supplier) return <div dir="rtl" className="text-text-muted">المورد غير موجود</div>;

  return <SupplierDetailPanel supplier={supplier} onBack={onBack} />;
}
