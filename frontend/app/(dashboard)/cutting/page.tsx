'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scissors } from 'lucide-react';
import { useCuttingList } from '@/hooks/useCuttingList';
import { useCuttingPartsInventory } from '@/hooks/useCuttingPartsInventory';
import { CuttingKpiCards } from '@/components/cutting/CuttingKpiCards';
import { PartsInventoryPanel } from '@/components/cutting/PartsInventoryPanel';
import { CuttingSessionTable } from '@/components/cutting/CuttingSessionTable';
import { CuttingSessionDetail } from '@/components/cutting/CuttingSessionDetail';
import { AvailablePartsDetailView } from '@/components/cutting/AvailablePartsDetailView';
import { NewCuttingSessionModal } from '@/components/cutting/NewCuttingSessionModal';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { Toast } from '@/components/shared/Toast';
import { PageHeader } from '@/components/shared/PageHeader';

type CuttingView = 'available' | 'produced' | null;

function CuttingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id') ?? '';
  const activeView = (searchParams.get('view') ?? null) as CuttingView;
  const { kpis, sessions, loading, error, refetch } = useCuttingList();
  const partsInventory = useCuttingPartsInventory();
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/cutting?${params.toString()}`);
  }

  function setView(view: string) {
    router.replace(`/cutting?view=${view}`);
  }

  function handleCardClick(key: 'sessions' | 'produced' | 'available' | 'meters' | 'cost') {
    if (key === 'available') setView('available');
    else if (key === 'produced') setView('produced');
    // sessions, meters, cost stay on main page (scroll to relevant panel)
  }

  // Session detail view
  if (selectedId) {
    return (
      <>
        <CuttingSessionDetail id={selectedId} onBack={() => router.replace('/cutting')} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // Available parts detail view
  if (activeView === 'available') {
    return <AvailablePartsDetailView onBack={() => router.replace('/cutting')} initialFilter="available" />;
  }

  // Produced parts detail view (reuse AvailablePartsDetailView with all=true)
  if (activeView === 'produced') {
    return <AvailablePartsDetailView onBack={() => router.replace('/cutting')} initialFilter="all" />;
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="القص"
        subtitle="جلسات القص وجرد القطع"
        icon={<Scissors size={17} />}
        actions={
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
            <Scissors size={16} />جلسة قص جديدة
          </button>
        }
      />
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />)}</div>
          <div className="h-48 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      ) : (
        <div className="space-y-6">
          {kpis && <CuttingKpiCards kpis={kpis} onCardClick={handleCardClick} />}
          <PartsInventoryPanel
            rows={partsInventory.rows}
            isLoading={partsInventory.isLoading}
            error={partsInventory.error}
          />
          <CuttingSessionTable sessions={sessions} onRowClick={(id) => setParam('id', id)} />
        </div>
      )}
      {showCreate && (
        <NewCuttingSessionModal
          onClose={() => setShowCreate(false)}
          onSuccess={async () => {
            setShowCreate(false);
            setToast({ message: 'تم إنشاء جلسة القص بنجاح', type: 'success' });
            await Promise.all([refetch(), partsInventory.refetch()]);
          }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function CuttingPage() {
  return (
    <Suspense fallback={<div className="p-6" style={{ color: '#475569' }}>جاري التحميل...</div>}>
      <CuttingPageContent />
    </Suspense>
  );
}
