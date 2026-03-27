'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useTailorsList } from '@/hooks/useTailorsList';
import { TailorTable } from '@/components/tailors/TailorTable';
import { TailorDetail } from '@/components/tailors/TailorDetail';
import { NewTailorModal } from '@/components/tailors/NewTailorModal';
import { EditTailorModal } from '@/components/tailors/EditTailorModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { Toast } from '@/components/shared/Toast';
import { ipcClient } from '@/lib/ipc-client';
import { PageHeader } from '@/components/shared/PageHeader';
import { AppCard } from '@/components/shared/AppCard';
import type { TailorSummary } from '@/features/tailors/tailors.types';

function TailorsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id') ?? '';

  const { tailors, loading, error, refetch } = useTailorsList();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<TailorSummary | null>(null);
  const [statusTarget, setStatusTarget] = useState<TailorSummary | null>(null);
  const [settingStatus, setSettingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/tailors?${params.toString()}`);
  }

  async function handleSetStatus() {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === 'active' ? 'inactive' : 'active';
    setSettingStatus(true);
    try {
      const res = await ipcClient.tailors.setStatus({ id: statusTarget.id, status: newStatus });
      if (res.success) {
        setToast({ message: newStatus === 'inactive' ? 'تم تعطيل الخياط' : 'تم تفعيل الخياط', type: 'success' });
        await refetch();
      } else { setToast({ message: res.error, type: 'error' }); }
    } finally { setSettingStatus(false); setStatusTarget(null); }
  }

  if (selectedId) {
    return (
      <>
        <TailorDetail id={selectedId} onBack={() => router.replace('/tailors')} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="الخياطون"
        actions={
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
            <Plus size={16} />إضافة خياط
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <TailorTable tailors={tailors} onRowClick={(id) => setParam('id', id)} onEdit={(t) => setEditTarget(t)}
          onSetStatus={(t) => { if (t.status === 'inactive') { handleActivateDirect(t); } else { setStatusTarget(t); } }} />
      )}

      {showAdd && <NewTailorModal onClose={() => setShowAdd(false)} onSuccess={async () => { setShowAdd(false); setToast({ message: 'تم إضافة الخياط', type: 'success' }); await refetch(); }} />}
      {editTarget && <EditTailorModal tailor={editTarget} onClose={() => setEditTarget(null)} onSuccess={async () => { setEditTarget(null); setToast({ message: 'تم تعديل الخياط', type: 'success' }); await refetch(); }} />}

      <ConfirmDialog open={!!statusTarget} title="تأكيد تعطيل الخياط" message={`هل أنت متأكد من تعطيل "${statusTarget?.name}"؟`} confirmLabel="تعطيل" onConfirm={handleSetStatus} onCancel={() => setStatusTarget(null)} loading={settingStatus} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  async function handleActivateDirect(tailor: TailorSummary) {
    const res = await ipcClient.tailors.setStatus({ id: tailor.id, status: 'active' });
    if (res.success) { setToast({ message: 'تم تفعيل الخياط', type: 'success' }); await refetch(); }
    else { setToast({ message: res.error, type: 'error' }); }
  }
}

export default function TailorsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">جاري التحميل...</div>}>
      <TailorsPageContent />
    </Suspense>
  );
}
