'use client';

import { usePiecesAvailability } from '@/hooks/usePiecesAvailability';
import { PiecesAvailabilityTable } from './PiecesAvailabilityTable';

export function PiecesAvailabilityTab() {
  const { rows, allRows, threshold, setThreshold, loading, error, filters, setFilters, classify, onRecut } = usePiecesAvailability();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        حدث خطأ: {error}
      </div>
    );
  }

  return (
    <PiecesAvailabilityTable
      rows={rows}
      allRows={allRows}
      filters={filters}
      onFilterChange={setFilters}
      threshold={threshold}
      onThresholdChange={setThreshold}
      classify={classify}
      onRecut={onRecut}
    />
  );
}
