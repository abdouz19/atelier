'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ipcClient } from '@/lib/ipc-client';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const { isAuthenticated, sessionToken, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    async function checkSession() {
      try {
        const payload = sessionToken ? { token: sessionToken } : undefined;
        const response = await ipcClient.auth.checkSession(payload);
        if (response.success) {
          setAuth(response.data.user, sessionToken ?? '');
        } else {
          clearAuth();
          router.replace('/login');
        }
      } catch {
        clearAuth();
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    }

    if (!isAuthenticated) {
      checkSession();
    } else {
      setIsChecking(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleSessionExpired() {
      clearAuth();
      router.replace('/login');
    }

    ipcClient.on('AUTH_SESSION_EXPIRED', handleSessionExpired);
    return () => {
      ipcClient.off('AUTH_SESSION_EXPIRED', handleSessionExpired);
    };
  }, [clearAuth, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
