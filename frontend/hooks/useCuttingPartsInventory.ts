'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { PartsInventoryRow } from '@/features/cutting/cutting.types';

export function useCuttingPartsInventory() {
  const [rows, setRows] = useState<PartsInventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await ipcClient.cutting.getPartsInventory();
    if (res.success) setRows(res.data);
    else setError(res.error);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { rows, isLoading, error, refetch: fetch };
}
