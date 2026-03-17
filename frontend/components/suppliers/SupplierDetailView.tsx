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
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="mt-4 h-32 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (error) return <div dir="rtl"><ErrorAlert message={error} /></div>;
  if (!supplier) return <div dir="rtl" className="text-gray-400">المورد غير موجود</div>;

  return <SupplierDetailPanel supplier={supplier} onBack={onBack} />;
}
