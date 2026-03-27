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
      <div className="rounded-xl border border-border bg-white p-6">
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
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            الإجمالي: {formatPrice(supplier.totalSpent)} دج
          </span>
        </div>

        {supplier.purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm font-medium text-text-muted">لا توجد مشتريات مسجلة</p>
            <p className="mt-1 text-xs text-text-muted">ستظهر هنا عند تسجيل وارد مرتبط بهذا المورد</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full text-right">
              <thead className="border-b border-border bg-base/60">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-text-muted">الصنف</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-muted">الكمية</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-muted">سعر الوحدة</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-muted">الإجمالي</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-muted">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {supplier.purchases.map((p) => (
                  <tr key={p.transactionId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">
                      {p.stockItemName}
                      {p.color && <span className="mr-2 rounded-full bg-base px-2 py-0.5 text-xs text-text-muted">{p.color}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">{formatPrice(p.pricePerUnit)} دج</td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-base">{formatPrice(p.totalPricePaid)} دج</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{formatDate(p.transactionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
