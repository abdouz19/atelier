import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import type { PipelineStage } from '@/features/dashboard/dashboard.types';

interface Props {
  stages: PipelineStage[];
}

const STAGE_COLORS = [
  'border-gray-300 bg-gray-50',
  'border-orange-300 bg-orange-50',
  'border-yellow-300 bg-yellow-50',
  'border-blue-300 bg-blue-50',
  'border-purple-300 bg-purple-50',
  'border-green-300 bg-green-50',
];

const BADGE_COLORS = [
  'bg-gray-200 text-gray-700',
  'bg-orange-200 text-orange-800',
  'bg-yellow-200 text-yellow-800',
  'bg-blue-200 text-blue-800',
  'bg-purple-200 text-purple-800',
  'bg-green-200 text-green-800',
];

export function PipelineWidget({ stages }: Props) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">خط الإنتاج</h2>
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-2">
            <button
              onClick={() => router.push(stage.href)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-center transition-shadow hover:shadow-md ${STAGE_COLORS[i] ?? 'border-gray-200 bg-white'}`}
            >
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${BADGE_COLORS[i] ?? 'bg-gray-100 text-gray-600'}`}>
                {stage.count.toLocaleString('ar-DZ')}
              </span>
              <span className="text-xs text-gray-600 max-w-[80px] leading-tight">{stage.label}</span>
            </button>
            {i < stages.length - 1 && (
              <ChevronLeft size={14} className="text-gray-300 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
