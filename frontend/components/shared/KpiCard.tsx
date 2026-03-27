import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export type SemanticColor = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'gray' | 'primary';

interface TrendInfo {
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
  label?: string;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: SemanticColor;
  trend?: TrendInfo;
  onClick?: () => void;
}

const borderColorMap: Record<SemanticColor, string> = {
  blue:    'border-blue-500',
  green:   'border-green-500',
  red:     'border-red-500',
  amber:   'border-amber-500',
  purple:  'border-purple-500',
  gray:    'border-gray-400',
  primary: 'border-primary-500',
};

const iconBgMap: Record<SemanticColor, string> = {
  blue:    'bg-blue-50 text-blue-600',
  green:   'bg-green-50 text-green-600',
  red:     'bg-red-50 text-red-600',
  amber:   'bg-amber-50 text-amber-600',
  purple:  'bg-purple-50 text-purple-600',
  gray:    'bg-gray-100 text-gray-500',
  primary: 'bg-primary-50 text-primary-600',
};

export function KpiCard({ label, value, icon: Icon, color, trend, onClick }: KpiCardProps) {
  const borderClass = borderColorMap[color];
  const iconClass = iconBgMap[color];

  return (
    <div
      className={`rounded-xl bg-surface border border-border border-s-4 ${borderClass} p-4 flex items-start gap-3 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className={`flex-shrink-0 rounded-lg p-2 ${iconClass}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-text-base leading-tight">{value}</p>
        <p className="text-sm text-text-muted mt-0.5 truncate">{label}</p>
        {trend && trend.direction !== 'neutral' && (
          <div
            className={`flex items-center gap-1 mt-1 text-xs font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trend.percentage}%</span>
            {trend.label && <span className="text-text-muted font-normal">{trend.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
