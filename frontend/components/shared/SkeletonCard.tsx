'use client';

type SkeletonVariant = 'kpi' | 'table' | 'form' | 'text';

interface SkeletonCardProps {
  variant: SkeletonVariant;
  rows?: number;
}

export function SkeletonCard({ variant, rows = 4 }: SkeletonCardProps) {
  if (variant === 'kpi') {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 w-16 rounded bg-border" />
            <div className="h-3 w-24 rounded bg-border" />
          </div>
          <div className="h-10 w-10 rounded-full bg-border" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-10 border-b border-border bg-base/60" />
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={`flex gap-4 px-4 py-3 ${i % 2 === 0 ? 'bg-surface' : 'bg-base/30'}`}>
              <div className="h-4 w-32 rounded bg-border" />
              <div className="h-4 w-24 rounded bg-border" />
              <div className="h-4 w-20 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'form') {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-border" />
            <div className="h-9 w-full rounded-lg bg-border" />
          </div>
        ))}
      </div>
    );
  }

  // text variant
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-border"
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid gap-4 ${count <= 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant="kpi" />
      ))}
    </div>
  );
}
