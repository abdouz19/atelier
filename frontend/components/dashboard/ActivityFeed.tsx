import { useRouter } from 'next/navigation';
import type { ActivityEntry } from '@/features/dashboard/dashboard.types';

interface Props {
  entries: ActivityEntry[];
}

const TYPE_LABELS: Record<ActivityEntry['type'], string> = {
  cutting_session: 'جلسة قص',
  distribution: 'توزيع',
  return: 'إعادة',
  qc: 'مراقبة الجودة',
  finition: 'تشطيب',
  final_stock: 'مخزون نهائي',
};

const TYPE_COLORS: Record<ActivityEntry['type'], string> = {
  cutting_session: 'bg-gray-100 text-gray-700',
  distribution: 'bg-orange-100 text-orange-700',
  return: 'bg-yellow-100 text-yellow-700',
  qc: 'bg-blue-100 text-blue-700',
  finition: 'bg-purple-100 text-purple-700',
  final_stock: 'bg-green-100 text-green-700',
};

function getHref(entry: ActivityEntry): string {
  switch (entry.type) {
    case 'cutting_session': return `/cutting?id=${entry.id}`;
    case 'distribution': return `/distribution?id=${entry.id}`;
    case 'return': return `/distribution?id=${entry.id}`;
    case 'qc': return `/qc?id=${entry.id}`;
    case 'finition': return `/qc?id=${entry.id}`;
    case 'final_stock': return '/final-stock';
  }
}

export function ActivityFeed({ entries }: Props) {
  const router = useRouter();

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">آخر النشاطات</h2>
        <p className="text-center text-sm text-gray-400 py-6">لا توجد عمليات حديثة</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">آخر النشاطات</h2>
      <div className="divide-y divide-gray-100">
        {entries.map(entry => (
          <button
            key={`${entry.type}-${entry.id}`}
            onClick={() => router.push(getHref(entry))}
            className="flex w-full items-center gap-3 py-2 text-right hover:bg-gray-50 transition-colors"
          >
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${TYPE_COLORS[entry.type]}`}>
              {TYPE_LABELS[entry.type]}
            </span>
            {entry.modelName && (
              <span className="flex-1 truncate text-sm text-gray-700">{entry.modelName}</span>
            )}
            <span className="text-xs text-gray-400 flex-shrink-0">
              {new Date(entry.eventDate).toLocaleDateString('ar-DZ')}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
