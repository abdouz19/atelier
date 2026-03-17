import { useRouter } from 'next/navigation';
import { Users, Package, Scissors, Truck, Search, CheckCircle, Wrench, Archive, CreditCard, ShoppingCart } from 'lucide-react';
import type { DashboardSnapshotKpis, DashboardPeriodKpis } from '@/features/dashboard/dashboard.types';

interface Props {
  snapshotKpis: DashboardSnapshotKpis;
  periodKpis: DashboardPeriodKpis;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  onClick,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  onClick?: () => void;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
}) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    gray: 'text-gray-600 bg-gray-50',
  };
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 leading-tight">{label}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 truncate">{value}</p>
        </div>
        <div className={`rounded-lg p-2 flex-shrink-0 ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export function DashboardKpiCards({ snapshotKpis, periodKpis }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Fabric items */}
      {snapshotKpis.fabricItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {snapshotKpis.fabricItems.map(fabric => (
            <KpiCard
              key={fabric.name}
              label={`قماش — ${fabric.name}`}
              value={`${fabric.availableMeters.toLocaleString('ar-DZ')} م`}
              icon={Package}
              color="blue"
            />
          ))}
        </div>
      )}

      {/* Main KPIs grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard
          label="قطع غير موزعة"
          value={snapshotKpis.piecesNotDistributed.toLocaleString('ar-DZ')}
          icon={Scissors}
          color="gray"
        />
        <KpiCard
          label="قطع في التوزيع"
          value={snapshotKpis.piecesInDistribution.toLocaleString('ar-DZ')}
          icon={Truck}
          color="orange"
        />
        <KpiCard
          label="قطع بانتظار المراقبة"
          value={snapshotKpis.piecesAwaitingQc.toLocaleString('ar-DZ')}
          icon={Search}
          color="purple"
        />
        <KpiCard
          label="قطع بانتظار التشطيب"
          value={snapshotKpis.piecesAwaitingFinition.toLocaleString('ar-DZ')}
          icon={CheckCircle}
          color="blue"
        />
        <KpiCard
          label="قطع في التشطيب"
          value={snapshotKpis.piecesInFinition.toLocaleString('ar-DZ')}
          icon={Wrench}
          color="orange"
        />
        <KpiCard
          label="المخزون النهائي"
          value={snapshotKpis.piecesInFinalStock.toLocaleString('ar-DZ')}
          icon={Archive}
          color="green"
        />
        <KpiCard
          label="خياطون نشطون"
          value={snapshotKpis.activeTailorsWithPendingDistributions.toLocaleString('ar-DZ')}
          icon={Users}
          color="blue"
        />
        <KpiCard
          label="مخزون صفري"
          value={snapshotKpis.zeroStockNonFabricCount.toLocaleString('ar-DZ')}
          icon={Package}
          color="red"
          onClick={() => router.push('/stock?zeroStock=1')}
        />
        <KpiCard
          label="ديون الموظفين"
          value={`${periodKpis.totalEmployeeDebt.toLocaleString('ar-DZ')} د.ج`}
          icon={CreditCard}
          color="red"
          onClick={() => router.push('/employees')}
        />
        <KpiCard
          label="مشتريات الفترة"
          value={`${periodKpis.totalPurchases.toLocaleString('ar-DZ')} د.ج`}
          icon={ShoppingCart}
          color="green"
          onClick={() => router.push('/suppliers')}
        />
        <KpiCard
          label="تركيبات بدون مخزون"
          value={snapshotKpis.zeroStockCombosCount.toLocaleString('ar-DZ')}
          icon={Scissors}
          color="red"
          onClick={() => router.push('/distribution?tab=availability')}
        />
        <KpiCard
          label="تركيبات بمخزون منخفض"
          value={snapshotKpis.lowStockCombosCount.toLocaleString('ar-DZ')}
          icon={Scissors}
          color="orange"
          onClick={() => router.push('/distribution?tab=availability')}
        />
      </div>
    </div>
  );
}
