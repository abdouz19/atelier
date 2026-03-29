'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { SupplierTableRow } from './SupplierTableRow';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

interface SupplierTableProps {
  suppliers: SupplierSummary[];
  onRowClick: (id: string) => void;
  onEdit: (supplier: SupplierSummary) => void;
  onDelete: (supplier: SupplierSummary) => void;
}

export function SupplierTable({ suppliers, onRowClick, onEdit, onDelete }: SupplierTableProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? suppliers.filter((s) => s.name.includes(search) || (s.phone ?? '').includes(search))
    : suppliers;

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--cell-dim)' }}>لا يوجد موردون بعد</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--cell-faint)' }}>أضف أول مورد باستخدام الزر أعلاه</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* violet accent bar */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #a78bfa, transparent)', opacity: 0.7 }} />

      {/* search */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--divider)' }}>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--cell-dim)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="w-full rounded-lg border py-1.5 pr-8 pl-3 text-sm outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}
            dir="rtl"
          />
        </div>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
          {filtered.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="sticky top-0 z-10 text-xs font-semibold" style={{ background: 'var(--table-head-bg)' }}>
            <tr>
              {['الاسم', 'الهاتف', 'العنوان', 'المنتجات', 'ملاحظات', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-right" style={{ color: 'var(--cell-faint)', borderBottom: '1px solid var(--table-head-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--cell-dim)' }}>لا توجد نتائج</td>
              </tr>
            ) : (
              filtered.map((s) => (
                <SupplierTableRow
                  key={s.id}
                  supplier={s}
                  onClick={() => onRowClick(s.id)}
                  onEdit={() => onEdit(s)}
                  onDelete={() => onDelete(s)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
