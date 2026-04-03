# IPC Contracts: Distribution Modal Redesign & Cost Calculation

**Feature**: 020-distribution-modal-cost
**Phase**: 1 — Design
**Date**: 2026-04-03

All channels follow the existing response envelope: `{ success: true, data: T } | { success: false, error: string }`.

---

## New Channels

### `distribution:getModelsWithPieces`

Returns all model names that have at least one `not_distributed` cutting piece.

**Accepts**: _(none)_

**Returns**: `string[]` — distinct model names, alphabetically sorted.

**Used by**: DistributeStep1Form — model selector population.

---

### `distribution:getSizesForModel`

Returns size labels that have not_distributed pieces for the given model.

**Accepts**:
```typescript
{ modelName: string }
```

**Returns**: `string[]` — distinct size labels for that model, sorted.

**Used by**: DistributeStep1Form — size selector (enabled after model is chosen).

---

### `distribution:getColorsForModelSize`

Returns colors that have not_distributed pieces for the given model + size combination.

**Accepts**:
```typescript
{ modelName: string; sizeLabel: string }
```

**Returns**: `string[]` — distinct colors for that model+size, sorted.

**Used by**: DistributeStep1Form — color selector (enabled after size is chosen).

---

### `distribution:getPartsWithCostForModelSizeColor`

Returns parts that have not_distributed pieces for the given model + size + color, along with available count and average unit cost.

**Accepts**:
```typescript
{ modelName: string; sizeLabel: string; color: string }
```

**Returns**:
```typescript
interface AvailablePartWithCost {
  partName: string;
  availableCount: number;
  avgUnitCost: number;  // 0 if no unit_cost recorded on any piece
}
AvailablePartWithCost[]
```

**Notes**:
- `availableCount` = number of `cutting_pieces` with `status = 'not_distributed'` matching the criteria
- `avgUnitCost` = `AVG(COALESCE(csp.unit_cost, 0))` from `cutting_session_parts` joined to those pieces
- Sorted alphabetically by `partName`

**Used by**: DistributeStep1Form — part selector rows.

---

## Updated Channels

### `distribution:distribute` (updated)

Creates a distribution record with full cost breakdown. Atomically marks pieces as distributed.

**Accepts**:
```typescript
interface DistributePayload {
  tailorId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  expectedFinalQuantity: number;      // integer >= 1
  sewingPricePerPiece: number;        // decimal >= 0
  distributionDate: number;           // Unix timestamp ms
  parts: DistributePartRow[];
  consumptionRows: DistributionConsumptionRow[];  // may be empty
  // Computed costs (calculated by frontend, stored for traceability)
  piecesCost: number;
  sewingCost: number;
  materialsCost: number;
  totalCost: number;
  costPerFinalItem: number;
}

interface DistributePartRow {
  partName: string;
  quantity: number;          // integer >= 1, validated against availableCount
  avgUnitCost: number;       // from getPartsWithCostForModelSizeColor, stored for traceability
}

interface DistributionConsumptionRow {
  stockTransactionId: string;
  quantity: number;
  pricePerUnit: number;
}
```

**Returns**: `DistributionTailorSummary` (same as existing)

**Atomic operations** (all in one `db.transaction`):
1. INSERT into `distribution_batches` (with all 6 new cost fields)
2. For each `DistributePartRow`: INSERT into `distribution_batch_parts` (with `avg_unit_cost`)
3. For each `DistributePartRow`: SELECT `quantity` pieces (FIFO by `created_at`) from `cutting_pieces` matching `(model_name, size_label, color, part_name, status='not_distributed')`; UPDATE those pieces to `status='distributed'`; INSERT into `distribution_piece_links`
4. For each `DistributionConsumptionRow`: INSERT into `distribution_consumption_entries`; UPDATE `stock_transactions` to deduct quantity
5. Return updated tailor summary

**Error cases**:
- `tailorId not found` → `{ success: false, error: 'Tailor not found' }`
- `quantity exceeds available` → `{ success: false, error: 'Insufficient pieces for part: {partName}' }`
- Any DB error → transaction rollback + `{ success: false, error: message }`

---

## Existing Channels (unchanged)

### `distribution:getActiveTailors`

Returns active tailors for the tailor selector.

**Returns**: `{ id: string; name: string }[]`

**Used by**: DistributeStep1Form — tailor selector.

---

### `cutting:getNonFabricItems`

Returns non-fabric stock items for the consumed materials editor.

**Returns**: `NonFabricItem[]` (existing type — unchanged)

**Used by**: DistributeStep1Form — consumed materials section (reusing ConsumedMaterialsEditor).

---

### `cutting:getMaterialBatches`

Returns available batches for a non-fabric stock item + color.

**Accepts**: `{ stockItemId: string; color: string }`

**Returns**: `MaterialBatch[]` (existing type — unchanged)

**Used by**: ConsumedMaterialsEditor inside DistributeStep1Form.
