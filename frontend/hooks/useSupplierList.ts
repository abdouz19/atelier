'use client';

import { useState, useCallback, useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { SupplierSummary } from '@/features/suppliers/suppliers.types';

export function useSupplierList() {
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await ipcClient.suppliers.getAll();
    if (res.success) setSuppliers(res.data);
    else setError(res.error);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { suppliers, loading, error, refetch };
}
