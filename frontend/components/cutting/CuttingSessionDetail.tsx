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
      <div className="rounded-xl border border-border bg-white p-5">
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <div><span className="text-text-muted">التاريخ: </span><span>{new Date(detail.sessionDate).toLocaleDateString('en-GB')}</span></div>
          <div><span className="text-text-muted">القماش: </span><span>{detail.fabricName} — {detail.fabricColor}</span></div>
          <div><span className="text-text-muted">الموديل: </span><span>{detail.modelName}</span></div>
          {detail.sizeLabel && <div><span className="text-text-muted">المقاس: </span><span>{detail.sizeLabel}</span></div>}
          <div><span className="text-text-muted">الأمتار: </span><span>{detail.metersUsed} م</span></div>
          <div><span className="text-text-muted">الطبقات: </span><span>{detail.layers}</span></div>
          <div><span className="text-text-muted">سعر الطبقة: </span><span>{detail.pricePerLayer.toLocaleString('en-US')} دج</span></div>
          {detail.notes && <div className="col-span-2"><span className="text-text-muted">ملاحظات: </span><span>{detail.notes}</span></div>}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 font-semibold text-text-base">الموظفون</h3>
        <table className="w-full text-sm"><tbody className="divide-y divide-border">
          {detail.employees.map((e) => (
            <tr key={e.id}><td className="py-2 text-text-base">{e.name}</td><td className="py-2 text-right font-medium text-text-base">{e.earnings.toLocaleString('en-US')} دج</td></tr>
          ))}
        </tbody></table>
      </div>
      <div className="rounded-xl border border-border bg-white p-4">
        <h3 className="mb-3 font-semibold text-text-base">الأجزاء المنتجة</h3>
        {detail.parts.length === 0 ? (
          <p className="text-sm text-text-muted">لا توجد أجزاء مسجلة (جلسة قديمة)</p>
        ) : (
          <table className="w-full text-sm"><thead className="text-xs text-text-muted"><tr><th className="py-2 text-right">اسم الجزء</th><th className="py-2 text-right">العدد</th></tr></thead><tbody className="divide-y divide-border">
            {detail.parts.map((p) => (
              <tr key={p.partName}><td className="py-2 text-text-base">{p.partName}</td><td className="py-2 font-medium text-text-base">{p.count}</td></tr>
            ))}
          </tbody></table>
        )}
      </div>
      {detail.consumptionEntries.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4">
          <h3 className="mb-3 font-semibold text-text-base">المواد المستهلكة</h3>
          <table className="w-full text-sm"><tbody className="divide-y divide-border">
            {detail.consumptionEntries.map((c, i) => (
              <tr key={i}><td className="py-2 text-text-base">{c.stockItemName}{c.color ? ` — ${c.color}` : ''}</td><td className="py-2 text-right font-medium text-text-base">{c.quantity}</td></tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}

export function CuttingSessionDetail({ id, onBack }: CuttingSessionDetailProps) {
  const { detail, loading, error } = useCuttingDetail(id);
  if (loading) return <div className="animate-pulse space-y-4" dir="rtl"><div className="h-32 rounded-xl bg-border" /><div className="h-24 rounded-xl bg-border" /></div>;
  if (error) return <div dir="rtl"><ErrorAlert message={error} /></div>;
  if (!detail) return <div dir="rtl" className="text-text-muted">الجلسة غير موجودة</div>;
  return (
    <div dir="rtl" className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-base"><ArrowRight size={16} />العودة إلى القص</button>
      <DetailView detail={detail} />
    </div>
  );
}
