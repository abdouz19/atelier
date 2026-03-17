# IPC Contracts: Final Stock Screen

**Feature**: 010-final-stock-screen | **Phase**: 1 | **Date**: 2026-03-17

All responses follow the standard envelope: `{ success: true, data: T } | { success: false, error: string }`

---

## New Channels

### `final-stock:getKpis`

Returns the three KPI values for the header cards.

**Payload**: none

**Response data**:
```typescript
{
  totalPieces: number;                  // SUM of all quantities in final_stock_entries
  totalDistinctModels: number;          // COUNT(DISTINCT model_name)
  totalDistinctSizeColorCombos: number; // COUNT(DISTINCT size_label || '|' || color)
}
```

---

### `final-stock:getRows`

Returns all grouped rows, optionally filtered.

**Payload**:
```typescript
{
  modelName?: string;  // exact match; omit or empty = no filter
  sizeLabel?: string;  // exact match; omit or empty = no filter
  color?: string;      // exact match; omit or empty = no filter
}
```

**Response data**: `FinalStockRow[]` where each element is:
```typescript
{
  modelName: string;
  partName: string | null;   // null = distinct "no part" bucket
  sizeLabel: string;
  color: string;
  currentQuantity: number;   // SUM(quantity) — may be 0 if entries were later zeroed (not possible currently, but shown if present)
  lastUpdatedDate: number;   // MAX(entry_date) timestamp in ms
}
```

Rows are ordered by `model_name, part_name, size_label, color`. Null `part_name` sorts before named parts in SQLite default NULL ordering.

---

### `final-stock:getHistory`

Returns all individual addition entries for a specific model+part+size+color combination, in chronological order.

**Payload**:
```typescript
{
  modelName: string;
  partName: string | null;  // null matches only null part_name rows
  sizeLabel: string;
  color: string;
}
```

**Response data**: `FinalStockHistoryEntry[]` where each element is:
```typescript
{
  id: string;
  sourceType: 'finition' | 'finition_step';
  sourceId: string;   // references finition_records.id or finition_steps.id
  quantityAdded: number;
  entryDate: number;  // timestamp in ms
}
```

---

## Updated Channels

### `finition:addToFinalStock` (updated payload)

Previously did not include `partName`. Now accepts an optional `partName` field.

**Updated payload**:
```typescript
{
  sourceType: 'finition' | 'finition_step';
  sourceId: string;
  modelName: string;
  partName?: string;  // NEW — optional; omit or undefined stores NULL
  sizeLabel: string;
  color: string;
  quantity: number;
  entryDate: number;
}
```

**Response data**: `{ id: string }` (unchanged)
