'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AddPaymentModal } from './AddPaymentModal';
import { EditPaymentModal } from './EditPaymentModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ipcClient } from '@/lib/ipc-client';
import type { EmployeeDetail, PaymentRecord } from '@/features/employees/employees.types';

interface PaymentsHistoryProps {
  payments: PaymentRecord[];
  employeeId: string;
  onPaymentMutated: (detail: EmployeeDetail) => void;
}

export function PaymentsHistory({ payments, employeeId, onPaymentMutated }: PaymentsHistoryProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await ipcClient.employees.deletePayment({ id: deleteTarget.id });
      if (res.success) { onPaymentMutated(res.data); setDeleteTarget(null); }
      else { setDeleteError(res.error); }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">سجل الدفعات</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          <Plus size={15} />
          تسجيل دفعة
        </button>
      </div>

      {payments.length === 0 ? (
        <EmptyState message="لا توجد دفعات بعد" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">المبلغ</th>
                <th className="px-4 py-2 text-right">ملاحظات</th>
                <th className="px-4 py-2 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {payment.amount.toLocaleString('en-US')} دج
                  </td>
                  <td className="px-4 py-2 text-gray-500">{payment.notes ?? '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditTarget(payment)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="تعديل">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(payment)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600" title="حذف">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddPaymentModal
          employeeId={employeeId}
          onClose={() => setShowAdd(false)}
          onSuccess={(detail) => { setShowAdd(false); onPaymentMutated(detail); }}
        />
      )}

      {editTarget && (
        <EditPaymentModal
          payment={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={(detail) => { setEditTarget(null); onPaymentMutated(detail); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد حذف الدفعة"
        message={`هل أنت متأكد من حذف هذه الدفعة (${deleteTarget?.amount?.toLocaleString('en-US')} دج)؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
        loading={deleting}
      />
      {deleteError && <p className="mt-2 text-xs text-red-500">{deleteError}</p>}
    </div>
  );
}
