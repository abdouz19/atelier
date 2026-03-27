'use client';

import { Suspense } from 'react';
import { useFinalStockList } from '@/hooks/useFinalStockList';
import { useLookups } from '@/hooks/useLookups';
import { FinalStockKpiCards } from '@/components/final-stock/FinalStockKpiCards';
import { FinalStockTable } from '@/components/final-stock/FinalStockTable';
import { FinalStockHistoryPanel } from '@/components/final-stock/FinalStockHistoryPanel';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { PageHeader } from '@/components/shared/PageHeader';

function FinalStockPageContent() {
  const {
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
  } = useFinalStockList();

  const { models, sizes, colors } = useLookups();

  return (
    <div dir="rtl">
      <PageHeader title="المخزون النهائي" />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
        </div>
      ) : (
        <div className="space-y-6">
          {kpis && <FinalStockKpiCards kpis={kpis} />}
          <FinalStockTable
            rows={rows}
            filters={filters}
            models={models}
            sizes={sizes}
            colors={colors}
            onFilterChange={applyFilters}
            onRowClick={openHistory}
          />
          {selectedRow && (
            <FinalStockHistoryPanel
              row={selectedRow}
              entries={history}
              loading={historyLoading}
              error={historyError}
              onClose={closeHistory}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function FinalStockPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">جاري التحميل...</div>}>
      <FinalStockPageContent />
    </Suspense>
  );
}
