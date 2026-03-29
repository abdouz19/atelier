'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { SPRING } from '@/components/layout/PageTransition';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClass: Record<ModalSize, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-2xl',
};

const panelVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: SPRING },
  exit:    { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`${sizeClass[size]} flex max-h-[90vh] flex-col rounded-2xl bg-surface shadow-2xl`}
            style={{ border: '1px solid var(--glass-border)' }}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-5">
              <h2 className="text-base font-semibold text-text-base">{title}</h2>
              <button
                onClick={onClose}
                className="btn-tactile rounded-lg p-1.5 text-text-muted hover:bg-base hover:text-text-base"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
