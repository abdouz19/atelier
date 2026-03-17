'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-5 py-3 shadow-lg text-sm font-medium ${
        isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
      dir="rtl"
    >
      {isSuccess ? <CheckCircle size={18} /> : <XCircle size={18} />}
      <span>{message}</span>
    </div>
  );
}
