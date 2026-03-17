'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { EditTransactionModal } from './EditTransactionModal';
import type { StockTransaction } from '@/features/stock/stock.types';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

interface TransactionHistoryProps {
  transactions: StockTransaction[];
  unit: string;
  suppliers: SupplierSummary[];
  onRefetch: () => Promise<void>;
}

const SOURCE_LABELS: Record<string, string> = {
  stock: 'مخزون',
  cutting: 'قطع',
  distribution: 'توزيع',
  qc: 'جودة',
  finition: 'تشطيب',
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function TransactionHistory({ transactions, unit, suppliers, onRefetch }: TransactionHistoryProps) {
  const [editTarget, setEditTarget] = useState<StockTransaction | null>(null);

  if (transactions.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">لا توجد حركات مسجلة</p>;
  }

  return (
    <>
      <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-right">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">النوع</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">الكمية</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">اللون</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">المورد</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">سعر الوحدة</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">الإجمالي</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">المصدر</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600">ملاحظات</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const isInbound = tx.type === 'inbound';
              const isEditable = isInbound && !tx.sourceModule;
              return (
                <tr key={tx.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.transactionDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isInbound ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {isInbound ? 'وارد' : 'مستهلك'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold ${isInbound ? 'text-green-700' : 'text-orange-700'}`}>
                    {isInbound ? '+' : '-'}{tx.quantity} {unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tx.color ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{tx.color}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tx.supplierName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tx.pricePerUnit != null ? `${formatPrice(tx.pricePerUnit)} دج` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">
                    {tx.totalPricePaid != null ? `${formatPrice(tx.totalPricePaid)} دج` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {tx.sourceModule ? (SOURCE_LABELS[tx.sourceModule] ?? tx.sourceModule) : '—'}
                    {!isInbound && tx.modelName ? <span className="mr-1 text-gray-400">— {tx.modelName}</span> : null}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-sm text-gray-500">
                    <span className="line-clamp-1">{tx.notes}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isEditable && (
                      <button
                        onClick={() => setEditTarget(tx)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="تعديل"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <EditTransactionModal
          transaction={editTarget}
          suppliers={suppliers}
          onClose={() => setEditTarget(null)}
          onSuccess={async () => {
            setEditTarget(null);
            await onRefetch();
          }}
        />
      )}
    </>
  );
}
