import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ipcClient } from '@/lib/ipc-client';
import type { PiecesAvailabilityRow } from '@/features/pieces/pieces.types';

export type RowClassification = 'zero' | 'low' | 'ok';

export interface PiecesFilters {
  modelName: string;
  partName: string;
  sizeLabel: string;
  color: string;
}

export function usePiecesAvailability() {
  const router = useRouter();
  const [rows, setRows] = useState<PiecesAvailabilityRow[]>([]);
  const [threshold, setThresholdState] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PiecesFilters>({ modelName: '', partName: '', sizeLabel: '', color: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      ipcClient.pieces.getAvailability({}),
      ipcClient.pieces.getLowStockThreshold(),
    ]).then(([rowsRes, thresholdRes]) => {
      if (cancelled) return;
      if (rowsRes.success) setRows(rowsRes.data);
      else setError(rowsRes.error);
      if (thresholdRes.success) setThresholdState(thresholdRes.data.threshold);
    }).catch(err => {
      if (!cancelled) setError(String(err));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const setThreshold = useCallback(async (value: number) => {
    setThresholdState(value);
    await ipcClient.pieces.setLowStockThreshold({ threshold: value });
  }, []);

  const classify = useCallback((row: PiecesAvailabilityRow): RowClassification => {
    if (row.notDistributed === 0) return 'zero';
    if (row.notDistributed <= threshold) return 'low';
    return 'ok';
  }, [threshold]);

  const filteredRows = rows.filter(row => {
    if (filters.modelName && row.modelName !== filters.modelName) return false;
    if (filters.partName && row.partName !== filters.partName) return false;
    if (filters.sizeLabel && row.sizeLabel !== filters.sizeLabel) return false;
    if (filters.color && row.color !== filters.color) return false;
    return true;
  });

  const onRecut = useCallback((row: PiecesAvailabilityRow) => {
    const params = new URLSearchParams();
    params.set('modelName', row.modelName);
    params.set('color', row.color);
    router.push(`/cutting?${params.toString()}`);
  }, [router]);

  return { rows: filteredRows, allRows: rows, threshold, setThreshold, loading, error, filters, setFilters, classify, onRecut };
}
