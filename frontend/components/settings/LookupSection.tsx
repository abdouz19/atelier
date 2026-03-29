'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { LookupEntry } from '@/features/lookups/lookups.types';

interface LookupSectionProps {
  title: string;
  items: LookupEntry[];
  loading: boolean;
  addLabel: string;
  onAdd: (name: string) => Promise<void>;
  onEdit: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.08)',
  color: 'var(--cell-text)',
};

export function LookupSection({ title, items, loading, addLabel, onAdd, onEdit, onDelete }: LookupSectionProps) {
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const userItems = items.filter((i) => !i.isPredefined);

  async function handleAdd() {
    const trimmed = addName.trim();
    if (!trimmed) { setAddError('الاسم مطلوب'); return; }
    setAddSaving(true); setAddError(null);
    try { await onAdd(trimmed); setAddName(''); }
    catch (e) { setAddError(e instanceof Error ? e.message : 'حدث خطأ'); }
    finally { setAddSaving(false); }
  }

  async function handleEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) { setEditError('الاسم مطلوب'); return; }
    setEditError(null);
    try { await onEdit(id, trimmed); setEditingId(null); }
    catch (e) { setEditError(e instanceof Error ? e.message : 'حدث خطأ'); }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleteSaving(true);
    try { await onDelete(deleteId); }
    finally { setDeleteSaving(false); setDeleteId(null); }
  }

  return (
    <div
      dir="rtl"
      className="overflow-hidden rounded-2xl border"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'var(--card-border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--divider)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--cell-text)' }}>{title}</h2>
        {!loading && (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
            style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}
          >
            {items.length}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* add row */}
        <div className="mb-3 flex gap-2">
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder={addLabel}
            className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors"
            style={inputStyle}
            onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)'; }}
            onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={addSaving}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.22)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.15)'; }}
          >
            <Plus size={13} />
            {addSaving ? '...' : 'إضافة'}
          </button>
        </div>
        {addError && <p className="mb-2 text-xs" style={{ color: '#f87171' }}>{addError}</p>}

        {/* list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-7 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-3 text-center text-xs" style={{ color: 'var(--cell-dim)' }}>لا توجد عناصر</p>
        ) : (
          <ul className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 py-2"
                style={{ borderColor: 'var(--divider)' }}
              >
                {editingId === item.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleEdit(item.id); }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 rounded-lg border px-2 py-1 text-sm outline-none"
                      style={inputStyle}
                      autoFocus
                    />
                    {editError && <p className="text-xs" style={{ color: '#f87171' }}>{editError}</p>}
                    <button
                      type="button"
                      onClick={() => handleEdit(item.id)}
                      style={{ color: '#34d399' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#6ee7b7'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#34d399'; }}
                    >
                      <Check size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{ color: 'var(--cell-dim)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
                    >
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm" style={{ color: '#cbd5e1' }}>{item.name}</span>
                    {item.isPredefined && (
                      <span
                        className="rounded px-1.5 py-0.5 text-xs"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--cell-dim)' }}
                      >
                        ثابت
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={item.isPredefined}
                      onClick={() => { setEditingId(item.id); setEditName(item.name); setEditError(null); }}
                      className="disabled:opacity-20 transition-colors"
                      style={{ color: 'var(--cell-dim)' }}
                      onMouseEnter={!item.isPredefined ? (e) => { (e.currentTarget as HTMLElement).style.color = '#a78bfa'; } : undefined}
                      onMouseLeave={!item.isPredefined ? (e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; } : undefined}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={item.isPredefined}
                      onClick={() => setDeleteId(item.id)}
                      className="disabled:opacity-20 transition-colors"
                      style={{ color: 'var(--cell-dim)' }}
                      onMouseEnter={!item.isPredefined ? (e) => { (e.currentTarget as HTMLElement).style.color = '#f87171'; } : undefined}
                      onMouseLeave={!item.isPredefined ? (e) => { (e.currentTarget as HTMLElement).style.color = '#475569'; } : undefined}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {userItems.length === 0 && !loading && items.length > 0 && (
          <p className="mt-2 text-center text-xs" style={{ color: 'var(--cell-faint)' }}>لا توجد عناصر مضافة من المستخدم</p>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="حذف العنصر"
        message="هل تريد حذف هذا العنصر؟ سيختفي من القوائم المنسدلة ولكن تبقى البيانات القديمة كما هي."
        confirmLabel="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteSaving}
      />
    </div>
  );
}
