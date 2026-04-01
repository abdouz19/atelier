# IPC Contracts: Session Cost Calculation & Part Cost Distribution

**Branch**: `018-session-cost-distribution` | **Date**: 2026-04-01

All channels follow the standard response envelope: `{ success: true, data: T } | { success: false, error: string }`

---

## New Channels

### `cutting:getFabricBatches`

Returns all inbound purchase batches for a specific fabric item + color, with computed available quantity per batch.

**Request payload**:
```typescript
{
  stockItemId: string;   // stock_items.id of the fabric
  color: string;         // exact color string
}
```

**Response data**:
```typescript
FabricBatch[]

interface FabricBatch {
  transactionId: string;       // stock_transactions.id
  transactionDate: number;     // ms timestamp
  pricePerMeter: number;       // price_per_unit from the inbound transaction
  originalQuantity: number;    // original inbound quantity (meters)
  availableQuantity: number;   // original - SUM of all prior batch consumptions
  supplierName: string | null; // denormalized supplier name for display
}
```

**Ordering**: by `transactionDate DESC` (most recent first)

**Edge cases**:
- No batches for this fabric+color → returns empty array `[]`
- Batches with `availableQuantity = 0` → included in response (UI shows them as exhausted/disabled)

---

### `cutting:getMaterialBatches`

Returns all inbound purchase batches for a specific non-fabric stock item (optionally filtered by color), with computed available quantity.

**Request payload**:
```typescript
{
  stockItemId: string;    // stock_items.id of the material
  color?: string | null;  // optional color filter (null/undefined = no color filter)
}
```

**Response data**:
```typescript
MaterialBatch[]

interface MaterialBatch {
  transactionId: string;       // stock_transactions.id
  transactionDate: number;     // ms timestamp
  pricePerUnit: number;        // price_per_unit from the inbound transaction
  unit: string;                // stock_items.unit (e.g. 'م', 'قطعة')
  originalQuantity: number;    // original inbound quantity
  availableQuantity: number;   // original - SUM of all prior batch consumptions
  supplierName: string | null;
}
```

**Ordering**: by `transactionDate DESC`

---

## Modified Channels

### `cutting:create` — Extended Payload

The existing channel is extended. The previous `metersUsed` and `consumptionRows` fields are **replaced** by batch-level arrays. All prior fields not listed here remain unchanged.

**New / replaced fields in request payload**:

```typescript
// REPLACES: metersUsed: number
fabricBatchConsumptions: FabricBatchConsumption[];

// REPLACES: consumptionRows: ConsumptionRow[]
materialBatchConsumptions: MaterialBatchConsumption[];

// NEW: cost summary (computed on frontend, stored on session)
fabricCost: number;
employeeCost: number;
consumedMaterialsCost: number;
totalSessionCost: number;

// NEW: resolved unit costs per part row (parallel to existing parts[])
partCosts: PartCost[];

interface FabricBatchConsumption {
  transactionId: string;   // stock_transactions.id (inbound)
  quantity: number;        // meters taken from this batch
  pricePerUnit: number;    // snapshot of price_per_unit (for backend verification)
}

interface MaterialBatchConsumption {
  stockItemId: string;
  color: string | null;
  batches: Array<{
    transactionId: string;
    quantity: number;
    pricePerUnit: number;
  }>;
}

interface PartCost {
  partName: string;
  sizeLabel: string;
  unitCost: number;   // 2 decimal precision
}
```

**Backend actions on `cutting:create` (additions to existing flow)**:

1. Validate each `fabricBatchConsumption.quantity ≤ batch.availableQuantity` (re-computed server-side)
2. Validate each `materialBatch.quantity ≤ batch.availableQuantity`
3. Compute `metersUsed = SUM(fabricBatchConsumptions[].quantity)` — populate legacy column
4. Insert one row in `cutting_batch_consumptions` per fabric batch (is_fabric=1)
5. Insert one row in `cutting_batch_consumptions` per material batch entry (is_fabric=0)
6. Existing `stock_transactions` consumed rows are still created (total deduct per item+color) for compatibility
7. Store `fabric_cost`, `employee_cost`, `consumed_materials_cost`, `total_session_cost` on the session
8. Match `partCosts[]` to `cutting_session_parts` rows by `(partName, sizeLabel)` → store `unit_cost`
9. Populate `cutting_pieces.unit_cost` from the matched part row for each piece inserted

---

## Existing Channels (unchanged)

| Channel | Status |
|---------|--------|
| `cutting:getKpis` | Unchanged |
| `cutting:getAll` | Unchanged |
| `cutting:getById` | Unchanged — detail view may display new cost fields if non-NULL |
| `cutting:getFabrics` | Unchanged |
| `cutting:getFabricColors` | Unchanged |
| `cutting:getNonFabricItems` | Unchanged |
| `cutting:getModelSuggestions` | Unchanged |
| `cutting:getPartSuggestions` | Unchanged |
| `cutting:getPartsInventory` | Unchanged |
| `cutting:getAvailableSizesForModel` | Unchanged |
| `cutting:getAvailableColorsForModelSize` | Unchanged |
