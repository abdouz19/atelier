'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClass: Record<ModalSize, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-2xl',
};

interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  stepIndicator?: React.ReactNode;
}

export function AppModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  stepIndicator,
}: AppModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`${sizeClass[size]} flex max-h-[90vh] flex-col rounded-2xl bg-surface shadow-2xl`} dir="rtl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-5">
          <h2 className="text-base font-semibold text-text-base">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-base hover:text-text-base"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        {stepIndicator && (
          <div className="flex-shrink-0 border-b border-border px-5 py-3">
            {stepIndicator}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
