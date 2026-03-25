# IPC Channel Contracts: Parts Model Correction & Inventory KPIs

**Branch**: `013-parts-distribution-fix` | **Date**: 2026-03-21

All channels follow the standard envelope: `{ success: true, data: T } | { success: false, error: string }`.

---

## New Channels

### `cutting:getPartSuggestions`

Returns distinct part names previously used for a given model. Drives autocomplete in cutting step 2.

**Request**:
```typescript
{ modelName: string }
```

**Response data**:
```typescript
string[]   // e.g. ["ظهر", "ذراع يمين", "ذراع يسار", "ياقة"]
```

**Source query**: `SELECT DISTINCT cp.part_name FROM cutting_parts cp JOIN cutting_sessions cs ON cs.id = cp.session_id WHERE cs.model_name = ? ORDER BY cp.part_name`

---

### `cutting:getPartsInventory`

Returns available quantity per (model_name, part_name) for the parts inventory KPI panel. Sorted by model then part name.

**Request**: _(no payload)_

**Response data**:
```typescript
Array<{
  modelName: string
  partName: string
  totalProduced: number
  totalDistributed: number
  availableCount: number   // totalProduced - totalDistributed
}>
```

**Zero rows**: Returns empty array when no cutting_parts exist.

---

### `distribution:getAvailablePartsForModel`

Returns available part counts for a given model. Used in the Distribute modal to populate the parts breakdown rows and enforce quantity limits.

**Request**:
```typescript
{ modelName: string }
```

**Response data**:
```typescript
Array<{
  partName: string
  availableCount: number
}>
// Only rows where availableCount > 0 are returned
```

---

## Updated Channels

### `cutting:create` (updated payload)

**Request**:
```typescript
{
  fabricItemId: string
  fabricColor: string
  modelName: string
  metersUsed: number
  layers: number
  pricePerLayer: number
  sessionDate: number          // Unix timestamp
  notes?: string
  employeeIds: string[]
  parts: Array<{               // replaces "sizes" array
    partName: string
    count: number              // ≥ 1
  }>
  consumptionEntries: Array<{
    stockItemId: string
    color?: string
    quantity: number
  }>
}
```

**Behaviour change**: On success, inserts rows into `cutting_parts` (one per part entry) instead of `cutting_pieces` (one per individual piece).

---

### `cutting:getById` (updated response)

**Response data**:
```typescript
{
  id: string
  fabricItemId: string
  fabricColor: string
  modelName: string
  metersUsed: number
  layers: number
  pricePerLayer: number
  sessionDate: number
  notes?: string
  employees: Array<{ id: string; name: string; amount: number }>
  parts: Array<{               // replaces "piecesBySize"
    partName: string
    count: number
  }>
  consumptionEntries: Array<{
    stockItemId: string
    itemName: string
    color?: string
    quantity: number
  }>
}
```

---

### `cutting:getKpis` (updated response)

**Response data**:
```typescript
{
  totalSessions: number
  totalPartsProduced: number        // replaces totalPieces (sum of cutting_parts.count)
  totalPartsAvailable: number       // totalPartsProduced - totalDistributed
  totalMetersConsumed: number
  totalCostPaid: number
}
```

---

### `distribution:distribute` (updated payload)

**Request**:
```typescript
{
  tailorId: string
  modelName: string
  expectedPiecesCount: number       // NEW: number of final assembled pieces expected
  sewingPricePerPiece: number
  distributionDate: number
  parts: Array<{                    // NEW: replaces the old single size+color+quantity
    partName: string
    quantity: number                // ≥ 1, ≤ availableCount
  }>
}
```

**Behaviour change**:
- Inserts one `distribution_batches` row with `expected_pieces_count = expectedPiecesCount`, `quantity = Σ(parts[].quantity)`, `size_label = NULL`, `color = NULL`.
- Inserts one `distribution_batch_parts` row per part entry.
- Does NOT insert into `distribution_piece_links` (legacy table, not used for new batches).
- Records one `tailor_sewing_transactions` entry: amount = `expectedPiecesCount × sewingPricePerPiece`.

---

### `distribution:getBatchesForTailor` (updated response)

**Response data**:
```typescript
Array<{
  batchId: string
  modelName: string
  expectedPiecesCount: number
  totalQuantity: number             // sum of all parts quantities
  quantityRemaining: number         // totalQuantity - Σ(return_records.quantity_returned)
  distributionDate: number
  sewingPricePerPiece: number
  parts: Array<{                    // NEW
    partName: string
    quantity: number
  }>
}>
// Only batches where quantityRemaining > 0
```

---

### `distribution:getDetailByTailor` (updated response)

**Response data**:
```typescript
{
  tailorId: string
  tailorName: string
  batches: Array<{
    batchId: string
    modelName: string
    expectedPiecesCount: number
    totalQuantity: number
    quantityReturned: number
    distributionDate: number
    sewingPricePerPiece: number
    totalCost: number
    parts: Array<{ partName: string; quantity: number }>   // NEW
    returns: Array<{ returnId: string; quantityReturned: number; returnDate: number }>
  }>
}
```

---

## Removed Channels

| Channel | Replacement |
|---------|-------------|
| `cutting:getSizeSuggestions` | `cutting:getPartSuggestions` |
| `distribution:getAvailablePieces` | `distribution:getAvailablePartsForModel` |
| `distribution:getSizeSuggestions` | No replacement (not needed) |

---

## Unchanged Channels

These channels are not affected by this feature and must not be modified:

- `cutting:getFabrics`
- `cutting:getFabricColors`
- `cutting:getNonFabricItems`
- `cutting:getModelSuggestions`
- `cutting:getAll`
- `distribution:getKpis`
- `distribution:getSummary`
- `distribution:getActiveTailors`
- `distribution:getModelSuggestions`
- `distribution:return`
- `pieces:getAvailability`
- `pieces:getLowStockThreshold`
- `pieces:setLowStockThreshold`
