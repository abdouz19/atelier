# IPC Contracts: Cutting Session Management

**Branch**: `005-cutting-sessions` | **Date**: 2026-03-15

All channels follow the project response envelope: `{ success: true, data: T } | { success: false, error: string }`

---

## Channel Definitions

### `cutting:getKpis`

Returns aggregate KPI values for the Cutting screen header.

**Payload**: none

**Response data**:
```typescript
interface CuttingKpis {
  totalSessions: number;
  totalPieces: number;
  piecesNotDistributed: number;
  totalMetersConsumed: number;
  totalCostPaid: number;
}
```

---

### `cutting:getAll`

Returns all cutting sessions for the sessions table.

**Payload**: none

**Response data**: `CuttingSessionSummary[]`

```typescript
interface CuttingSessionSummary {
  id: string;
  sessionDate: number;           // epoch ms
  fabricName: string;
  fabricColor: string;
  modelName: string;
  metersUsed: number;
  totalPieces: number;
  employeeNames: string[];       // display names of employees
  totalCost: number;             // sum of all employee earnings = layers × pricePerLayer × employeeCount
}
```

---

### `cutting:getById`

Returns full session detail for the detail view.

**Payload**: `{ id: string }`

**Response data**: `CuttingSessionDetail`

```typescript
interface CuttingSessionDetail {
  id: string;
  sessionDate: number;
  fabricItemId: string;
  fabricName: string;
  fabricColor: string;
  modelName: string;
  metersUsed: number;
  layers: number;
  pricePerLayer: number;
  notes: string | null;
  totalCost: number;
  employees: Array<{ id: string; name: string; earnings: number }>;
  piecesBySize: Array<{ sizeLabel: string; count: number }>;
  consumptionEntries: Array<{
    stockItemId: string;
    stockItemName: string;
    color: string | null;
    quantity: number;
  }>;
}
```

---

### `cutting:getFabrics`

Returns all active (non-archived) stock items of type 'قماش' with available color totals.

**Payload**: none

**Response data**: `FabricItem[]`

```typescript
interface FabricItem {
  id: string;
  name: string;
  colors: Array<{ color: string; available: number }>;  // only colors with available > 0
}
```

---

### `cutting:getFabricColors`

Returns available color variants with quantities for a specific fabric item.

**Payload**: `{ fabricItemId: string }`

**Response data**: `FabricColorOption[]`

```typescript
interface FabricColorOption {
  color: string;
  available: number;  // current available quantity (inbound - consumed)
}
```

---

### `cutting:getNonFabricItems`

Returns all active (non-archived) stock items that are NOT of type 'قماش', with their color variants.

**Payload**: none

**Response data**: `NonFabricItem[]`

```typescript
interface NonFabricItem {
  id: string;
  name: string;
  unit: string;
  colors: Array<{ color: string; available: number }>;  // empty array if item has no color variants
  totalAvailable: number;  // sum across all colors (for colorless items)
}
```

---

### `cutting:getModelSuggestions`

Returns distinct model names from all past sessions for autocomplete.

**Payload**: none

**Response data**: `string[]`

---

### `cutting:getSizeSuggestions`

Returns distinct size labels from all past pieces for autocomplete.

**Payload**: none

**Response data**: `string[]`

---

### `cutting:create`

Atomically creates a cutting session with all associated records.

**Payload**: `CreateCuttingSessionPayload`

```typescript
interface SizeRow {
  sizeLabel: string;
  pieceCount: number;          // ≥ 1
}

interface ConsumptionRow {
  stockItemId: string;
  color: string | null;
  quantity: number;            // > 0
}

interface CreateCuttingSessionPayload {
  fabricItemId: string;
  fabricColor: string;
  modelName: string;
  metersUsed: number;          // > 0, ≤ available for fabricItemId+fabricColor
  employeeIds: string[];       // at least 1, all must be active
  layers: number;              // > 0
  pricePerLayer: number;       // > 0
  sessionDate: number;         // epoch ms
  notes?: string;
  sizeRows: SizeRow[];         // at least 1 row
  consumptionRows: ConsumptionRow[];  // may be empty
}
```

**Response data**: `CuttingSessionSummary` (the newly created session, for appending to the table)

**Atomic operations on success**:
1. INSERT into `cutting_sessions`
2. INSERT N rows into `cutting_pieces` (one per piece, total = sum of sizeRows[].pieceCount)
3. For each consumptionRow: INSERT into `cutting_consumption_entries` + INSERT into `stock_transactions` (type='consumed', source_module='cutting')
4. INSERT into `stock_transactions` for fabric deduction (type='consumed', source_module='cutting')
5. For each employeeId: INSERT into `employee_operations` (operation_type='cutting', source_module='cutting', source_reference_id=session.id)

**Validation (server-side)**:
- `metersUsed` ≤ available for `fabricItemId` + `fabricColor`
- Each `consumptionRow.quantity` ≤ available for that item + color
- All `employeeIds` exist and have status = 'active'
- `sizeRows` is non-empty; each `pieceCount` ≥ 1
