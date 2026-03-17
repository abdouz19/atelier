'use client';

import { useState, useEffect, useCallback } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { StockItemSummary } from '@/features/stock/stock.types';

export function useStockList() {
  const [items, setItems] = useState<StockItemSummary[]>([]);
  const [archivedItems, setArchivedItems] = useState<StockItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActive = useCallback(async () => {
    const res = await ipcClient.stock.getAll();
    if (res.success) setItems(res.data);
    else setError(res.error);
  }, []);

  const fetchArchived = useCallback(async () => {
    const res = await ipcClient.stock.getArchived();
    if (res.success) setArchivedItems(res.data);
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchActive(), fetchArchived()]);
    } finally {
      setLoading(false);
    }
  }, [fetchActive, fetchArchived]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, archivedItems, loading, error, refetch };
}
