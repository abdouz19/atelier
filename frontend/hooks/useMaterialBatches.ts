'use client';

import { useState, useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { MaterialBatch } from '@/features/cutting/cutting.types';

export function useMaterialBatches(stockItemId: string | null, color?: string | null) {
  const [batches, setBatches] = useState<MaterialBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockItemId) {
      setBatches([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    ipcClient.cutting.getMaterialBatches({ stockItemId, color: color ?? null }).then(res => {
      if (res.success) {
        setBatches(res.data);
      } else {
        setError(res.error);
        setBatches([]);
      }
      setIsLoading(false);
    });
  }, [stockItemId, color]);

  return { batches, isLoading, error };
}
