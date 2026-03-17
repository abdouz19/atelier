'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Plus, Pencil, Archive } from 'lucide-react';
import { ColorVariantCard } from './ColorVariantCard';
import { TransactionHistory } from './TransactionHistory';
import { AddInboundModal } from './AddInboundModal';
import { EditItemModal } from './EditItemModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Toast } from '@/components/shared/Toast';
import { ipcClient } from '@/lib/ipc-client';
import type { StockItemDetail, StockItemSummary } from '@/features/stock/stock.types';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

interface ItemDetailPanelProps {
  item: StockItemDetail;
  suppliers: SupplierSummary[];
  onBack: () => void;
  onRefetch: () => Promise<void>;
  onArchived: () => void;
}

export function ItemDetailPanel({ item, suppliers, onBack, onRefetch, onArchived }: ItemDetailPanelProps) {
  const [showAddInbound, setShowAddInbound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Build a StockItemSummary from the detail for AddInboundModal
  const itemSummary: StockItemSummary = {
    id: item.id,
    name: item.name,
    type: item.type,
    unit: item.unit,
    color: item.color,
    imagePath: item.imagePath,
    description: item.description,
    totalQuantity: item.totalQuantity,
    variantCount: item.variants.length,
    isLow: item.totalQuantity <= 0,
  };

  async function handleArchive() {
    setArchiving(true);
    const res = await ipcClient.stock.archive({ id: item.id });
    setArchiving(false);
    setShowArchiveConfirm(false);
    if (res.success) onArchived();
    else setToast({ message: res.error, type: 'error' });
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <ArrowRight size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-sm text-gray-500">{item.type} · {item.unit}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddInbound(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            إضافة وارد
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={16} />
            تعديل
          </button>
          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
            title="أرشفة"
          >
            <Archive size={16} />
          </button>
        </div>
      </div>

      {/* Meta info */}
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
        {item.imagePath && (
          <div className="flex justify-center sm:col-span-2">
            <Image
              src={item.imagePath}
              alt={item.name}
              width={160}
              height={160}
              className="h-40 w-40 rounded-xl object-cover"
              unoptimized
            />
          </div>
        )}
        {item.description && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-gray-400">الوصف</p>
            <p className="text-sm text-gray-700">{item.description}</p>
          </div>
        )}
        {item.notes && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-gray-400">ملاحظات</p>
            <p className="text-sm text-gray-700">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Variants */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-gray-800">الكميات</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {item.variants.map((v) => (
            <ColorVariantCard key={v.color ?? '__default__'} variant={v} unit={item.unit} />
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-800">سجل الحركات</h2>
        <TransactionHistory
          transactions={item.transactions}
          unit={item.unit}
          suppliers={suppliers}
          onRefetch={onRefetch}
        />
      </div>

      {/* Modals */}
      {showAddInbound && (
        <AddInboundModal
          item={itemSummary}
          suppliers={suppliers}
          onClose={() => setShowAddInbound(false)}
          onSuccess={async () => {
            setShowAddInbound(false);
            setToast({ message: 'تم تسجيل الكمية بنجاح', type: 'success' });
            await onRefetch();
          }}
        />
      )}

      {showEdit && (
        <EditItemModal
          item={item}
          onClose={() => setShowEdit(false)}
          onSuccess={async () => {
            setShowEdit(false);
            setToast({ message: 'تم تحديث البيانات', type: 'success' });
            await onRefetch();
          }}
        />
      )}

      <ConfirmDialog
        open={showArchiveConfirm}
        title="تأكيد الأرشفة"
        message="هل أنت متأكد من أرشفة هذا الصنف؟ يمكنك استعادته لاحقاً."
        confirmLabel="أرشفة"
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveConfirm(false)}
        loading={archiving}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
