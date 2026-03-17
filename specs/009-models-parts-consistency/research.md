# Research: Models, Pieces & Platform-Wide Relational Consistency

**Feature**: 009-models-parts-consistency
**Date**: 2026-03-16

---

## Decision 1: New lookup tables structure (models, parts, sizes)

**Decision**: Mirror the existing `colors`, `item_types`, `units` table structure exactly:
`id TEXT PK, name TEXT NOT NULL UNIQUE, is_predefined INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at INTEGER, updated_at INTEGER`

**Rationale**: The `LookupSection` component and `useLookups` hook already handle any lookup list following this schema. Reusing the same structure means zero new frontend infrastructure for settings management — just add three new IPC channel groups.

**Alternatives considered**:
- Adding a discriminator column to a single `lookup_entries` table — rejected because it would complicate existing queries and require schema migration of existing tables.

---

## Decision 2: Store model/part/size as name strings (denormalized), not as foreign keys

**Decision**: `cutting_pieces.part_name`, `cutting_pieces.color`, `employee_operations.model_name` etc. store the name string at write time, not a foreign key to the managed list.

**Rationale**:
1. Spec explicitly states "historical records retain their stored text values" — this requires the value to be self-contained in the row.
2. Soft-delete support: when a model/part/size is soft-deleted, existing records display the stored name without needing to JOIN a (possibly inactive) lookup row.
3. Consistent with `cutting_sessions.model_name`, `distribution_batches.model_name`, `distribution_batches.size_label` which all already store strings.
4. No referential integrity risk: managed-list enforcement happens at the UI layer (dropdowns), not the DB layer.

**Alternatives considered**:
- FK references to managed list tables — rejected because soft-delete semantics and historical record display become complicated (must handle deleted FK targets); also conflicts with existing schema pattern.

---

## Decision 3: SQLite schema migration strategy (ALTER TABLE)

**Decision**: Add new nullable columns to existing tables via `ALTER TABLE ... ADD COLUMN` in the DB initialization block in `main.js`. Use `IF NOT EXISTS` pattern (or try/catch the ALTER) so re-running the app on an existing DB does not error.

**Rationale**: better-sqlite3 supports `ALTER TABLE ... ADD COLUMN`. Since SQLite does not support `IF NOT EXISTS` for `ADD COLUMN`, the pattern is:
```js
try { db.prepare('ALTER TABLE cutting_pieces ADD COLUMN part_name TEXT').run(); } catch {}
try { db.prepare('ALTER TABLE cutting_pieces ADD COLUMN color TEXT').run(); } catch {}
// repeat for each new column
```
Existing rows will have NULL for the new columns, which is acceptable per spec (historical records retain their values as-is).

**Alternatives considered**:
- Versioned migrations file — overkill for a single-user desktop app; the try/catch approach is consistent with how existing features handle schema evolution in this project.

---

## Decision 4: Real-time selector refresh mechanism

**Decision**: When an inline-add or settings-add creates a new model/part/size, the component calls the IPC channel, then immediately re-fetches the full list and updates local state. No global store invalidation — each component/hook that holds lookup data re-fetches on demand.

**Rationale**: This is exactly how `ManagedDropdown.handleAddColor` already works in `CuttingStep1Form.tsx`:
```ts
async function handleAddColor(name: string) {
  const res = await ipcClient.lookups.createColor({ name });
  if (res.success) {
    ipcClient.lookups.getColors().then(r => { if (r.success) setManagedColors(r.data); });
  }
  return res;
}
```
The `useLookups` hook exposes a `refetch()` that pages can call after any mutation. For platform-wide availability, hooks that hold lookup data call their refetch in `useEffect` on mount and after mutations.

**Alternatives considered**:
- Zustand global store for lookup lists — adds complexity; the spec's Assumptions section explicitly states "Real-time selector updates within the same session are achieved through the existing app state/IPC architecture."

---

## Decision 5: Cutting Step 2 form restructure

**Decision**: Replace `SizeRowsEditor` (freetext `sizeLabel` + `pieceCount`) with a new `PartSizeRowsEditor` component. Each row has:
- `partName` — `ManagedDropdown` from parts list (with inline add)
- `sizeLabel` — `ManagedDropdown` from sizes list (with inline add)
- `quantity` — positive integer input

The existing `cutting:create` IPC handler is updated to accept `{ partName, sizeLabel, quantity }[]` rows instead of `{ sizeLabel, pieceCount }[]`. Each piece inserted into `cutting_pieces` now also stores `part_name` and `color` (inherited from `cutting_session.fabric_color`).

**Rationale**: Minimal change to the wizard structure — Step 1 is unchanged (model_name becomes a select but that's a field-level change); Step 2 replaces one sub-component. Backward compatible: existing `cutting_pieces` rows have NULL `part_name` and `color` (pre-feature historical data).

---

## Decision 6: Employee operations context columns

**Decision**: Add `model_name TEXT`, `part_name TEXT`, `color TEXT` to `employee_operations`. Populate:
- Cutting operations: all three from the session/row context
- Distribution/QC/finition operations: `model_name` and `color` only; `part_name` stays NULL

**Rationale**: Clarification Q1 from `/speckit.clarify` established that non-cutting operations are batch-level and don't record a specific part. NULL is acceptable for part_name in those rows.

---

## Decision 7: Stock transaction model context

**Decision**: Add `model_name TEXT` to `stock_transactions`. Populate it when inserting consumed-type transactions from cutting, QC, finition, and distribution operations.

**Rationale**: FR-020 requires source operation type (already `source_module`) + source record ID (already `source_reference_id`) + model name + date. The only missing column is `model_name`.

---

## Decision 8: Distribution batch form — model and size selects

**Decision**: Update the distribution batch creation form to use `ManagedDropdown` for both `model_name` and `size_label`. No new DB column needed — both columns already exist as text in `distribution_batches`.

**Rationale**: The platform-wide consistency requirement means these text fields are now populated exclusively from managed lists. The storage format (name string) is unchanged.

---

## Decision 9: Employee operations history — clickable navigation

**Decision**: Make each row in `OperationsHistory.tsx` a clickable row that calls a navigation handler. The `source_reference_id` already exists in `employee_operations`. The page that renders the employee detail will use `router.push()` (or an `onNavigate` prop) to route to the appropriate source record URL based on `operation_type`.

**Navigation targets**:
- `cutting` → `/cutting/{source_reference_id}`
- `distribution` → `/distribution/{source_reference_id}`
- `qc` → `/qc/{source_reference_id}` (anchor/highlight)
- `finition` → `/qc/{source_reference_id}` (finition tab)
- `custom` → no navigation (no source record)

**Rationale**: The `source_reference_id` column is already populated when operations are created from production modules. Clickable navigation only requires adding a click handler + router call.
