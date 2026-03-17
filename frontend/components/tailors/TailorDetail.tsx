'use client';

import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useTailorDetail } from '@/hooks/useTailorDetail';
import { TailorPaymentModal } from './TailorPaymentModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { Toast } from '@/components/shared/Toast';
import { ipcClient } from '@/lib/ipc-client';
import type { TailorPaymentRecord } from '@/features/tailors/tailors.types';

interface TailorDetailProps {
  id: string;
  onBack: () => void;
}

export function TailorDetail({ id, onBack }: TailorDetailProps) {
  const { detail, loading, error, refetch } = useTailorDetail(id);
  const [paymentTarget, setPaymentTarget] = useState<TailorPaymentRecord | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleDeletePayment() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await ipcClient.tailors.deletePayment({ id: deleteTarget });
      if (res.success) {
        setToast({ message: 'تم حذف الدفعة', type: 'success' });
        await refetch();
      } else { setToast({ message: res.error, type: 'error' }); }
    } finally { setDeleting(false); setDeleteTarget(null); }
  }

  if (loading) return <div className="p-6 text-gray-400 text-center">جاري التحميل...</div>;
  if (error) return <div className="p-6"><ErrorAlert message={error} /></div>;
  if (!detail) return null;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg p-1.5 hover:bg-gray-100"><ArrowRight size={18} /></button>
        <h2 className="text-xl font-bold text-gray-900">{detail.name}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${detail.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {detail.status === 'active' ? 'نشط' : 'غير نشط'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'إجمالي المكتسب', value: detail.totalEarned }, { label: 'إجمالي المدفوع', value: detail.totalPaid }, { label: 'الرصيد المستحق', value: detail.balanceDue }].map(c => (
          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-lg font-bold text-gray-900">{c.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-medium text-sm">سجل الخياطة</div>
        {detail.sewingTransactions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">لا توجد عمليات توزيع بعد</p>
        ) : (
          <table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr>
            <th className="px-4 py-2 text-right">النموذج</th><th className="px-4 py-2 text-right">المقاس</th><th className="px-4 py-2 text-right">اللون</th>
            <th className="px-4 py-2 text-right">الكمية</th><th className="px-4 py-2 text-right">سعر القطعة</th><th className="px-4 py-2 text-right">الإجمالي</th><th className="px-4 py-2 text-right">التاريخ</th>
          </tr></thead><tbody className="divide-y divide-gray-100">
            {detail.sewingTransactions.map(t => (
              <tr key={t.batchId} className="hover:bg-gray-50">
                <td className="px-4 py-2">{t.modelName}</td><td className="px-4 py-2">{t.sizeLabel}</td><td className="px-4 py-2">{t.color}</td>
                <td className="px-4 py-2">{t.quantity}</td><td className="px-4 py-2">{t.sewingPricePerPiece}</td><td className="px-4 py-2">{t.totalCost.toFixed(2)}</td>
                <td className="px-4 py-2">{new Date(t.distributionDate).toLocaleDateString('en-GB')}</td>
              </tr>
            ))}
          </tbody></table>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="font-medium text-sm">الدفعات</span>
          <button onClick={() => setPaymentTarget(null)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"><Plus size={12} />إضافة دفعة</button>
        </div>
        {detail.payments.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">لا توجد دفعات بعد</p>
        ) : (
          <div className="divide-y divide-gray-100">{detail.payments.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div><p className="font-medium text-sm">{p.amount.toFixed(2)} دج</p><p className="text-xs text-gray-400">{new Date(p.paymentDate).toLocaleDateString('en-GB')}{p.notes ? ` — ${p.notes}` : ''}</p></div>
              <div className="flex gap-2">
                <button onClick={() => setPaymentTarget(p)} className="text-xs text-blue-600 hover:underline">تعديل</button>
                <button onClick={() => setDeleteTarget(p.id)} className="text-xs text-red-500 hover:underline">حذف</button>
              </div>
            </div>
          ))}</div>
        )}
      </div>

      {paymentTarget !== undefined && (
        <TailorPaymentModal tailorId={id} payment={paymentTarget} onClose={() => setPaymentTarget(undefined)}
          onSuccess={async () => { setPaymentTarget(undefined); setToast({ message: 'تم حفظ الدفعة', type: 'success' }); await refetch(); }} />
      )}
      <ConfirmDialog open={!!deleteTarget} title="حذف الدفعة" message="هل أنت متأكد من حذف هذه الدفعة؟" confirmLabel="حذف" onConfirm={handleDeletePayment} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
