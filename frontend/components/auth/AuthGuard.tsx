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
      <div className="flex h-screen items-center justify-center bg-[#0b0f1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-indigo-400/20 border-t-indigo-400" />
      </div>
    );
  }

  return <>{children}</>;
}
