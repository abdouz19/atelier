'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { useStockList } from '@/hooks/useStockList';
import { useStockItem } from '@/hooks/useStockItem';
import { useSupplierList } from '@/hooks/useSupplierList';
import { useLookups } from '@/hooks/useLookups';
import { StockTable } from '@/components/stock/StockTable';
import { ArchivedItemsView } from '@/components/stock/ArchivedItemsView';
import { AddItemModal } from '@/components/stock/AddItemModal';
import { AddInboundModal } from '@/components/stock/AddInboundModal';
import { ItemDetailPanel } from '@/components/stock/ItemDetailPanel';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { Toast } from '@/components/shared/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { ipcClient } from '@/lib/ipc-client';
import type { StockItemSummary } from '@/features/stock/stock.types';

// ─── Detail view ─────────────────────────────────────────────────────────────

function StockDetailView({ id, onBack, onRefetch: refetchList, suppliers }: {
  id: string;
  onBack: () => void;
  onRefetch: () => Promise<void>;
  suppliers: import('@/features/suppliers/suppliers.types').SupplierSummary[];
}) {
  const { item, loading, error, refetch } = useStockItem(id);
  const router = useRouter();

  if (loading) {
    return (
      <div className="animate-pulse space-y-4" dir="rtl">
        <div className="h-8 w-48 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-4 w-32 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
        </div>
      </div>
    );
  }

  if (error) return <div dir="rtl"><ErrorAlert message={error} /></div>;
  if (!item) return <div dir="rtl" style={{ color: '#475569' }}>الصنف غير موجود</div>;

  async function handleRefetch() {
    await refetch();
    await refetchList();
  }

  return (
    <ItemDetailPanel
      item={item}
      suppliers={suppliers}
      onBack={onBack}
      onRefetch={handleRefetch}
      onArchived={() => router.replace('/stock?tab=archived')}
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function StockPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get('tab') as 'active' | 'archived') ?? 'active';
  const searchQuery = searchParams.get('q') ?? '';
  const typeFilter = searchParams.get('type') ?? '';
  const selectedId = searchParams.get('id') ?? '';

  const { items, archivedItems, loading, error, refetch } = useStockList();
  const { suppliers } = useSupplierList();
  const { types: lookupTypes } = useLookups();

  const [showAddItem, setShowAddItem] = useState(false);
  const [addInboundItem, setAddInboundItem] = useState<StockItemSummary | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<StockItemSummary | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/stock?${params.toString()}`);
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const res = await ipcClient.stock.archive({ id: archiveTarget.id });
      if (res.success) {
        setToast({ message: 'تم أرشفة الصنف', type: 'success' });
        await refetch();
      } else {
        setToast({ message: res.error, type: 'error' });
      }
    } finally {
      setArchiving(false);
      setArchiveTarget(null);
    }
  }

  // Detail view
  if (selectedId) {
    return (
      <>
        <StockDetailView
          id={selectedId}
          onBack={() => router.replace('/stock')}
          onRefetch={refetch}
          suppliers={suppliers}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  const skeletonRows = Array.from({ length: 5 });

  return (
    <div dir="rtl">
      <PageHeader
        title="المخزون"
        subtitle="إدارة أصناف القماش والمواد"
        icon={<Package size={17} />}
        actions={
          <button
            onClick={() => setShowAddItem(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Plus size={16} />
            إضافة صنف
          </button>
        }
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl p-1 w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {(['active', 'archived'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setParam('tab', t === 'active' ? '' : t)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150"
            style={tab === t
              ? { background: 'rgba(255,255,255,0.08)', color: '#f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }
              : { color: '#475569' }}
          >
            {t === 'active' ? 'نشط' : 'مؤرشف'}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {/* Loading skeleton */}
      {loading ? (
        <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="animate-pulse divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {skeletonRows.map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4">
                <div className="h-4 w-40 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-4 w-20 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-4 w-16 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'active' ? (
        <StockTable
          items={items}
          types={lookupTypes.map(t => t.name)}
          searchQuery={searchQuery}
          typeFilter={typeFilter}
          onSearchChange={(v) => setParam('q', v)}
          onTypeFilterChange={(v) => setParam('type', v)}
          onRowClick={(id) => setParam('id', id)}
          onAddInbound={(item) => setAddInboundItem(item)}
          onArchive={(item) => setArchiveTarget(item)}
        />
      ) : (
        <ArchivedItemsView
          items={archivedItems}
          onRefetch={refetch}
          onToast={setToast}
        />
      )}

      {/* Modals */}
      {showAddItem && (
        <AddItemModal
          suppliers={suppliers}
          onClose={() => setShowAddItem(false)}
          onSuccess={async () => {
            setShowAddItem(false);
            setToast({ message: 'تم إضافة الصنف بنجاح', type: 'success' });
            await refetch();
          }}
        />
      )}

      {addInboundItem && (
        <AddInboundModal
          item={addInboundItem}
          suppliers={suppliers}
          onClose={() => setAddInboundItem(null)}
          onSuccess={async () => {
            setAddInboundItem(null);
            setToast({ message: 'تم تسجيل الكمية بنجاح', type: 'success' });
            await refetch();
          }}
        />
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        title="تأكيد الأرشفة"
        message="هل أنت متأكد من أرشفة هذا الصنف؟ يمكنك استعادته لاحقاً."
        confirmLabel="أرشفة"
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
        loading={archiving}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<div className="p-6" style={{ color: '#475569' }}>جاري التحميل...</div>}>
      <StockPageContent />
    </Suspense>
  );
}
