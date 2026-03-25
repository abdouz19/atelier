# Quickstart: Cutting, Distribution, QC & Finition Flow Finalization

**Branch**: `015-consumed-materials-flows` | **Date**: 2026-03-25

---

## What This Feature Changes

This feature makes three categories of changes to the existing codebase:

1. **Cutting form redesign**: Size label moves from session-level (Step 1) to per-part-row (Step 2). Step 1 UX is refined (cascade dropdowns, live validation, live cost). Step 2 gains a `sizeLabel` selector per part row.
2. **Shared `ConsumedMaterialsEditor` component**: Replaces modal-specific consumption editors. Used in all five operations: cutting, distribute, return, QC, finition.
3. **Distribution consumed materials**: The Distribute modal gains a consumed materials section (the only modal that was missing it). A new `distribution_consumption_entries` table and updated `distribution:distribute` IPC handler support this.

---

## Dev Environment

```bash
npm run dev:electron   # starts Electron + Next.js dev server
```

SQLite database is created/migrated on first Electron launch via `electron/main.js` `initializeDatabase()`.

---

## Implementation Order

Work in this order to avoid blocking yourself:

### Step 1 — Database Migration

In `electron/main.js`, inside `initializeDatabase()`, add **after** the existing `cutting_session_parts` CREATE:

```sql
-- Add size_label to cutting_session_parts
ALTER TABLE cutting_session_parts ADD COLUMN size_label TEXT NOT NULL DEFAULT '';

-- New table for distribution consumed materials
CREATE TABLE IF NOT EXISTS distribution_consumption_entries (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES distribution_batches(id),
  stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
  color TEXT,
  quantity REAL NOT NULL CHECK(quantity > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Both statements are idempotent-safe: wrap the ALTER in a `try/catch` (SQLite throws if column already exists — catch and ignore that specific error).

### Step 2 — Update TypeScript Types

`frontend/features/cutting/cutting.types.ts`:
- Add `sizeLabel: string` to `CuttingPartRow` (or `PartRow`).
- Remove `sizeLabel` from `CreateCuttingSessionPayload` top level (or mark deprecated).

`frontend/features/distribution/distribution.types.ts`:
- Add `consumptionRows: ConsumptionRow[]` to `DistributePayload`.

`frontend/lib/ipc-client.ts`:
- Update `cutting.create` and `distribution.distribute` signatures to match new payload types.

### Step 3 — Build `ConsumedMaterialsEditor`

Create `frontend/components/shared/ConsumedMaterialsEditor.tsx`:
- Props: `nonFabricItems`, `value`, `onChange`, `disabled?`
- Collapsed by default; toggle via "مواد مستهلكة" button/chevron.
- Each row: item dropdown → (if item has colors) color dropdown → quantity input → remove button.
- Zero-stock items disabled in dropdown.
- Quantity validation against `item.colors[selectedColor].available` or `item.totalAvailable`.
- "إضافة مادة مستهلكة" button below rows.
- All Arabic strings externalized to `public/locales/ar/common.json`.

### Step 4 — Update `CuttingStep2Form` / `PartRowsEditor`

In `frontend/components/cutting/PartRowsEditor.tsx`:
- Add `sizeLabel` field to each row alongside `partName`.
- Use `ManagedDropdown` with `lookups:getSizes` / `lookups:createSize` for the size selector.
- Emit `{ partName, sizeLabel, count }[]` via `onChange`.

In `frontend/components/cutting/CuttingStep2Form.tsx`:
- Replace the existing `ConsumptionRowsEditor` (if modal-specific) with the new shared `ConsumedMaterialsEditor`.
- Pass `nonFabricItems` from a `cutting:getNonFabricItems` call (already done in the existing form hook or add it).

### Step 5 — Update `CuttingStep1Form`

In `frontend/components/cutting/CuttingStep1Form.tsx`:
- Remove the `sizeLabel` / `sizeLabel` field (it now lives in Step 2).
- Ensure the color dropdown is conditionally rendered (only after fabric is selected).
- Add available meters display as muted text below the meters input: e.g., `متاح: {availableMeters} م`.
- Add live total cost field: `layers × pricePerLayer` (read-only). Update `pricePerLayer` or `layers` changes to re-compute via `watch()`.
- Update `Step1Values` type to remove `sizeLabel`.

### Step 6 — Update `cutting:create` IPC Handler

In `electron/main.js`, `ipcMain.handle('cutting:create', ...)`:
- Remove reading of `payload.sizeLabel` for the session.
- When inserting `cutting_sessions`, write `size_label = ''`.
- When inserting `cutting_session_parts`, use `partRow.sizeLabel` instead.
- When upserting `cutting_parts`, use `partRow.sizeLabel` instead of the session-level value.

### Step 7 — Update `DistributeModal`

In `frontend/components/distribution/DistributeModal.tsx`:
- Import and render `ConsumedMaterialsEditor` at the bottom of the form (before the submit button), collapsed by default.
- Fetch `nonFabricItems` via `cutting:getNonFabricItems` in the modal's hook or component mount.
- Include `consumptionRows` in the submitted payload.

### Step 8 — Update `distribution:distribute` IPC Handler

In `electron/main.js`, `ipcMain.handle('distribution:distribute', ...)`:
- Accept `consumptionRows` from payload.
- After inserting the batch and batch parts:
  1. Validate each consumption row (quantity ≤ available).
  2. Insert `distribution_consumption_entries` rows.
  3. Insert `stock_transactions` rows (`type='consumed'`, `source_module='distribution'`, `source_reference_id=batchId`).
- All within the existing `db.transaction()` block.

### Step 9 — Verify Return / QC / Finition Modals

The Return, QC, and Finition modals already have consumed materials support. Replace their existing modal-specific consumption editors with the new shared `ConsumedMaterialsEditor`:

- `frontend/components/distribution/ReturnModal.tsx` — replace `ReturnConsumptionEditor` with `ConsumedMaterialsEditor`.
- `frontend/components/qc/AddQcRecordModal.tsx` — replace any inline consumption UI.
- `frontend/components/finition/AddFinitionRecordModal.tsx` — replace inline consumption UI.

Ensure each of these modals fetches `nonFabricItems` and passes them as props.

### Step 10 — Arabic Strings

Add to `frontend/public/locales/ar/common.json`:

```json
"consumedMaterials": "مواد مستهلكة",
"addConsumedMaterial": "إضافة مادة مستهلكة",
"availableStock": "المخزون المتاح",
"exceedsAvailableStock": "الكمية تتجاوز المخزون المتاح",
"sizeLabel": "المقاس",
"addPart": "إضافة جزء",
"totalCost": "التكلفة الإجمالية",
"availableMeters": "متاح"
```

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `electron/main.js` | Modify `initializeDatabase`, `cutting:create`, `distribution:distribute` |
| `electron/preload.js` | No change needed (payload passes through) |
| `frontend/lib/ipc-client.ts` | Update `cutting.create` + `distribution.distribute` types |
| `frontend/features/cutting/cutting.types.ts` | Add `sizeLabel` to `CuttingPartRow`, remove from session payload |
| `frontend/features/distribution/distribution.types.ts` | Add `consumptionRows` to `DistributePayload` |
| `frontend/components/shared/ConsumedMaterialsEditor.tsx` | **NEW** |
| `frontend/components/cutting/PartRowsEditor.tsx` | Add `sizeLabel` field per row |
| `frontend/components/cutting/CuttingStep1Form.tsx` | Remove `sizeLabel`, add live cost, refine UX |
| `frontend/components/cutting/CuttingStep2Form.tsx` | Use shared `ConsumedMaterialsEditor` |
| `frontend/components/distribution/DistributeModal.tsx` | Add `ConsumedMaterialsEditor` section |
| `frontend/components/distribution/ReturnModal.tsx` | Replace with shared `ConsumedMaterialsEditor` |
| `frontend/components/qc/AddQcRecordModal.tsx` | Replace with shared `ConsumedMaterialsEditor` |
| `frontend/components/finition/AddFinitionRecordModal.tsx` | Replace with shared `ConsumedMaterialsEditor` |
| `frontend/public/locales/ar/common.json` | Add new Arabic strings |

---

## Key Gotchas

1. **SQLite ALTER TABLE** does not support dropping columns. Do not attempt to drop `cutting_sessions.size_label` — just stop writing to it.
2. **ALTER TABLE idempotency**: Wrap `ALTER TABLE cutting_session_parts ADD COLUMN size_label ...` in a try/catch that silently ignores "duplicate column name" errors.
3. **`cutting_parts` upsert** must now read `size_label` from the part row, not the session. Missing this will insert blank size_labels into the aggregate.
4. **`ConsumedMaterialsEditor` blank row guard**: The component must filter out rows where `stockItemId` is empty before calling `onChange`, so parent forms never receive incomplete rows.
5. **Zero-stock items**: Items with `totalAvailable === 0` should be visually disabled in the dropdown but still selectable if a color variant has stock. Check `item.colors` individually.
