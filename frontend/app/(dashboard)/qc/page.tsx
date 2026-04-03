'use client';

import { useState } from 'react';
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
import { AppCard } from '@/components/shared/AppCard';

type Tab = 'qc' | 'finition';

export default function QcPage() {
  const { kpis, records: qcRecords, loading: qcLoading, error: qcError, refetch: refetchQc } = useQcData();
  const { records: finitionRecords, loading: finitionLoading, error: finitionError, refetch: refetchFinition } = useFinitionData();
  const [activeTab, setActiveTab] = useState<Tab>('qc');
  const [showAddQc, setShowAddQc] = useState(false);
  const [showAddFinition, setShowAddFinition] = useState(false);
  const [pendingStep, setPendingStep] = useState<FinitionNotReadyInfo | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  function handleStepNotReady(newMaxQuantity: number) {
    if (pendingStep) {
      setPendingStep({ ...pendingStep, quantity: newMaxQuantity });
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

      {kpis && !qcLoading && <QcKpiCards kpis={kpis} />}

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <nav className="flex gap-6">
          {([['qc', 'مراقبة الجودة'], ['finition', 'التشطيب']] as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
          {!qcLoading && <QcTable records={qcRecords} />}
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
