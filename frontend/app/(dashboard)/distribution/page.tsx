'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitBranch } from 'lucide-react';
import { useDistributionList } from '@/hooks/useDistributionList';
import { DistributionKpiCards } from '@/components/distribution/DistributionKpiCards';
import { DistributionSummaryTable } from '@/components/distribution/DistributionSummaryTable';
import { DistributionTailorDetail } from '@/components/distribution/DistributionTailorDetail';
import { DistributionLogTable } from '@/components/distribution/DistributionLogTable';
import { DistributeModal } from '@/components/distribution/DistributeModal';
import { ReturnModal } from '@/components/distribution/ReturnModal';
import { PiecesAvailabilityTab } from '@/components/distribution/PiecesAvailabilityTab';
import { Toast } from '@/components/shared/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import type { DistributionTailorSummary } from '@/features/distribution/distribution.types';

type Tab = 'distribution' | 'log' | 'availability';

function DistributionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTailorId = searchParams.get('tailorId') ?? '';
  const activeTab = (searchParams.get('tab') ?? 'distribution') as Tab;

  const { kpis, summary, loading, error, refetch } = useDistributionList();
  const [showDistribute, setShowDistribute] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [returnBatchId, setReturnBatchId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/distribution?${params.toString()}`);
  }

  function switchTab(tab: Tab) {
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
    setReturnBatchId(null);
    setToast({ message: 'تم تسجيل الارتجاع بنجاح', type: 'success' });
    refetch();
  }

  function handleReturnClick(batchId: string) {
    setReturnBatchId(batchId);
    setShowReturn(true);
  }

  if (selectedTailorId) {
    return (
      <>
        <DistributionTailorDetail
          tailorId={selectedTailorId}
          onBack={() => router.replace('/distribution')}
          onReturnClick={(batchId) => handleReturnClick(batchId)}
        />
        {showReturn && (
          <ReturnModal
            onClose={() => { setShowReturn(false); setReturnBatchId(null); }}
            onSuccess={handleReturnSuccess}
            defaultBatchId={returnBatchId ?? undefined}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  const tabs: [Tab, string][] = [
    ['distribution', 'التوزيع'],
    ['log', 'سجل التوزيعات'],
    ['availability', 'توافر القطع'],
  ];

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

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={activeTab === tab
              ? { borderBottom: '2px solid var(--primary-500)', color: 'var(--primary-500)' }
              : { color: '#475569' }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'distribution' && (
        <>
          <DistributionKpiCards kpis={kpis} loading={loading} />
          <DistributionSummaryTable
            summary={summary}
            loading={loading}
            error={error}
            onRowClick={(tailorId) => setParam('tailorId', tailorId)}
          />
        </>
      )}

      {activeTab === 'log' && <DistributionLogTable />}

      {activeTab === 'availability' && <PiecesAvailabilityTab />}

      {showDistribute && <DistributeModal onClose={() => setShowDistribute(false)} onSuccess={handleDistributeSuccess} />}
      {showReturn && (
        <ReturnModal
          onClose={() => { setShowReturn(false); setReturnBatchId(null); }}
          onSuccess={handleReturnSuccess}
          defaultBatchId={returnBatchId ?? undefined}
        />
      )}
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
