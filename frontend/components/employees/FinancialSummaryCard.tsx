'use client';

interface FinancialSummaryCardProps {
  totalEarned: number;
  totalPaid: number;
  balanceDue: number;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function FinancialSummaryCard({ totalEarned, totalPaid, balanceDue }: FinancialSummaryCardProps) {
  const isNegative = balanceDue < 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-500">الملخص المالي</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">إجمالي المكتسب</span>
          <span className="font-medium text-gray-900">{fmt(totalEarned)} دج</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">إجمالي المدفوع</span>
          <span className="font-medium text-gray-900">{fmt(totalPaid)} دج</span>
        </div>
        <div className="mt-2 border-t border-gray-100 pt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">الرصيد المستحق</span>
          <span className={`text-lg font-bold ${isNegative ? 'text-red-600' : 'text-blue-600'}`}>
            {isNegative ? '−' : ''}{fmt(Math.abs(balanceDue))} دج
          </span>
        </div>
        {isNegative && (
          <p className="text-xs text-red-500">رصيد دائن (دفعة مسبقة)</p>
        )}
      </div>
    </div>
  );
}
