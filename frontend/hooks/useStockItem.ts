'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { StockItemDetail } from '@/features/stock/stock.types';

export function useStockItem(id: string) {
  const [item, setItem] = useState<StockItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await ipcClient.stock.getById({ id });
    if (res.success) setItem(res.data);
    else setError(res.error);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { item, loading, error, refetch: fetch };
}
