'use client';

import { useState, useCallback, useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { SupplierDetail } from '@/features/suppliers/suppliers.types';

export function useSupplierDetail(id: string) {
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const res = await ipcClient.suppliers.getById({ id });
    if (res.success) setSupplier(res.data);
    else setError(res.error);
    setLoading(false);
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { supplier, loading, error, refetch };
}
