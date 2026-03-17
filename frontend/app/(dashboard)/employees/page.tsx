'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useEmployeeList } from '@/hooks/useEmployeeList';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { AddEmployeeModal } from '@/components/employees/AddEmployeeModal';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { EmployeeDetailView } from '@/components/employees/EmployeeDetailView';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { Toast } from '@/components/shared/Toast';
import { ipcClient } from '@/lib/ipc-client';
import type { EmployeeSummary } from '@/features/employees/employees.types';

function EmployeesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id') ?? '';

  const { employees, loading, error, refetch } = useEmployeeList();

  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeSummary | null>(null);
  const [statusTarget, setStatusTarget] = useState<EmployeeSummary | null>(null);
  const [settingStatus, setSettingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`/employees?${params.toString()}`);
  }

  async function handleSetStatus() {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === 'active' ? 'inactive' : 'active';
    setSettingStatus(true);
    try {
      const res = await ipcClient.employees.setStatus({ id: statusTarget.id, status: newStatus });
      if (res.success) {
        setToast({ message: newStatus === 'inactive' ? 'تم تعطيل الموظف' : 'تم تفعيل الموظف', type: 'success' });
        await refetch();
      } else {
        setToast({ message: res.error, type: 'error' });
      }
    } finally {
      setSettingStatus(false);
      setStatusTarget(null);
    }
  }

  if (selectedId) {
    return (
      <>
        <EmployeeDetailView id={selectedId} onBack={() => router.replace('/employees')} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">الموظفون</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={16} />
          إضافة موظف
        </button>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4">
                <div className="h-9 w-9 rounded-full bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmployeeTable
          employees={employees}
          onRowClick={(id) => setParam('id', id)}
          onEdit={(e) => setEditTarget(e)}
          onSetStatus={(e) => {
            if (e.status === 'inactive') { handleSetStatusDirect(e); } else { setStatusTarget(e); }
          }}
        />
      )}

      {showAdd && (
        <AddEmployeeModal
          onClose={() => setShowAdd(false)}
          onSuccess={async () => {
            setShowAdd(false);
            setToast({ message: 'تم إضافة الموظف بنجاح', type: 'success' });
            await refetch();
          }}
        />
      )}

      {editTarget && (
        <EditEmployeeModal
          employee={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={async () => {
            setEditTarget(null);
            setToast({ message: 'تم تعديل الموظف بنجاح', type: 'success' });
            await refetch();
          }}
        />
      )}

      <ConfirmDialog
        open={!!statusTarget}
        title="تأكيد تعطيل الموظف"
        message={`هل أنت متأكد من تعطيل "${statusTarget?.name}"؟ لن يظهر في قوائم الاختيار لكن سجلاته ستبقى محفوظة.`}
        confirmLabel="تعطيل"
        onConfirm={handleSetStatus}
        onCancel={() => setStatusTarget(null)}
        loading={settingStatus}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  async function handleSetStatusDirect(employee: EmployeeSummary) {
    const res = await ipcClient.employees.setStatus({ id: employee.id, status: 'active' });
    if (res.success) {
      setToast({ message: 'تم تفعيل الموظف', type: 'success' });
      await refetch();
    } else {
      setToast({ message: res.error, type: 'error' });
    }
  }
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">جاري التحميل...</div>}>
      <EmployeesPageContent />
    </Suspense>
  );
}
