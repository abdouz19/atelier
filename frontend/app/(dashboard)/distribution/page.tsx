'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitBranch } from 'lucide-react';
import { useDistributionList } from '@/hooks/useDistributionList';
import { DistributionKpiCards } from '@/components/distribution/DistributionKpiCards';
import { DistributionSummaryTable } from '@/components/distribution/DistributionSummaryTable';
import { DistributionTailorDetail } from '@/components/distribution/DistributionTailorDetail';
import { DistributeModal } from '@/components/distribution/DistributeModal';
import { ReturnModal } from '@/components/distribution/ReturnModal';
import { PiecesAvailabilityTab } from '@/components/distribution/PiecesAvailabilityTab';
import { Toast } from '@/components/shared/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { AppCard } from '@/components/shared/AppCard';
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
      <PageHeader
        title="التوزيع"
        subtitle="توزيع القطع على الخياطين وتتبع الارتجاعات"
        icon={<GitBranch size={17} />}
        actions={activeTab === 'distribution' ? (
          <div className="flex gap-3">
            <button onClick={() => setShowDistribute(true)} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
              توزيع
            </button>
            <button onClick={() => setShowReturn(true)} className="rounded-lg px-4 py-2 text-sm font-medium transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
              ارتجاع
            </button>
          </div>
        ) : undefined}
      />

      <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => switchTab('distribution')}
          className="px-4 py-2 text-sm font-medium transition-colors"
          style={activeTab === 'distribution'
            ? { borderBottom: '2px solid var(--primary-500)', color: 'var(--primary-500)' }
            : { color: '#475569' }}
        >
          التوزيع
        </button>
        <button
          onClick={() => switchTab('availability')}
          className="px-4 py-2 text-sm font-medium transition-colors"
          style={activeTab === 'availability'
            ? { borderBottom: '2px solid var(--primary-500)', color: 'var(--primary-500)' }
            : { color: '#475569' }}
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
    <Suspense fallback={<div className="p-6" style={{ color: '#475569' }}>جاري التحميل...</div>}>
      <DistributionPageContent />
    </Suspense>
  );
}
