'use client';

import { useState } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import { useAuthStore } from '@/store/useAuthStore';

export function useUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const currentUser = useAuthStore((s) => s.currentUser);

  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!currentUser) throw new Error('لا يوجد مستخدم مسجل الدخول');
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await ipcClient.user.changePassword({
        userId: currentUser.id,
        currentPassword,
        newPassword,
      });
      if (!response.success) {
        setError(response.error);
        return;
      }
      setSuccess(true);
    } catch {
      setError('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    changePassword,
    isLoading,
    error,
    success,
    clearStatus: () => {
      setError(null);
      setSuccess(false);
    },
  };
}
