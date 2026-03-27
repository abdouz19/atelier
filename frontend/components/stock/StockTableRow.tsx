'use client';

import Image from 'next/image';
import { Plus, Archive, ChevronLeft } from 'lucide-react';
import type { StockItemSummary } from '@/features/stock/stock.types';

interface StockTableRowProps {
  item: StockItemSummary;
  onRowClick: (id: string) => void;
  onAddInbound: (item: StockItemSummary) => void;
  onArchive: (item: StockItemSummary) => void;
}

export function StockTableRow({ item, onRowClick, onAddInbound, onArchive }: StockTableRowProps) {
  const isLow = item.isLow;
  const hasMultipleVariants = item.variantCount > 1;

  return (
    <tr
      className="odd:bg-surface even:bg-base/30 hover:bg-primary-50 transition-colors"
      onClick={() => onRowClick(item.id)}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <span className="font-medium text-text-base">{item.name}</span>
      </td>

      {/* Type */}
      <td className="px-4 py-3 text-sm text-text-muted">{item.type}</td>

      {/* Quantity */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-text-base'}`}>
            {item.totalQuantity} {item.unit}
          </span>
          {hasMultipleVariants && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              {item.variantCount} ألوان
            </span>
          )}
          {isLow && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
              نفد
            </span>
          )}
        </div>
      </td>

      {/* Color */}
      <td className="px-4 py-3 text-sm text-text-muted">
        {item.color ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{item.color}</span>
        ) : null}
      </td>

      {/* Image */}
      <td className="px-4 py-3">
        {item.imagePath ? (
          <Image
            src={item.imagePath}
            alt={item.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded object-cover"
            unoptimized
          />
        ) : (
          <div className="h-10 w-10 rounded bg-gray-100" />
        )}
      </td>

      {/* Description */}
      <td className="max-w-xs px-4 py-3 text-sm text-text-muted">
        <span className="line-clamp-1">{item.description}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onAddInbound(item)}
            title="إضافة وارد"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-primary-50 hover:text-primary-600"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => onArchive(item)}
            title="أرشفة"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <Archive size={16} />
          </button>
          <ChevronLeft size={16} className="text-gray-300" />
        </div>
      </td>
    </tr>
  );
}
