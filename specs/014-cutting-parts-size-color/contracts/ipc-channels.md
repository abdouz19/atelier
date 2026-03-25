# IPC Channel Contracts

## Modified Channels

### `cutting:create`

**Payload change**: Add `sizeLabel: string` field.

```typescript
interface CreateCuttingSessionPayload {
  fabricItemId: string;
  fabricColor: string;
  modelName: string;
  sizeLabel: string;        // NEW — from sizes lookup
  metersUsed: number;
  employeeIds: string[];
  layers: number;
  pricePerLayer: number;
  sessionDate: number;
  notes?: string;
  parts: Array<{ partName: string; count: number }>;
  consumptionRows: Array<{ stockItemId: string; color: string | null; quantity: number }>;
}
```

**Behavior changes**:
- Inserts `size_label` into `cutting_sessions`
- Inserts each part into `cutting_session_parts` (per-session log)
- Upserts each part into `cutting_parts` aggregate: `ON CONFLICT(model_name, size_label, color, part_name) DO UPDATE SET count = count + excluded.count, updated_at = excluded.updated_at`
- Uses `modelName` and `fabricColor` (from session) + `sizeLabel` as the aggregate key

---

### `cutting:getById`

**Response change**: `parts[]` now comes from `cutting_session_parts` (not `cutting_parts`). Add `sizeLabel` to session detail.

```typescript
interface CuttingSessionDetail {
  // ... existing fields ...
  sizeLabel: string;          // NEW
  parts: Array<{ partName: string; count: number }>;  // from cutting_session_parts
}
```

---

### `cutting:getAll`

**Response change**: Add `sizeLabel` to each session summary.

```typescript
interface CuttingSessionSummary {
  // ... existing fields ...
  sizeLabel: string;   // NEW
}
```

---

### `cutting:getPartSuggestions`

**Behavior change**: Query `cutting_parts` directly (no session join needed). Returns distinct part names for the given model from the aggregate table.

```typescript
// payload unchanged
{ modelName: string }
// response unchanged
{ success: true; data: string[] }
```

---

### `cutting:getPartsInventory`

**Response change**: Add `sizeLabel` and `color` fields. Query rewritten to use `cutting_parts` aggregate table (much simpler).

```typescript
interface PartsInventoryRow {
  modelName: string;
  sizeLabel: string;       // NEW
  color: string;           // NEW
  partName: string;
  totalProduced: number;
  totalDistributed: number;
  availableCount: number;
}
```

**New query logic**:
```sql
SELECT
  cp.model_name, cp.size_label, cp.color, cp.part_name,
  cp.count AS total_produced,
  COALESCE(net_distributed, 0) AS total_distributed,
  cp.count - COALESCE(net_distributed, 0) AS available_count
FROM cutting_parts cp
LEFT JOIN (
  SELECT dbp.part_name, db.model_name, db.size_label, db.color,
    SUM(dbp.quantity * (1 - COALESCE(
      (SELECT CAST(SUM(rr.quantity_returned) AS REAL) / db.quantity
       FROM return_records rr WHERE rr.batch_id = db.id), 0))) AS net_distributed
  FROM distribution_batch_parts dbp
  JOIN distribution_batches db ON db.id = dbp.batch_id
  GROUP BY dbp.part_name, db.model_name, db.size_label, db.color
) dist ON dist.part_name = cp.part_name
      AND dist.model_name = cp.model_name
      AND dist.size_label = COALESCE(cp.size_label, '')
      AND dist.color = COALESCE(cp.color, '')
ORDER BY cp.model_name, cp.size_label, cp.color, cp.part_name
```

---

### `distribution:getAvailablePartsForModel`

**Payload change**: Add `sizeLabel` and `color` filters.

```typescript
// Old
{ modelName: string }
// New
{ modelName: string; sizeLabel: string; color: string }
```

**Behavior**: Filters `cutting_parts` by all three fields. Returns only parts with `available > 0`.

---

### `distribution:distribute`

**Payload change**: Add `sizeLabel` and `color`.

```typescript
interface DistributePayload {
  tailorId: string;
  modelName: string;
  sizeLabel: string;        // NEW
  color: string;            // NEW
  expectedPiecesCount: number;
  sewingPricePerPiece: number;
  distributionDate: number;
  parts: Array<{ partName: string; quantity: number }>;
}
```

**Behavior**: Stores `size_label` and `color` in `distribution_batches`. Availability validation now filters `cutting_parts` by (model_name, size_label, color, part_name).

---

## New Channels

### `cutting:getAvailableSizesForModel`

Returns sizes that have available parts inventory for a given model (used in distribution form size dropdown).

```typescript
// payload
{ modelName: string }
// response
{ success: true; data: string[] }  // list of size_label values
```

### `cutting:getAvailableColorsForModelSize`

Returns colors that have available parts inventory for a given (model, size) (used in distribution form color dropdown).

```typescript
// payload
{ modelName: string; sizeLabel: string }
// response
{ success: true; data: string[] }  // list of color values
```

---

## Unchanged Channels

- `cutting:getFabrics` — unchanged
- `cutting:getFabricColors` — unchanged
- `cutting:getNonFabricItems` — unchanged
- `distribution:getBatchesForTailor` — unchanged (already returns `sizeLabel`, `color`)
- `distribution:getDetailByTailor` — unchanged
- `distribution:return` — unchanged
- `final-stock:getKpis`, `final-stock:getRows`, `final-stock:getHistory` — verify filters are applied; no interface changes
