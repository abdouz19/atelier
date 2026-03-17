'use client';

import { ArrowRight } from 'lucide-react';
import { useDistributionDetail } from '@/hooks/useDistributionDetail';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { EmptyState } from '@/components/shared/EmptyState';

interface DistributionTailorDetailProps {
  tailorId: string;
  onBack: () => void;
}

export function DistributionTailorDetail({ tailorId, onBack }: DistributionTailorDetailProps) {
  const { detail, loading, error } = useDistributionDetail(tailorId);

  if (loading) return <div className="p-6 text-center text-gray-400">جاري التحميل...</div>;
  if (error) return <div className="p-6"><ErrorAlert message={error} /></div>;
  if (!detail) return null;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg p-1.5 hover:bg-gray-100"><ArrowRight size={18} /></button>
        <h2 className="text-xl font-bold text-gray-900">{detail.tailorName}</h2>
      </div>

      {detail.batches.length === 0 ? (
        <EmptyState message="لا توجد توزيعات لهذا الخياط" />
      ) : (
        <div className="space-y-4">
          {detail.batches.map((batch) => (
            <div key={batch.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span><span className="text-gray-500">النموذج:</span> <strong>{batch.modelName}</strong></span>
                <span><span className="text-gray-500">المقاس:</span> <strong>{batch.sizeLabel}</strong></span>
                <span><span className="text-gray-500">اللون:</span> <strong>{batch.color}</strong></span>
                <span><span className="text-gray-500">الكمية:</span> <strong>{batch.quantity}</strong></span>
                <span><span className="text-gray-500">المتبقي:</span> <strong>{batch.remainingQuantity}</strong></span>
                <span><span className="text-gray-500">سعر القطعة:</span> <strong>{batch.sewingPricePerPiece}</strong></span>
                <span><span className="text-gray-500">الإجمالي:</span> <strong>{batch.totalCost.toFixed(2)}</strong></span>
                <span><span className="text-gray-500">التاريخ:</span> <strong>{new Date(batch.distributionDate).toLocaleDateString('en-GB')}</strong></span>
              </div>
              {batch.returns.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {batch.returns.map((r) => (
                    <div key={r.id} className="px-4 py-3 text-sm">
                      <div className="flex gap-4 text-gray-600">
                        <span>ارتجاع: <strong>{r.quantityReturned} قطعة</strong></span>
                        <span>{new Date(r.returnDate).toLocaleDateString('en-GB')}</span>
                      </div>
                      {r.consumptionEntries.length > 0 && (
                        <div className="mt-1 text-xs text-gray-400">
                          مستهلك: {r.consumptionEntries.map(c => `${c.stockItemName}${c.color ? ` (${c.color})` : ''}: ${c.quantity}`).join('، ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
