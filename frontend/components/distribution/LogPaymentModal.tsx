'use client';

import { useState } from 'react';
import { AppModal } from '@/components/shared/AppModal';
import { ipcClient } from '@/lib/ipc-client';

interface LogPaymentModalProps {
  tailorId: string;
  tailorName: string;
  remainingBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function LogPaymentModal({ tailorId, tailorName, remainingBalance, onClose, onSuccess }: LogPaymentModalProps) {
  const [amount, setAmount] = useState(remainingBalance > 0 ? remainingBalance.toFixed(2) : '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError('يرجى إدخال مبلغ صحيح'); return; }
    setSubmitting(true);
    try {
      const res = await ipcClient.tailors.addPayment({
        tailorId,
        amount: amt,
        paymentDate: new Date(paymentDate).getTime(),
        notes: notes.trim() || undefined,
      });
      if (res.success) { onSuccess(); }
      else { setError(res.error); }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      title={`تسجيل دفعة — ${tailorName}`}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-base hover:bg-base">إلغاء</button>
          <button type="submit" form="log-payment-form" disabled={submitting}
            className="btn-tactile rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
            {submitting ? 'جاري الحفظ...' : 'تسجيل الدفعة'}
          </button>
        </>
      }
    >
      <form id="log-payment-form" onSubmit={handleSubmit} className="space-y-4">
        {remainingBalance > 0 && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
            <span style={{ color: 'var(--cell-muted)' }}>الرصيد المستحق: </span>
            <strong style={{ color: '#fbbf24' }}>{remainingBalance.toFixed(2)} دج</strong>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">المبلغ (دج) *</label>
          <input
            type="number" min={0.01} step="any" value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">التاريخ *</label>
          <input
            type="date" value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-base">ملاحظات (اختياري)</label>
          <input
            type="text" value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none input-transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </AppModal>
  );
}
