import { useState, useCallback, useEffect } from 'react';
import { ipcClient } from '@/lib/ipc-client';
import type {
  FinalStockKpis,
  FinalStockRow,
  FinalStockHistoryEntry,
  FinalStockFilters,
} from '@/features/final-stock/final-stock.types';

const EMPTY_FILTERS: FinalStockFilters = { modelName: '', sizeLabel: '', color: '' };

export function useFinalStockList() {
  const [kpis, setKpis] = useState<FinalStockKpis | null>(null);
  const [rows, setRows] = useState<FinalStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<FinalStockFilters>(EMPTY_FILTERS);
  const [selectedRow, setSelectedRow] = useState<FinalStockRow | null>(null);
  const [history, setHistory] = useState<FinalStockHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchAll = useCallback(async (activeFilters: FinalStockFilters) => {
    setLoading(true);
    setError(null);
    const [kpisRes, rowsRes] = await Promise.all([
      ipcClient.finalStock.getKpis(),
      ipcClient.finalStock.getRows({
        modelName: activeFilters.modelName || undefined,
        sizeLabel: activeFilters.sizeLabel || undefined,
        color: activeFilters.color || undefined,
      }),
    ]);
    if (!kpisRes.success) { setError(kpisRes.error); setLoading(false); return; }
    if (!rowsRes.success) { setError(rowsRes.error); setLoading(false); return; }
    setKpis(kpisRes.data);
    setRows(rowsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll(EMPTY_FILTERS);
  }, [fetchAll]);

  const applyFilters = useCallback(async (newFilters: FinalStockFilters) => {
    setFiltersState(newFilters);
    setLoading(true);
    setError(null);
    const rowsRes = await ipcClient.finalStock.getRows({
      modelName: newFilters.modelName || undefined,
      sizeLabel: newFilters.sizeLabel || undefined,
      color: newFilters.color || undefined,
    });
    if (!rowsRes.success) { setError(rowsRes.error); setLoading(false); return; }
    setRows(rowsRes.data);
    setLoading(false);
  }, []);

  const openHistory = useCallback(async (row: FinalStockRow) => {
    setSelectedRow(row);
    setHistoryLoading(true);
    setHistoryError(null);
    const res = await ipcClient.finalStock.getHistory({
      modelName: row.modelName,
      partName: row.partName,
      sizeLabel: row.sizeLabel,
      color: row.color,
    });
    if (!res.success) {
      setHistoryError(res.error);
    } else {
      setHistory(res.data);
    }
    setHistoryLoading(false);
  }, []);

  const closeHistory = useCallback(() => {
    setSelectedRow(null);
    setHistory([]);
    setHistoryError(null);
  }, []);

  return {
    kpis,
    rows,
    loading,
    error,
    filters,
    applyFilters,
    selectedRow,
    history,
    historyLoading,
    historyError,
    openHistory,
    closeHistory,
  };
}
