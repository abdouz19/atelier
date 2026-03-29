'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LookupEntry } from '@/features/lookups/lookups.types';

interface ManagedDropdownProps {
  value: string;
  onChange: (value: string) => void;
  items: LookupEntry[];
  placeholder?: string;
  addLabel: string;
  onAddNew: (name: string) => Promise<{ success: boolean; error?: string; data?: LookupEntry }>;
  disabled?: boolean;
  error?: string;
}

export function ManagedDropdown({
  value, onChange, items, placeholder = 'اختر', addLabel, onAddNew, disabled, error,
}: ManagedDropdownProps) {
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setAddMode(false); setNewName(''); setAddError(null); }
  }, [open]);

  useEffect(() => {
    if (addMode) inputRef.current?.focus();
  }, [addMode]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const selectedLabel = items.find((i) => i.name === value)?.name ?? value;

  async function handleSave() {
    const trimmed = newName.trim();
    if (!trimmed) { setAddError('الاسم مطلوب'); return; }
    setSaving(true);
    setAddError(null);
    const res = await onAddNew(trimmed);
    setSaving(false);
    if (res.success && res.data) {
      onChange(res.data.name);
      setOpen(false);
    } else {
      setAddError(res.error ?? 'حدث خطأ');
    }
  }

  return (
    <div ref={containerRef} className="relative" dir="rtl">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm text-text-base input-transition outline-none focus:border-primary-500 disabled:opacity-50 ${error ? 'border-red-400' : 'border-border'} bg-surface`}
      >
        <span className={value ? 'text-text-base' : 'text-text-muted'}>{value ? selectedLabel : placeholder}</span>
        <ChevronDown size={14} className="text-text-muted shrink-0" />
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
          <ul className="max-h-48 overflow-y-auto py-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => { onChange(item.name); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm text-text-base hover:bg-primary-500/10 ${item.name === value ? 'bg-primary-500/10 font-medium' : ''}`}
                >
                  {item.name}
                  {item.isPredefined && <span className="mr-auto rounded bg-base px-1.5 py-0.5 text-xs text-text-muted">ثابت</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-2 py-1.5">
            {!addMode ? (
              <button type="button" onClick={() => setAddMode(true)} className="w-full rounded px-2 py-1 text-right text-sm text-primary-500 hover:bg-primary-500/10">
                + {addLabel}
              </button>
            ) : (
              <div className="space-y-1">
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } if (e.key === 'Escape') setAddMode(false); }}
                  placeholder={addLabel}
                  className="w-full rounded border border-border px-2 py-1 text-sm text-text-base input-transition outline-none focus:border-primary-500"
                />
                {addError && <p className="text-xs text-red-600">{addError}</p>}
                <div className="flex gap-1">
                  <button type="button" onClick={handleSave} disabled={saving} className="rounded bg-primary-500 px-2 py-1 text-xs text-white hover:bg-primary-600 disabled:opacity-60">
                    {saving ? '...' : 'حفظ'}
                  </button>
                  <button type="button" onClick={() => setAddMode(false)} className="rounded border border-border px-2 py-1 text-xs text-text-muted hover:bg-base/60">إلغاء</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
