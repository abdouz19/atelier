'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ipcClient } from '@/lib/ipc-client';
import { useAuthStore } from '@/store/useAuthStore';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, currentUser, setAuth, clearAuth } = useAuthStore();

  async function login(username: string, password: string): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ipcClient.auth.login({ username, password });
      if (!response.success) {
        setError(response.error);
        return;
      }
      setAuth(response.data.user, response.data.sessionToken);
      router.push('/dashboard');
    } catch {
      setError('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(): Promise<void> {
    setIsLoading(true);
    try {
      await ipcClient.auth.logout();
    } finally {
      clearAuth();
      router.push('/login');
      setIsLoading(false);
    }
  }

  return {
    login,
    logout,
    isLoading,
    error,
    clearError: () => setError(null),
    currentUser,
    isAuthenticated,
  };
}
