# IPC Channel Contracts: Models, Pieces & Platform-Wide Relational Consistency

**Feature**: 009-models-parts-consistency
**Date**: 2026-03-16

All channels follow the envelope: `{ success: true, data: T } | { success: false, error: string }`

---

## New Channels — Lookups Namespace

### `lookups:getModels`

Returns all active models sorted by `is_predefined DESC, name ASC`.

**Request**: none
**Response data**: `Array<{ id: string; name: string; isPredefined: boolean }>`

---

### `lookups:createModel`

Creates a new model entry.

**Request**: `{ name: string }` — trimmed, non-empty, case-insensitive unique
**Response data**: `{ id: string; name: string }`
**Errors**: `"اسم الموديل مطلوب"` | `"هذا الموديل موجود مسبقاً"`

---

### `lookups:updateModel`

Updates a model's name.

**Request**: `{ id: string; name: string }`
**Response data**: `{ id: string; name: string }`
**Errors**: `"لا يمكن تعديل الموديلات المحددة مسبقاً"` (if is_predefined) | `"هذا الموديل موجود مسبقاً"`

---

### `lookups:deleteModel`

Soft-deletes a model (`is_active = 0`).

**Request**: `{ id: string }`
**Response data**: `{ id: string }`
**Errors**: `"لا يمكن حذف الموديلات المحددة مسبقاً"` (if is_predefined)

---

### `lookups:getParts`

Returns all active parts sorted by `is_predefined DESC, name ASC`.

**Request**: none
**Response data**: `Array<{ id: string; name: string; isPredefined: boolean }>`

---

### `lookups:createPart`

**Request**: `{ name: string }`
**Response data**: `{ id: string; name: string }`
**Errors**: `"اسم القطعة مطلوب"` | `"هذه القطعة موجودة مسبقاً"`

---

### `lookups:updatePart`

**Request**: `{ id: string; name: string }`
**Response data**: `{ id: string; name: string }`

---

### `lookups:deletePart`

**Request**: `{ id: string }`
**Response data**: `{ id: string }`

---

### `lookups:getSizes`

Returns all active sizes sorted by `is_predefined DESC, name ASC`.

**Request**: none
**Response data**: `Array<{ id: string; name: string; isPredefined: boolean }>`

---

### `lookups:createSize`

**Request**: `{ name: string }`
**Response data**: `{ id: string; name: string }`
**Errors**: `"اسم المقاس مطلوب"` | `"هذا المقاس موجود مسبقاً"`

---

### `lookups:updateSize`

**Request**: `{ id: string; name: string }`
**Response data**: `{ id: string; name: string }`

---

### `lookups:deleteSize`

**Request**: `{ id: string }`
**Response data**: `{ id: string }`

---

## Modified Channels

### `cutting:create` — payload extension

**Previously**: Step 2 rows were `{ sizeLabel: string; pieceCount: number }[]`
**Now**: Step 2 rows are `{ partName: string; sizeName: string; quantity: number }[]`

Full updated request payload:
```typescript
{
  fabricItemId: string;
  fabricColor: string;
  modelName: string;          // now from managed models list
  metersUsed: number;
  layers: number;
  pricePerLayer: number;
  sessionDate: number;        // epoch ms
  notes?: string;
  employeeId?: string;
  pricePerPiece?: number;
  // Step 2 rows — CHANGED
  pieceRows: Array<{
    partName: string;         // from managed parts list
    sizeName: string;         // from managed sizes list
    quantity: number;         // positive integer ≥ 1
  }>;
  consumptionRows: Array<{    // unchanged
    stockItemId: string;
    color?: string;
    quantity: number;
  }>;
}
```

**Employee operation insert** (when employeeId provided): now includes `model_name`, `part_name` per pieceRow, `color` from fabricColor.
Note: one `employee_operations` row is inserted per `pieceRow` (previously one per sizeRow).

**Cutting piece insert**: now stores `part_name = pieceRow.partName`, `color = fabricColor` in addition to existing `size_label = pieceRow.sizeName`.

---

### `employees:addOperation` — payload extension

When adding a manual operation with model context:

```typescript
{
  employeeId: string;
  operationType: 'cutting' | 'distribution' | 'qc' | 'finition' | 'custom';
  sourceModule?: string;
  sourceReferenceId?: string;
  operationDate: number;
  quantity: number;
  pricePerUnit: number;
  notes?: string;
  modelName?: string;   // NEW — optional, populated for cutting
  partName?: string;    // NEW — optional, cutting only
  color?: string;       // NEW — optional
}
```

---

### Stock consumption inserts (internal — via existing channels)

When `cutting:create`, `qc:create`, `finition:create`, `finition:createStep`, or `finition:addToFinalStock` insert `stock_transactions` rows with `type = 'consumed'`, they now also populate `model_name` from the session/record context.

This is an internal implementation change, not a new channel — callers of those channels do not need to change.

---

## Type Additions (frontend/features/lookups/lookups.types.ts)

```typescript
export interface ModelEntry {
  id: string;
  name: string;
  isPredefined: boolean;
}

export interface PartEntry {
  id: string;
  name: string;
  isPredefined: boolean;
}

export interface SizeEntry {
  id: string;
  name: string;
  isPredefined: boolean;
}
```
