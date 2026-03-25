'use client';

import { ArrowRight } from 'lucide-react';
import { useCuttingDetail } from '@/hooks/useCuttingDetail';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import type { CuttingSessionDetail as DetailType } from '@/features/cutting/cutting.types';

interface CuttingSessionDetailProps {
  id: string;
  onBack: () => void;
}

function DetailView({ detail }: { detail: DetailType }) {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <div><span className="text-gray-500">التاريخ: </span><span>{new Date(detail.sessionDate).toLocaleDateString('en-GB')}</span></div>
          <div><span className="text-gray-500">القماش: </span><span>{detail.fabricName} — {detail.fabricColor}</span></div>
          <div><span className="text-gray-500">الموديل: </span><span>{detail.modelName}</span></div>
          {detail.sizeLabel && <div><span className="text-gray-500">المقاس: </span><span>{detail.sizeLabel}</span></div>}
          <div><span className="text-gray-500">الأمتار: </span><span>{detail.metersUsed} م</span></div>
          <div><span className="text-gray-500">الطبقات: </span><span>{detail.layers}</span></div>
          <div><span className="text-gray-500">سعر الطبقة: </span><span>{detail.pricePerLayer.toLocaleString('en-US')} دج</span></div>
          {detail.notes && <div className="col-span-2"><span className="text-gray-500">ملاحظات: </span><span>{detail.notes}</span></div>}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 font-semibold text-gray-700">الموظفون</h3>
        <table className="w-full text-sm"><tbody className="divide-y divide-gray-100">
          {detail.employees.map((e) => (
            <tr key={e.id}><td className="py-2 text-gray-700">{e.name}</td><td className="py-2 text-right font-medium text-gray-900">{e.earnings.toLocaleString('en-US')} دج</td></tr>
          ))}
        </tbody></table>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 font-semibold text-gray-700">الأجزاء المنتجة</h3>
        {detail.parts.length === 0 ? (
          <p className="text-sm text-gray-400">لا توجد أجزاء مسجلة (جلسة قديمة)</p>
        ) : (
          <table className="w-full text-sm"><thead className="text-xs text-gray-500"><tr><th className="py-2 text-right">اسم الجزء</th><th className="py-2 text-right">العدد</th></tr></thead><tbody className="divide-y divide-gray-100">
            {detail.parts.map((p) => (
              <tr key={p.partName}><td className="py-2 text-gray-700">{p.partName}</td><td className="py-2 font-medium text-gray-900">{p.count}</td></tr>
            ))}
          </tbody></table>
        )}
      </div>
      {detail.consumptionEntries.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-700">المواد المستهلكة</h3>
          <table className="w-full text-sm"><tbody className="divide-y divide-gray-100">
            {detail.consumptionEntries.map((c, i) => (
              <tr key={i}><td className="py-2 text-gray-700">{c.stockItemName}{c.color ? ` — ${c.color}` : ''}</td><td className="py-2 text-right font-medium text-gray-900">{c.quantity}</td></tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}

export function CuttingSessionDetail({ id, onBack }: CuttingSessionDetailProps) {
  const { detail, loading, error } = useCuttingDetail(id);
  if (loading) return <div className="animate-pulse space-y-4" dir="rtl"><div className="h-32 rounded-xl bg-gray-200" /><div className="h-24 rounded-xl bg-gray-200" /></div>;
  if (error) return <div dir="rtl"><ErrorAlert message={error} /></div>;
  if (!detail) return <div dir="rtl" className="text-gray-400">الجلسة غير موجودة</div>;
  return (
    <div dir="rtl" className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowRight size={16} />العودة إلى القص</button>
      <DetailView detail={detail} />
    </div>
  );
}
