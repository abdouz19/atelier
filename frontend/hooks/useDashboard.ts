import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ipcClient } from '@/lib/ipc-client';
import type {
  DashboardSnapshotKpis,
  DashboardPeriodKpis,
  PipelineStage,
  ActivityEntry,
  DashboardChartData,
  DashboardFilters,
  CriticalCombination,
} from '@/features/dashboard/dashboard.types';

function getMonthBounds(): { startDate: number; endDate: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate: start.getTime(), endDate: end.getTime() };
}

export function useDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL; fall back to current-month defaults
  const defaults = getMonthBounds();
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const modelParam = searchParams.get('model') ?? '';

  const filters: DashboardFilters = {
    startDate: fromParam ? Number(fromParam) : defaults.startDate,
    endDate: toParam ? Number(toParam) : defaults.endDate,
    modelName: modelParam,
  };

  const [snapshotKpis, setSnapshotKpis] = useState<DashboardSnapshotKpis | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [criticalCombinations, setCriticalCombinations] = useState<CriticalCombination[]>([]);
  const [periodKpis, setPeriodKpis] = useState<DashboardPeriodKpis | null>(null);
  const [chartData, setChartData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch snapshot data (never re-fetched on filter change)
  const fetchSnapshot = useCallback(async () => {
    const res = await ipcClient.dashboard.getSnapshotData();
    if (!res.success) return res.error;
    setSnapshotKpis(res.data.kpis);
    setPipeline(res.data.pipeline);
    setActivity(res.data.activity);
    setCriticalCombinations(res.data.criticalCombinations ?? []);
    return null;
  }, []);

  // Fetch period KPIs + chart data (re-fetched on filter change)
  const fetchPeriodData = useCallback(async (f: DashboardFilters) => {
    const [periodRes, chartRes] = await Promise.all([
      ipcClient.dashboard.getPeriodKpis({ startDate: f.startDate, endDate: f.endDate }),
      ipcClient.dashboard.getChartData({
        startDate: f.startDate,
        endDate: f.endDate,
        modelName: f.modelName || undefined,
      }),
    ]);
    if (!periodRes.success) return periodRes.error;
    if (!chartRes.success) return chartRes.error;
    setPeriodKpis(periodRes.data);
    setChartData(chartRes.data);
    return null;
  }, []);

  // Initial load: all 3 channels in parallel
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchSnapshot(), fetchPeriodData(filters)]).then(([snapErr, periodErr]) => {
      if (cancelled) return;
      const err = snapErr ?? periodErr;
      if (err) setError(err);
      setLoading(false);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch period data when filters change (not on mount — handled above)
  const prevFiltersRef = { startDate: defaults.startDate, endDate: defaults.endDate, modelName: '' };
  const filtersKey = `${filters.startDate}|${filters.endDate}|${filters.modelName}`;
  const defaultsKey = `${defaults.startDate}|${defaults.endDate}|`;

  useEffect(() => {
    if (filtersKey === defaultsKey) return; // skip initial render (defaults)
    setLoading(true);
    setError(null);
    fetchPeriodData(filters).then(err => {
      if (err) setError(err);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  function setFilters(newFilters: Partial<DashboardFilters>) {
    const merged = { ...filters, ...newFilters };
    const params = new URLSearchParams(searchParams.toString());
    params.set('from', String(merged.startDate));
    params.set('to', String(merged.endDate));
    if (merged.modelName) params.set('model', merged.modelName);
    else params.delete('model');
    router.replace(`/dashboard?${params.toString()}`);
  }

  return {
    snapshotKpis,
    periodKpis,
    pipeline,
    activity,
    criticalCombinations,
    chartData,
    loading,
    error,
    filters,
    setFilters,
  };
}
