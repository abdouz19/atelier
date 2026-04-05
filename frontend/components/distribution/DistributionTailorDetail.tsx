'use client';

import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { useDistributionDetail } from '@/hooks/useDistributionDetail';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { EmptyState } from '@/components/shared/EmptyState';
import { LogPaymentModal } from './LogPaymentModal';
import type { DistributionBatchRow } from '@/features/distribution/distribution.types';

interface DistributionTailorDetailProps {
  tailorId: string;
  onBack: () => void;
  onReturnClick?: (batchId: string, modelName: string, remaining: number) => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB');
}

function BatchCard({ batch, onReturn }: { batch: DistributionBatchRow; onReturn?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isFullyReturned = batch.remainingQuantity <= 0;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: isFullyReturned ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
        background: isFullyReturned ? 'rgba(255,255,255,0.015)' : 'var(--card-bg)',
        opacity: isFullyReturned ? 0.7 : 1,
      }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3" style={{ background: isFullyReturned ? 'transparent' : 'rgba(255,255,255,0.03)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: isFullyReturned ? '#475569' : 'var(--cell-text)' }}>
              {batch.modelName}
            </span>
            {batch.sizeLabel && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>{batch.sizeLabel}</span>}
            {batch.color && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>{batch.color}</span>}
            <span className="text-xs" style={{ color: '#475569' }}>{formatDate(batch.distributionDate)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-4 text-xs">
            <span style={{ color: 'var(--cell-muted)' }}>
              القطع المتوقعة: <strong style={{ color: 'var(--cell-text)' }}>{batch.expectedPiecesCount}</strong>
            </span>
            <span style={{ color: 'var(--cell-muted)' }}>
              مرتجع: <strong style={{ color: '#34d399' }}>{batch.expectedPiecesCount - batch.remainingQuantity}</strong>
            </span>
            {batch.remainingQuantity > 0 && (
              <span style={{ color: 'var(--cell-muted)' }}>
                متبقي: <strong style={{ color: '#fb923c' }}>{batch.remainingQuantity}</strong>
              </span>
            )}
            {isFullyReturned && (
              <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>مكتمل</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isFullyReturned && onReturn && (
            <button
              onClick={onReturn}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              ارتجاع
            </button>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="rounded p-1 transition-colors hover:bg-base"
            style={{ color: '#475569' }}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Cost summary row */}
      {(batch.sewingCost != null || batch.piecesCost != null) && (
        <div className="flex gap-4 px-4 py-2 text-xs border-t" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(251,191,36,0.03)' }}>
          {batch.piecesCost != null && (
            <span style={{ color: 'var(--cell-muted)' }}>أجزاء: <strong style={{ color: '#fbbf24' }}>{batch.piecesCost.toFixed(2)} دج</strong></span>
          )}
          {batch.sewingCost != null && (
            <span style={{ color: 'var(--cell-muted)' }}>خياطة: <strong style={{ color: '#fbbf24' }}>{batch.sewingCost.toFixed(2)} دج</strong></span>
          )}
          {batch.materialsCost != null && batch.materialsCost > 0 && (
            <span style={{ color: 'var(--cell-muted)' }}>مواد: <strong style={{ color: '#fbbf24' }}>{batch.materialsCost.toFixed(2)} دج</strong></span>
          )}
          <span style={{ color: 'var(--cell-muted)' }}>الإجمالي: <strong style={{ color: '#fbbf24' }}>{batch.totalCost.toFixed(2)} دج</strong></span>
          {batch.costPerFinalItem != null && (
            <span style={{ color: 'var(--cell-muted)' }}>تكلفة/قطعة: <strong style={{ color: '#fbbf24' }}>{batch.costPerFinalItem.toFixed(2)} دج</strong></span>
          )}
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t space-y-3 p-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {/* Parts */}
          {batch.parts.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: '#475569' }}>الأجزاء المعطاة</p>
              <div className="flex flex-wrap gap-2">
                {batch.parts.map(p => (
                  <div key={p.partName} className="rounded-lg px-3 py-1.5 text-xs" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <span style={{ color: '#60a5fa' }}>{p.partName}</span>
                    <span className="mx-1" style={{ color: '#475569' }}>×</span>
                    <span style={{ color: 'var(--cell-text)' }}>{p.quantity}</span>
                    {p.avgUnitCost != null && (
                      <span className="mr-1" style={{ color: 'var(--cell-muted)' }}>({p.avgUnitCost.toFixed(2)} دج/وحدة)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consumed materials */}
          {batch.consumedMaterials.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: '#475569' }}>المواد المستهلكة</p>
              <div className="flex flex-wrap gap-2">
                {batch.consumedMaterials.map((m, i) => (
                  <span key={i} className="rounded px-2 py-1 text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--cell-muted)' }}>
                    {m.itemName}{m.color ? ` (${m.color})` : ''}: {m.quantity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Returns */}
          {batch.returns.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: '#475569' }}>سجل الارتجاعات</p>
              <div className="space-y-1">
                {batch.returns.map(r => (
                  <div key={r.id} className="flex items-center gap-4 rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(16,185,129,0.05)' }}>
                    <span style={{ color: '#34d399' }}>+{r.quantityReturned} قطعة</span>
                    <span style={{ color: '#475569' }}>{formatDate(r.returnDate)}</span>
                    {r.consumptionEntries.length > 0 && (
                      <span style={{ color: 'var(--cell-muted)' }}>
                        مستهلك: {r.consumptionEntries.map(c => `${c.stockItemName}${c.color ? ` (${c.color})` : ''}: ${c.quantity}`).join('، ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DistributionTailorDetail({ tailorId, onBack, onReturnClick }: DistributionTailorDetailProps) {
  const { detail, loading, error, refetch } = useDistributionDetail(tailorId);
  const [showPayment, setShowPayment] = useState(false);

  if (loading) return <div className="p-6 text-center text-text-muted">جاري التحميل...</div>;
  if (error) return <div className="p-6"><ErrorAlert message={error} /></div>;
  if (!detail) return null;

  const activeBatches = detail.batches.filter(b => b.remainingQuantity > 0);
  const completedBatches = detail.batches.filter(b => b.remainingQuantity <= 0);

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-lg p-1.5 transition-colors hover:bg-base">
            <ArrowRight size={18} style={{ color: 'var(--cell-muted)' }} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
              {detail.tailorName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--cell-text)' }}>{detail.tailorName}</h2>
          </div>
        </div>
      </div>

      {detail.batches.length === 0 ? (
        <EmptyState message="لا توجد توزيعات لهذا الخياط" />
      ) : (
        <>
          {/* Active distributions */}
          {activeBatches.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: '#fb923c' }}>
                توزيعات نشطة ({activeBatches.length})
              </h3>
              {activeBatches.map(batch => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onReturn={onReturnClick ? () => onReturnClick(batch.id, batch.modelName, batch.remainingQuantity) : undefined}
                />
              ))}
            </div>
          )}

          {/* Completed distributions */}
          {completedBatches.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: '#475569' }}>
                توزيعات مكتملة ({completedBatches.length})
              </h3>
              {completedBatches.map(batch => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          )}

          {/* Financial summary */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: '#fbbf24' }}>الملخص المالي</h3>
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <CreditCard size={13} />
                تسجيل دفعة
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--cell-muted)' }}>إجمالي المكتسب</span>
                <span className="font-semibold tabular-nums" style={{ color: '#34d399' }}>{detail.totalEarned.toFixed(2)} دج</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--cell-muted)' }}>المدفوع</span>
                <span className="tabular-nums" style={{ color: 'var(--cell-text)' }}>{detail.settledAmount.toFixed(2)} دج</span>
              </div>
              <div className="flex justify-between border-t pt-2" style={{ borderColor: 'rgba(251,191,36,0.15)' }}>
                <span className="font-semibold" style={{ color: '#fbbf24' }}>الرصيد المستحق</span>
                <span className="font-bold tabular-nums" style={{ color: detail.remainingBalance > 0 ? '#f87171' : '#34d399' }}>
                  {detail.remainingBalance.toFixed(2)} دج
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {showPayment && (
        <LogPaymentModal
          tailorId={tailorId}
          tailorName={detail.tailorName}
          remainingBalance={detail.remainingBalance}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); refetch(); }}
        />
      )}
    </div>
  );
}
