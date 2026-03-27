'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
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
    <div dir="rtl" className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-text-base">{title}</h2>

      <div className="mb-4 flex gap-2">
        <input value={addName} onChange={(e) => setAddName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder={addLabel}
          className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm text-text-base outline-none focus:border-primary-500" />
        <button type="button" onClick={handleAdd} disabled={addSaving}
          className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60">
          {addSaving ? '...' : 'إضافة'}
        </button>
      </div>
      {addError && <p className="mb-2 text-xs text-red-600">{addError}</p>}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => <div key={n} className="h-8 animate-pulse rounded-lg bg-base" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">لا توجد عناصر</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 py-2">
              {editingId === item.id ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEdit(item.id); } if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 rounded-lg border border-border px-2 py-1 text-sm text-text-base outline-none focus:border-primary-500" autoFocus />
                  {editError && <p className="text-xs text-red-600">{editError}</p>}
                  <button type="button" onClick={() => handleEdit(item.id)} className="text-green-600 hover:text-green-700"><Check size={15} /></button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-text-muted hover:text-text-base"><X size={15} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-text-base">{item.name}</span>
                  {item.isPredefined && <span className="rounded bg-base px-1.5 py-0.5 text-xs text-text-muted">ثابت</span>}
                  <button type="button" disabled={item.isPredefined} onClick={() => { setEditingId(item.id); setEditName(item.name); setEditError(null); }}
                    className="text-text-muted hover:text-primary-600 disabled:opacity-30"><Pencil size={14} /></button>
                  <button type="button" disabled={item.isPredefined} onClick={() => setDeleteId(item.id)}
                    className="text-text-muted hover:text-red-600 disabled:opacity-30"><Trash2 size={14} /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {userItems.length === 0 && !loading && items.length > 0 && (
        <p className="mt-2 text-center text-xs text-text-muted">لا توجد عناصر مضافة من المستخدم</p>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="حذف العنصر"
        message="هل تريد حذف هذا العنصر؟ سيختفي من القوائم المنسدلة ولكن يبقى البيانات القديمة كما هي."
        confirmLabel="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteSaving}
      />
    </div>
  );
}
