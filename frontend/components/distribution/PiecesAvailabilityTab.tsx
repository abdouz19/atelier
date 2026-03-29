'use client';

import { usePiecesAvailability } from '@/hooks/usePiecesAvailability';
import { PiecesAvailabilityTable } from './PiecesAvailabilityTable';

export function PiecesAvailabilityTab() {
  const { rows, allRows, threshold, setThreshold, loading, error, filters, setFilters, classify, onRecut } = usePiecesAvailability();

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
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
