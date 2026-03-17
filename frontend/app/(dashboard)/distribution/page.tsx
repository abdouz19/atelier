'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDistributionList } from '@/hooks/useDistributionList';
import { DistributionKpiCards } from '@/components/distribution/DistributionKpiCards';
import { DistributionSummaryTable } from '@/components/distribution/DistributionSummaryTable';
import { DistributionTailorDetail } from '@/components/distribution/DistributionTailorDetail';
import { DistributeModal } from '@/components/distribution/DistributeModal';
import { ReturnModal } from '@/components/distribution/ReturnModal';
import { PiecesAvailabilityTab } from '@/components/distribution/PiecesAvailabilityTab';
import { Toast } from '@/components/shared/Toast';
import type { DistributionTailorSummary } from '@/features/distribution/distribution.types';

function DistributionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTailorId = searchParams.get('tailorId') ?? '';
  const activeTab = searchParams.get('tab') ?? 'distribution';

  const { kpis, summary, loading, error, refetch } = useDistributionList();
  const [showDistribute, setShowDistribute] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/distribution?${params.toString()}`);
  }

  function switchTab(tab: string) {
    const params = new URLSearchParams();
    if (tab !== 'distribution') params.set('tab', tab);
    router.replace(`/distribution?${params.toString()}`);
  }

  function handleDistributeSuccess(_summary: DistributionTailorSummary) {
    setShowDistribute(false);
    setToast({ message: 'تم التوزيع بنجاح', type: 'success' });
    refetch();
  }

  function handleReturnSuccess(_summary: DistributionTailorSummary) {
    setShowReturn(false);
    setToast({ message: 'تم تسجيل الارتجاع بنجاح', type: 'success' });
    refetch();
  }

  if (selectedTailorId) {
    return (
      <>
        <DistributionTailorDetail tailorId={selectedTailorId} onBack={() => router.replace('/distribution')} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">التوزيع</h1>
        {activeTab === 'distribution' && (
          <div className="flex gap-3">
            <button onClick={() => setShowDistribute(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              توزيع
            </button>
            <button onClick={() => setShowReturn(true)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              ارتجاع
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => switchTab('distribution')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'distribution' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          التوزيع
        </button>
        <button
          onClick={() => switchTab('availability')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'availability' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          توافر القطع
        </button>
      </div>

      {activeTab === 'distribution' ? (
        <>
          <DistributionKpiCards kpis={kpis} loading={loading} />
          <DistributionSummaryTable
            summary={summary}
            loading={loading}
            error={error}
            onRowClick={(tailorId) => setParam('tailorId', tailorId)}
          />
        </>
      ) : (
        <PiecesAvailabilityTab />
      )}

      {showDistribute && <DistributeModal onClose={() => setShowDistribute(false)} onSuccess={handleDistributeSuccess} />}
      {showReturn && <ReturnModal onClose={() => setShowReturn(false)} onSuccess={handleReturnSuccess} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function DistributionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">جاري التحميل...</div>}>
      <DistributionPageContent />
    </Suspense>
  );
}
