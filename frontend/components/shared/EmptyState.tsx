import { type LucideIcon, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ message, subMessage, icon: Icon = PackageOpen, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10">
        <Icon size={32} className="text-primary-500" />
      </div>
      <p className="text-sm font-semibold text-text-base">{message}</p>
      {subMessage && <p className="mt-1 text-sm text-text-muted">{subMessage}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-tactile mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
