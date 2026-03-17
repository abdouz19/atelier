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
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 disabled:opacity-50 ${error ? 'border-red-400' : 'border-gray-300'} bg-white`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{value ? selectedLabel : placeholder}</span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <ul className="max-h-48 overflow-y-auto py-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => { onChange(item.name); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-900 hover:bg-blue-50 ${item.name === value ? 'bg-blue-50 font-medium' : ''}`}
                >
                  {item.name}
                  {item.isPredefined && <span className="mr-auto rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">ثابت</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 px-2 py-1.5">
            {!addMode ? (
              <button type="button" onClick={() => setAddMode(true)} className="w-full rounded px-2 py-1 text-right text-sm text-blue-600 hover:bg-blue-50">
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
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 outline-none focus:border-blue-500"
                />
                {addError && <p className="text-xs text-red-600">{addError}</p>}
                <div className="flex gap-1">
                  <button type="button" onClick={handleSave} disabled={saving} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-60">
                    {saving ? '...' : 'حفظ'}
                  </button>
                  <button type="button" onClick={() => setAddMode(false)} className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">إلغاء</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
