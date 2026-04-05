'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Calendar, SlidersHorizontal, LayoutDashboard } from 'lucide-react';
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

/* ── Filter bar ─────────────────────────────────────────────────────────── */
function FilterBar({
  filters, models, onFiltersChange,
}: {
  filters: ReturnType<typeof useDashboard>['filters'];
  models: string[];
  onFiltersChange: ReturnType<typeof useDashboard>['setFilters'];
}) {
  const inputCls = 'rounded-lg px-2.5 py-1.5 text-xs outline-none transition-all duration-150 focus:ring-1';
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    focusBorderColor: '#6366f1',
  };

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)' }}
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={13} style={{ color: '#334155' }} />
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#334155' }}>الفترة</span>
      </div>
      <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      <div className="flex items-center gap-2">
        <Calendar size={12} style={{ color: '#475569' }} />
        <label className="text-[11px]" style={{ color: '#475569' }}>من</label>
        <input
          type="date"
          className={inputCls}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
          value={new Date(filters.startDate).toISOString().slice(0, 10)}
          onChange={e => { const d = new Date(e.target.value); d.setHours(0,0,0,0); onFiltersChange({ startDate: d.getTime() }); }}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[11px]" style={{ color: '#475569' }}>إلى</label>
        <input
          type="date"
          className={inputCls}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
          value={new Date(filters.endDate).toISOString().slice(0, 10)}
          onChange={e => { const d = new Date(e.target.value); d.setHours(23,59,59,999); onFiltersChange({ endDate: d.getTime() }); }}
        />
      </div>
      <div className="h-4 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      <div className="flex items-center gap-2">
        <label className="text-[11px]" style={{ color: '#475569' }}>الموديل</label>
        <select
          className={inputCls}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
          value={filters.modelName}
          onChange={e => onFiltersChange({ modelName: e.target.value })}
        >
          <option value="">الكل</option>
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

/* ── Section heading ────────────────────────────────────────────────────── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3" dir="rtl">
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1e293b' }}>
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

/* ── Skeleton pulse ─────────────────────────────────────────────────────── */
function Skeleton({ h, cols, count }: { h: string; cols: string; count: number }) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded-2xl ${h}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
      ))}
    </div>
  );
}

/* ── Main content ───────────────────────────────────────────────────────── */
function DashboardPageContent() {
  const { snapshotKpis, periodKpis, pipeline, activity, criticalCombinations, chartData, loading, error, filters, setFilters } = useDashboard();
  const { models } = useLookups();

  return (
    <div dir="rtl" className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(99,102,241,0.15)', boxShadow: '0 0 16px rgba(99,102,241,0.2)' }}>
              <LayoutDashboard size={17} style={{ color: '#818cf8' }} />
            </div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ background: 'linear-gradient(135deg, #f1f5f9 30%, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              لوحة التحكم
            </h1>
          </div>
          <p className="text-sm pr-12" style={{ color: '#334155' }}>نظرة شاملة على خط الإنتاج والعمليات</p>
        </div>
      </motion.div>

      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <FilterBar filters={filters} models={models.map(m => m.name)} onFiltersChange={setFilters} />

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <div className="space-y-6">
          <Skeleton cols="grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" count={7}  h="h-28" />
          <Skeleton cols="grid-cols-1"                                count={1}  h="h-32" />
          <Skeleton cols="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" count={6}  h="h-52" />
        </div>
      ) : (
        <div className="space-y-7">

          {/* KPIs */}
          {snapshotKpis && periodKpis && (
            <section className="space-y-3">
              <SectionHeading>المؤشرات الرئيسية</SectionHeading>
              <DashboardKpiCards snapshotKpis={snapshotKpis} periodKpis={periodKpis} />
            </section>
          )}

          {/* Pipeline */}
          {pipeline.length > 0 && (
            <section className="space-y-3">
              <SectionHeading>خط الإنتاج</SectionHeading>
              <PipelineWidget stages={pipeline} />
            </section>
          )}

          {/* Availability alerts */}
          <PiecesAvailabilityWidget criticalCombinations={criticalCombinations} />

          {/* Charts */}
          {chartData && (
            <section className="space-y-3">
              <SectionHeading>التحليلات والإحصاءات</SectionHeading>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MonthlyProductionChart data={chartData.monthlyProduction}          distributedData={chartData.monthlyDistributed} />
                <TopModelsChart         data={chartData.qcRejectionRates} />
                <TopTailorsChart        data={chartData.tailorCompletionRates} />
                <PipelineDonutChart     data={chartData.avgCostPerModel} />
                <FabricConsumptionChart data={chartData.fabricConsumption} />
                <EmployeeDebtChart      data={chartData.employeeDebt} />
              </div>
            </section>
          )}

          {/* Activity */}
          <section className="space-y-3">
            <SectionHeading>آخر النشاطات</SectionHeading>
            <ActivityFeed entries={activity} />
          </section>

        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-indigo-500" style={{ borderColor: 'rgba(99,102,241,0.2)', borderTopColor: '#6366f1' }} />
          <p className="text-sm" style={{ color: '#334155' }}>جاري التحميل...</p>
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}
