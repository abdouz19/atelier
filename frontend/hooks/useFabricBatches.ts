'use client';

import { useState, useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type { FabricBatch } from '@/features/cutting/cutting.types';

export function useFabricBatches(stockItemId: string | null, color: string | null) {
  const [batches, setBatches] = useState<FabricBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockItemId || !color) {
      setBatches([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    ipcClient.cutting.getFabricBatches({ stockItemId, color }).then(res => {
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
