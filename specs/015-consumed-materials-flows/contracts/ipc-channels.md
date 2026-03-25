# IPC Contracts: Cutting, Distribution, QC & Finition Flow Finalization

**Branch**: `015-consumed-materials-flows` | **Date**: 2026-03-25

All IPC channels follow the project standard: `ipcMain.handle(channel, handler)` in `electron/main.js`, bridged via `electron/preload.js`, consumed via `frontend/lib/ipc-client.ts`. All responses are `{ success: true, data: T } | { success: false, error: string }`.

---

## Modified Channel: `cutting:create`

**Change**: `sizeLabel` removed from top-level payload; each part row now carries `sizeLabel`.

### Request Payload

```typescript
interface CreateCuttingSessionPayload {
  fabricItemId: string;
  fabricColor: string;
  modelName: string;
  // sizeLabel REMOVED — now per part row
  metersUsed: number;
  employeeIds: string[];
  layers: number;
  pricePerLayer: number;
  sessionDate: string;          // ISO date string
  notes?: string;
  parts: CuttingPartRow[];
  consumptionRows: ConsumptionRow[];
}

interface CuttingPartRow {
  partName: string;
  sizeLabel: string;            // NEW — per part row
  count: number;
}

interface ConsumptionRow {
  stockItemId: string;
  color?: string;               // optional color variant
  quantity: number;
}
```

### Response

```typescript
{ success: true; data: CuttingSessionSummary }
| { success: false; error: string }
```

### Backend Changes

- Validate each `CuttingPartRow.sizeLabel` is non-empty.
- Write `cutting_session_parts` rows with `size_label = partRow.sizeLabel`.
- Upsert `cutting_parts` with `size_label` from the part row (not from the session).
- Write `cutting_sessions.size_label = ''` (deprecated, kept for schema compat).

---

## Modified Channel: `distribution:distribute`

**Change**: Add `consumptionRows` to the payload.

### Request Payload

```typescript
interface DistributePayload {
  tailorId: string;
  modelName: string;
  sizeLabel?: string;
  color?: string;
  expectedPiecesCount: number;
  sewingPricePerPiece: number;
  distributionDate: number;     // milliseconds timestamp
  parts: DistributionPartRow[];
  consumptionRows: ConsumptionRow[];  // NEW
}

interface DistributionPartRow {
  partName: string;
  quantity: number;
}

// ConsumptionRow — same type as above
```

### Response

```typescript
{ success: true; data: { batchId: string } }
| { success: false; error: string }
```

### Backend Changes

- After inserting `distribution_batches` and `distribution_batch_parts`:
  1. Validate each consumption row against available stock.
  2. Insert `distribution_consumption_entries` rows.
  3. Insert corresponding `stock_transactions` rows (`type='consumed'`, `source_module='distribution'`, `source_reference_id=batchId`).
  4. All within the same SQLite transaction.

---

## Unchanged Channels (Context Only)

### `cutting:getNonFabricItems`

Used by all four modal hooks to populate the `ConsumedMaterialsEditor`.

```typescript
// Request: none (no payload)
// Response:
{ success: true; data: NonFabricItem[] }

interface NonFabricItem {
  id: string;
  name: string;
  unit: string;
  colors: Array<{ color: string; available: number }>;
  totalAvailable: number;
}
```

### `distribution:return` (unchanged payload, for reference)

```typescript
interface ReturnPayload {
  batchId: string;
  quantityReturned: number;
  returnDate: number;           // ms timestamp
  consumptionRows: ConsumptionRow[];
}
```

### `lookups:createPart` / `lookups:createSize`

Used by the inline-add option in Step 2 part row selectors.

```typescript
// Request:
{ name: string }
// Response:
{ success: true; data: { id: string; name: string } }
```

---

## New Preload Bridge Entries

Add `distribution.distribute` updated signature to `ipcBridge` in `electron/preload.js`:

```javascript
distribution: {
  // existing channels unchanged
  distribute: (payload) => ipcRenderer.invoke('distribution:distribute', payload),
  // consumptionRows now included in payload — no bridge change needed (payload is passed through)
}
```

No new channel name is required — only the payload type widens.

---

## Frontend Type Updates

In `frontend/lib/ipc-client.ts`:

```typescript
cutting: {
  create: (payload: CreateCuttingSessionPayload) => Promise<IpcResponse<CuttingSessionSummary>>;
  // CuttingPartRow now includes sizeLabel
}

distribution: {
  distribute: (payload: DistributePayload) => Promise<IpcResponse<{ batchId: string }>>;
  // DistributePayload now includes consumptionRows
}
```

In `frontend/features/cutting/cutting.types.ts`:

```typescript
export interface CuttingPartRow {
  partName: string;
  sizeLabel: string;  // NEW
  count: number;
}

// Remove sizeLabel from CreateCuttingSessionPayload top level
```

In `frontend/features/distribution/distribution.types.ts`:

```typescript
export interface DistributePayload {
  // existing fields
  consumptionRows: ConsumptionRow[];  // NEW
}
```

---

## Shared Component Contract

### `ConsumedMaterialsEditor`

**Location**: `frontend/components/shared/ConsumedMaterialsEditor.tsx`

```typescript
interface ConsumedMaterialsEditorProps {
  nonFabricItems: NonFabricItem[];
  value: ConsumptionRow[];
  onChange: (rows: ConsumptionRow[]) => void;
  disabled?: boolean;
}

interface ConsumptionRow {
  stockItemId: string;
  color?: string;
  quantity: number;
}
```

**Behavior**:
- Collapsed by default; toggle button labelled "مواد مستهلكة".
- Each row: stock item dropdown (non-fabric only, shows name + available quantity), conditional color dropdown (only if selected item has color variants), quantity number input.
- Items with `totalAvailable === 0` are shown as disabled in the dropdown.
- Quantity validated against `item.colors.find(c => c.color === selectedColor)?.available ?? item.totalAvailable`.
- Invalid row (quantity > available) shows red border + available quantity message.
- "إضافة مادة مستهلكة" button adds a new empty row.
- Each row has a remove button.
- Blank rows (no item selected) are not emitted in `onChange` output.
