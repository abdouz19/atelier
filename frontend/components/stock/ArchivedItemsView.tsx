'use client';

import { ipcClient } from '@/lib/ipc-client';
import type { StockItemSummary } from '@/features/stock/stock.types';

interface ArchivedItemsViewProps {
  items: StockItemSummary[];
  onRefetch: () => Promise<void>;
  onToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

export function ArchivedItemsView({ items, onRefetch, onToast }: ArchivedItemsViewProps) {
  async function handleRestore(id: string) {
    const res = await ipcClient.stock.restore({ id });
    if (res.success) {
      onToast({ message: 'تم استعادة الصنف', type: 'success' });
      await onRefetch();
    } else {
      onToast({ message: res.error, type: 'error' });
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
        <p className="text-sm text-gray-500">لا توجد أصناف مؤرشفة</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-right">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-sm font-medium text-gray-600">الاسم</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-600">النوع</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-600">الوحدة</th>
            <th className="px-4 py-3 text-sm font-medium text-gray-600">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{item.type}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleRestore(item.id)}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  استعادة
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
