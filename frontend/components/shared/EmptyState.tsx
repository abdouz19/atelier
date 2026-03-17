import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
}

export function EmptyState({ message, subMessage }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" dir="rtl">
      <PackageOpen size={48} className="mb-4 text-gray-300" />
      <p className="text-base font-medium text-gray-500">{message}</p>
      {subMessage && <p className="mt-1 text-sm text-gray-400">{subMessage}</p>}
    </div>
  );
}
