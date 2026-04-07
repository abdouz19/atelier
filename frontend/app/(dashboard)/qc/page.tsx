'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useQcData } from '@/hooks/useQcData';
import { useFinitionData } from '@/hooks/useFinitionData';
import { QcKpiCards } from '@/components/qc/QcKpiCards';
import { QcTable } from '@/components/qc/QcTable';
import { AddQcRecordModal } from '@/components/qc/AddQcRecordModal';
import { FinitionTable } from '@/components/finition/FinitionTable';
import { AddFinitionRecordModal, type FinitionNotReadyInfo } from '@/components/finition/AddFinitionRecordModal';
import { AddStepModal } from '@/components/finition/AddStepModal';
import { Toast } from '@/components/shared/Toast';
import { PageHeader } from '@/components/shared/PageHeader';

type Tab = 'qc' | 'finition';
type QcResultFilter = 'damaged' | 'acceptable' | 'good' | 'veryGood' | null;

function QcPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramTab = (searchParams.get('tab') ?? 'qc') as Tab;
  const paramFilter = (searchParams.get('filter') ?? null) as QcResultFilter;

  const { kpis, records: qcRecords, loading: qcLoading, error: qcError, refetch: refetchQc } = useQcData();
  const { records: finitionRecords, loading: finitionLoading, error: finitionError, refetch: refetchFinition } = useFinitionData();
  const [activeTab, setActiveTab] = useState<Tab>(paramTab);
  const [showAddQc, setShowAddQc] = useState(false);
  const [showAddFinition, setShowAddFinition] = useState(false);
  const [pendingStep, setPendingStep] = useState<FinitionNotReadyInfo | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    router.replace(`/qc?tab=${tab}`);
  }

  function handleKpiCardClick(key: 'pending' | 'reviewed' | 'damaged' | 'acceptable' | 'good' | 'veryGood' | 'finitionPending' | 'readyForStock') {
    if (key === 'finitionPending') { switchTab('finition'); return; }
    if (key === 'readyForStock') { router.push('/final-stock'); return; }
    const filterMap: Record<string, string> = { damaged: 'damaged', acceptable: 'acceptable', good: 'good', veryGood: 'veryGood' };
    const filter = filterMap[key];
    setActiveTab('qc');
    if (filter) router.replace(`/qc?tab=qc&filter=${filter}`);
    else router.replace('/qc?tab=qc');
  }

  function handleQcSuccess() {
    setShowAddQc(false);
    setToast({ message: 'تم حفظ سجل المراقبة بنجاح', type: 'success' });
    refetchQc();
  }

  function handleFinitionSuccess() {
    setShowAddFinition(false);
    setPendingStep(null);
    setToast({ message: 'تم حفظ سجل التشطيب بنجاح', type: 'success' });
    refetchFinition();
    refetchQc();
  }

  function handleFinitionNotReady(info: FinitionNotReadyInfo) {
    setShowAddFinition(false);
    setPendingStep(info);
  }

  function handleStepNotReady(newMaxQuantity: number, costAfterStep: number) {
    if (pendingStep) {
      setPendingStep({ ...pendingStep, quantity: newMaxQuantity, finalCostPerPiece: costAfterStep });
    }
  }

  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader
        title="مراقبة الجودة والتشطيب"
        subtitle="مراجعة الجودة وإضافة مراحل التشطيب"
        icon={<ShieldCheck size={17} />}
        actions={
          <>
            {activeTab === 'qc' && (
              <button onClick={() => setShowAddQc(true)} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
                إضافة مراجعة
              </button>
            )}
            {activeTab === 'finition' && (
              <button onClick={() => setShowAddFinition(true)} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
                إضافة تشطيب
              </button>
            )}
          </>
        }
      />

      {kpis && !qcLoading && <QcKpiCards kpis={kpis} onCardClick={handleKpiCardClick} />}

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <nav className="flex gap-6">
          {([['qc', 'مراقبة الجودة'], ['finition', 'التشطيب']] as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => switchTab(tab as Tab)}
              className="pb-3 text-sm font-medium border-b-2 transition-colors"
              style={activeTab === tab
                ? { borderColor: 'var(--primary-500)', color: 'var(--primary-500)' }
                : { borderColor: 'transparent', color: '#475569' }}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'qc' && (
        <>
          {qcLoading && <p className="text-sm" style={{ color: '#475569' }}>جاري التحميل...</p>}
          {qcError && <p className="text-sm text-red-500">{qcError}</p>}
          {!qcLoading && <QcTable records={qcRecords} resultFilter={paramFilter} />}
        </>
      )}

      {activeTab === 'finition' && (
        <>
          {finitionLoading && <p className="text-sm" style={{ color: '#475569' }}>جاري التحميل...</p>}
          {finitionError && <p className="text-sm text-red-500">{finitionError}</p>}
          {!finitionLoading && <FinitionTable records={finitionRecords} />}
        </>
      )}

      {showAddQc && <AddQcRecordModal onClose={() => setShowAddQc(false)} onSuccess={handleQcSuccess} />}
      {showAddFinition && (
        <AddFinitionRecordModal
          onClose={() => setShowAddFinition(false)}
          onSuccess={handleFinitionSuccess}
          onNotReady={handleFinitionNotReady}
        />
      )}
      {pendingStep && (
        <AddStepModal
          finitionId={pendingStep.finitionId}
          modelName={pendingStep.modelName}
          sizeLabel={pendingStep.sizeLabel}
          color={pendingStep.color}
          maxQuantity={pendingStep.quantity}
          incomingCostPerPiece={pendingStep.finalCostPerPiece}
          onClose={() => setPendingStep(null)}
          onSuccess={handleFinitionSuccess}
          onNotReady={handleStepNotReady}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function QcPage() {
  return (
    <Suspense fallback={<div className="p-6" style={{ color: '#475569' }}>جاري التحميل...</div>}>
      <QcPageContent />
    </Suspense>
  );
}
