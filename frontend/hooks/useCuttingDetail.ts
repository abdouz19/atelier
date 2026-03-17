'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { CuttingSessionDetail } from '@/features/cutting/cutting.types';

export function useCuttingDetail(id: string) {
  const [detail, setDetail] = useState<CuttingSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const res = await ipcClient.cutting.getById({ id });
    if (res.success) setDetail(res.data);
    else setError(res.error);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { detail, loading, error };
}
