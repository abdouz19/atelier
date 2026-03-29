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
      <div className="rounded-2xl border px-6 py-12 text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <p className="text-sm" style={{ color: 'var(--cell-dim)' }}>لا توجد أصناف مؤرشفة</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #fb923c, transparent)', opacity: 0.7 }} />
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
            <tr>
              {['الاسم', 'النوع', 'الوحدة', 'إجراءات'].map((h) => (
                <th key={h} className="px-4 py-3 text-right" style={{ color: '#334155', borderBottom: '1px solid var(--table-head-border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {items.map((item) => (
              <tr key={item.id} className="odd:bg-surface even:bg-base/30 row-hover transition-colors">
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--cell-text)' }}>{item.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--cell-muted)' }}>{item.type}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--cell-muted)' }}>{item.unit}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="rounded-lg border px-3 py-1 text-xs font-medium transition-colors"
                    style={{ borderColor: 'rgba(251,146,60,0.25)', background: 'rgba(249,115,22,0.08)', color: '#fb923c' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.14)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.08)'; }}
                  >
                    استعادة
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
