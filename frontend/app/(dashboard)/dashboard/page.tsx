'use client';

import { Suspense } from 'react';
import { LayoutDashboard as _LayoutDashboard } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useLookups } from '@/hooks/useLookups';
import { DashboardKpiCards } from '@/components/dashboard/DashboardKpiCards';
import { PipelineWidget } from '@/components/dashboard/PipelineWidget';
import { MonthlyProductionChart } from '@/components/dashboard/MonthlyProductionChart';
import { PipelineDonutChart } from '@/components/dashboard/PipelineDonutChart';
import { TopTailorsChart } from '@/components/dashboard/TopTailorsChart';
import { TopModelsChart } from '@/components/dashboard/TopModelsChart';
import { FabricConsumptionChart } from '@/components/dashboard/FabricConsumptionChart';
import { EmployeeDebtChart } from '@/components/dashboard/EmployeeDebtChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { PiecesAvailabilityWidget } from '@/components/dashboard/PiecesAvailabilityWidget';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { PageHeader } from '@/components/shared/PageHeader';
import { AppCard } from '@/components/shared/AppCard';

function DashboardFilters({
  filters,
  models,
  onFiltersChange,
}: {
  filters: ReturnType<typeof useDashboard>['filters'];
  models: string[];
  onFiltersChange: ReturnType<typeof useDashboard>['setFilters'];
}) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600">من:</label>
        <input
          type="date"
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          value={new Date(filters.startDate).toISOString().slice(0, 10)}
          onChange={e => {
            const d = new Date(e.target.value);
            d.setHours(0, 0, 0, 0);
            onFiltersChange({ startDate: d.getTime() });
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600">إلى:</label>
        <input
          type="date"
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          value={new Date(filters.endDate).toISOString().slice(0, 10)}
          onChange={e => {
            const d = new Date(e.target.value);
            d.setHours(23, 59, 59, 999);
            onFiltersChange({ endDate: d.getTime() });
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-600">الموديل:</label>
        <select
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          value={filters.modelName}
          onChange={e => onFiltersChange({ modelName: e.target.value })}
        >
          <option value="">الكل</option>
          {models.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function DashboardPageContent() {
  const {
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
  } = useDashboard();

  const { models } = useLookups();
  const modelNames = models.map(m => m.name);

  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader title="لوحة التحكم" />

      <AppCard>
        <DashboardFilters filters={filters} models={modelNames} onFiltersChange={setFilters} />
      </AppCard>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
          <div className="h-16 animate-pulse rounded-xl bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {snapshotKpis && periodKpis && (
            <DashboardKpiCards snapshotKpis={snapshotKpis} periodKpis={periodKpis} />
          )}

          {pipeline.length > 0 && <PipelineWidget stages={pipeline} />}

          <PiecesAvailabilityWidget criticalCombinations={criticalCombinations} />

          {chartData && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MonthlyProductionChart data={chartData.monthlyProduction} distributedData={chartData.monthlyDistributed} />
              <PipelineDonutChart stages={pipeline} />
              <TopTailorsChart data={chartData.topTailors} />
              <TopModelsChart data={chartData.topModels} />
              <FabricConsumptionChart data={chartData.fabricConsumption} />
              <EmployeeDebtChart data={chartData.employeeDebt} />
            </div>
          )}

          <ActivityFeed entries={activity} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">جاري التحميل...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
