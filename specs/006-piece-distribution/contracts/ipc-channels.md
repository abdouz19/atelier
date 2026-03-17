# IPC Contracts: Piece Distribution Management

**Branch**: `006-piece-distribution` | **Date**: 2026-03-15

All channels follow the project response envelope: `{ success: true, data: T } | { success: false, error: string }`

Total: **18 channels** across 2 namespaces (`tailors:*` × 8, `distribution:*` × 10)

---

## Tailors Namespace (8 channels)

### `tailors:getAll`

Returns all tailors for the Tailors list screen.

**Payload**: none

**Response data**: `TailorSummary[]`

```typescript
interface TailorSummary {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  totalEarned: number;   // SUM(distribution_batches.total_cost)
  totalPaid: number;     // SUM(tailor_payments.amount)
  balanceDue: number;    // totalEarned - totalPaid
}
```

---

### `tailors:getById`

Returns full tailor detail with sewing history and payments.

**Payload**: `{ id: string }`

**Response data**: `TailorDetail`

```typescript
interface TailorDetail {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  totalEarned: number;
  totalPaid: number;
  balanceDue: number;
  sewingTransactions: Array<{
    batchId: string;
    modelName: string;
    sizeLabel: string;
    color: string;
    quantity: number;
    sewingPricePerPiece: number;
    totalCost: number;
    distributionDate: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: number;
    notes: string | null;
  }>;
}
```

---

### `tailors:create`

Creates a new tailor.

**Payload**:
```typescript
interface CreateTailorPayload {
  name: string;
  phone?: string;
  notes?: string;
}
```

**Response data**: `TailorSummary`

---

### `tailors:update`

Updates a tailor's profile fields.

**Payload**:
```typescript
interface UpdateTailorPayload {
  id: string;
  name?: string;
  phone?: string | null;
  notes?: string | null;
}
```

**Response data**: `TailorSummary`

---

### `tailors:setStatus`

Toggles a tailor's active/inactive status.

**Payload**: `{ id: string; status: 'active' | 'inactive' }`

**Response data**: `null`

---

### `tailors:addPayment`

Records a payment to a tailor.

**Payload**:
```typescript
interface AddTailorPaymentPayload {
  tailorId: string;
  amount: number;       // > 0
  paymentDate: number;  // epoch ms
  notes?: string;
}
```

**Response data**: `TailorDetail`

---

### `tailors:updatePayment`

Edits an existing tailor payment.

**Payload**:
```typescript
interface UpdateTailorPaymentPayload {
  id: string;
  amount?: number;
  paymentDate?: number;
  notes?: string | null;
}
```

**Response data**: `TailorDetail`

---

### `tailors:deletePayment`

Deletes a tailor payment record.

**Payload**: `{ id: string }`

**Response data**: `TailorDetail`

---

## Distribution Namespace (10 channels)

### `distribution:getKpis`

Returns the 6 KPI values for the Distribution screen header.

**Payload**: none

**Response data**:
```typescript
interface DistributionKpis {
  piecesInDistribution: number;    // cutting_pieces WHERE status='distributed'
  piecesReturned: number;          // cutting_pieces WHERE status='returned'
  piecesNotYetReturned: number;    // same as piecesInDistribution
  tailorsWithActiveDist: number;   // distinct tailor_ids with remaining_quantity > 0
  totalSewingCost: number;         // SUM(distribution_batches.total_cost)
  totalUnsettledCost: number;      // totalSewingCost - SUM(tailor_payments.amount)
}
```

---

### `distribution:getSummary`

Returns per-tailor summary rows for the Distribution screen table, sorted by most pieces pending first.

**Payload**: none

**Response data**: `DistributionTailorSummary[]`

```typescript
interface DistributionTailorSummary {
  tailorId: string;
  tailorName: string;
  piecesInDistribution: number;   // pieces linked to their batches with status='distributed'
  piecesReturned: number;         // pieces linked to their batches with status='returned'
  piecesNotYetReturned: number;   // same as piecesInDistribution
  totalEarned: number;            // SUM(distribution_batches.total_cost) for this tailor
  settledAmount: number;          // SUM(tailor_payments.amount) for this tailor
  remainingBalance: number;       // totalEarned - settledAmount
}
```

---

### `distribution:getDetailByTailor`

Returns full distribution history for one tailor (for the detail view on the Distribution screen).

**Payload**: `{ tailorId: string }`

**Response data**: `DistributionTailorDetail`

```typescript
interface DistributionBatchRow {
  id: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantity: number;
  remainingQuantity: number;      // quantity - SUM(return_records.quantity_returned)
  sewingPricePerPiece: number;
  totalCost: number;
  distributionDate: number;
  returns: Array<{
    id: string;
    quantityReturned: number;
    returnDate: number;
    consumptionEntries: Array<{
      stockItemName: string;
      color: string | null;
      quantity: number;
    }>;
  }>;
}

interface DistributionTailorDetail {
  tailorId: string;
  tailorName: string;
  batches: DistributionBatchRow[];
}
```

---

### `distribution:getActiveTailors`

Returns all active tailors for use in modal selectors.

**Payload**: none

**Response data**: `Array<{ id: string; name: string }>`

---

### `distribution:getAvailablePieces`

Returns the count of not-distributed pieces for a given model+size+color combination.

**Payload**: `{ modelName: string; sizeLabel: string; color: string }`

**Response data**: `{ available: number }`

---

### `distribution:getModelSuggestions`

Returns distinct model names from all cutting sessions for autocomplete.

**Payload**: none

**Response data**: `string[]`

---

### `distribution:getSizeSuggestions`

Returns distinct size labels from all cutting pieces for autocomplete.

**Payload**: none

**Response data**: `string[]`

---

### `distribution:getBatchesForTailor`

Returns all distribution batches for a tailor that still have remaining (not-fully-returned) pieces, for use in the Return modal.

**Payload**: `{ tailorId: string }`

**Response data**: `DistributionBatchOption[]`

```typescript
interface DistributionBatchOption {
  id: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantityDistributed: number;   // original batch quantity
  remainingQuantity: number;     // quantityDistributed - SUM(returns)
  distributionDate: number;
}
```

---

### `distribution:distribute`

Atomically distributes pieces to a tailor.

**Payload**:
```typescript
interface DistributePayload {
  tailorId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantity: number;              // > 0, ≤ available not-distributed pieces
  sewingPricePerPiece: number;   // > 0
  distributionDate: number;      // epoch ms
}
```

**Response data**: `DistributionTailorSummary` (updated row for the tailor)

**Atomic operations on success**:
1. Validate: `quantity` ≤ available `not_distributed` pieces for `modelName + sizeLabel + color`
2. Validate: tailor exists and status = 'active'
3. SELECT N `cutting_pieces` IDs (JOIN cutting_sessions) WHERE model+size+color + status='not_distributed' LIMIT quantity
4. INSERT `distribution_batches`
5. INSERT `distribution_piece_links` (one row per piece ID)
6. UPDATE `cutting_pieces` SET status='distributed' WHERE id IN (piece_ids)

**Validation (server-side)**:
- `quantity` ≤ available not-distributed pieces for the combination
- `tailorId` exists and is active
- `quantity` ≥ 1

---

### `distribution:return`

Atomically records a return of pieces from a tailor.

**Payload**:
```typescript
interface ReturnPayload {
  batchId: string;
  quantityReturned: number;      // ≥ 1, ≤ remaining distributed quantity for this batch
  returnDate: number;            // epoch ms
  consumptionRows: Array<{
    stockItemId: string;
    color: string | null;
    quantity: number;            // > 0, ≤ available for that item+color
  }>;
}
```

**Response data**: `DistributionTailorSummary` (updated row for the tailor)

**Atomic operations on success**:
1. Validate: `quantityReturned` ≤ remaining distributed quantity for `batchId`
2. Validate: each consumption entry quantity ≤ available for that stock item + color
3. INSERT `return_records`
4. SELECT N `cutting_pieces` IDs linked to this batch WHERE status='distributed' LIMIT quantityReturned
5. UPDATE `cutting_pieces` SET status='returned' WHERE id IN (selected_piece_ids)
6. For each consumptionRow: INSERT `return_consumption_entries` + INSERT `stock_transactions` (type='consumed', source_module='distribution', source_reference_id=return_id)

**Validation (server-side)**:
- `batchId` exists
- `quantityReturned` ≥ 1 and ≤ remaining distributed quantity
- Each consumption entry quantity ≤ available stock for that item+color
