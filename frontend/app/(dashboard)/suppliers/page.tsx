'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useSupplierList } from '@/hooks/useSupplierList';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { AppCard } from '@/components/shared/AppCard';
import { SupplierDetailView } from '@/components/suppliers/SupplierDetailView';
import { AddSupplierModal } from '@/components/suppliers/AddSupplierModal';
import { EditSupplierModal } from '@/components/suppliers/EditSupplierModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { Toast } from '@/components/shared/Toast';
import { ipcClient } from '@/lib/ipc-client';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

function SuppliersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id') ?? '';

  const { suppliers, loading, error, refetch } = useSupplierList();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<SupplierSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/suppliers?${params.toString()}`);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await ipcClient.suppliers.delete({ id: deleteTarget.id });
      if (res.success) {
        setToast({ message: 'تم حذف المورد', type: 'success' });
        await refetch();
      } else {
        setToast({ message: res.error, type: 'error' });
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (selectedId) {
    return (
      <>
        <SupplierDetailView id={selectedId} onBack={() => router.replace('/suppliers')} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="الموردون"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Plus size={16} />
            إضافة مورد
          </button>
        }
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <SupplierTable
          suppliers={suppliers}
          onRowClick={(id) => setParam('id', id)}
          onEdit={(s) => setEditTarget(s)}
          onDelete={(s) => setDeleteTarget(s)}
        />
      )}

      {showAdd && (
        <AddSupplierModal
          onClose={() => setShowAdd(false)}
          onSuccess={async () => {
            setShowAdd(false);
            setToast({ message: 'تم إضافة المورد بنجاح', type: 'success' });
            await refetch();
          }}
        />
      )}

      {editTarget && (
        <EditSupplierModal
          supplier={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={async () => {
            setEditTarget(null);
            setToast({ message: 'تم تعديل المورد بنجاح', type: 'success' });
            await refetch();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"? سيتم إخفاؤه من القائمة لكن سجلاته ستبقى محفوظة.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">جاري التحميل...</div>}>
      <SuppliersPageContent />
    </Suspense>
  );
}
