'use client';

import { ArrowRight } from 'lucide-react';
import type { SupplierDetail } from '@/features/suppliers/suppliers.types';

interface SupplierDetailPanelProps {
  supplier: SupplierDetail;
  onBack: () => void;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function SupplierDetailPanel({ supplier, onBack }: SupplierDetailPanelProps) {
  return (
    <div dir="rtl" className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-base"
      >
        <ArrowRight size={16} />
        العودة إلى الموردون
      </button>

      {/* Profile */}
      <div className="rounded-2xl border p-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
        <h2 className="mb-4 text-xl font-bold text-text-base">{supplier.name}</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {supplier.phone && (
            <>
              <dt className="font-medium text-text-muted">الهاتف</dt>
              <dd className="text-text-base">{supplier.phone}</dd>
            </>
          )}
          {supplier.address && (
            <>
              <dt className="font-medium text-text-muted">العنوان</dt>
              <dd className="text-text-base">{supplier.address}</dd>
            </>
          )}
          {supplier.productsSold && (
            <>
              <dt className="font-medium text-text-muted">المنتجات</dt>
              <dd className="text-text-base">{supplier.productsSold}</dd>
            </>
          )}
          {supplier.notes && (
            <>
              <dt className="font-medium text-text-muted">ملاحظات</dt>
              <dd className="text-text-base">{supplier.notes}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Purchase history */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-base">سجل المشتريات</h3>
          <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
            الإجمالي: {formatPrice(supplier.totalSpent)} دج
          </span>
        </div>

        {supplier.purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm font-medium text-text-muted">لا توجد مشتريات مسجلة</p>
            <p className="mt-1 text-xs text-text-muted">ستظهر هنا عند تسجيل وارد مرتبط بهذا المورد</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)', opacity: 0.7 }} />
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
                  <tr>
                    {['الصنف', 'الكمية', 'سعر الوحدة', 'الإجمالي', 'التاريخ'].map((h) => (
                      <th key={h} className="px-4 py-3 text-right" style={{ color: 'var(--cell-faint)', borderBottom: '1px solid var(--table-head-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {supplier.purchases.map((p) => (
                    <tr key={p.transactionId} className="odd:bg-surface even:bg-base/30 row-hover transition-colors">
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--cell-text)' }}>
                        {p.stockItemName}
                        {p.color && <span className="mr-2 rounded-full px-2 py-0.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>{p.color}</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-muted)' }}>{p.quantity} {p.unit}</td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-muted)' }}>{formatPrice(p.pricePerUnit)} دج</td>
                      <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: '#34d399' }}>{formatPrice(p.totalPricePaid)} دج</td>
                      <td className="px-4 py-3 text-xs tabular-nums" style={{ color: 'var(--cell-dim)' }}>{formatDate(p.transactionDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
