'use client';

import { UserCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export function Topbar() {
  const currentUser = useAuthStore((s) => s.currentUser);

  const initials = currentUser?.full_name
    ? currentUser.full_name.charAt(0)
    : 'م';

  return (
    <header
      className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6"
      dir="rtl"
    >
      <div className="text-sm text-gray-500">أتيلييه</div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">
          {currentUser?.full_name ?? ''}
        </span>
        {currentUser?.avatar_url ? (
          <img
            src={currentUser.avatar_url}
            alt={currentUser.full_name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
