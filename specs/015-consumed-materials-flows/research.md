# Research: Cutting, Distribution, QC & Finition Flow Finalization

**Branch**: `015-consumed-materials-flows` | **Date**: 2026-03-25

---

## Decision 1: Size Label Moves from Session-Level to Per-Part-Row

**Decision**: Remove `size_label` from `cutting_sessions` (or make it nullable/unused) and add `size_label TEXT NOT NULL` to `cutting_session_parts`. Each produced-part row now carries its own size.

**Rationale**: The user specification explicitly defines Step 2 rows as `(part, size, quantity)`. This reflects reality — a single cutting session may produce parts of different sizes. The existing 014 schema stored `size_label` at the session level, which was a simplification. The `cutting_parts` aggregate table already has `UNIQUE(model_name, size_label, color, part_name)` so the aggregate key is unchanged; only the source of `size_label` moves from `cutting_sessions` to `cutting_session_parts`.

**Alternatives considered**:
- Keep `size_label` on the session and add an override per row — rejected: duplicate data, confusing UX.
- Keep session-level `size_label`, remove from rows — rejected: directly contradicts the specified Step 2 form.

**Impact**: `cutting_sessions.size_label` should be removed from future inserts. The `cutting_session_parts` table needs a migration adding `size_label TEXT NOT NULL DEFAULT ''`. The `cutting:create` IPC handler must be updated to write `size_label` from each part row, not from the session payload.

---

## Decision 2: Consumed Materials Already Exist for Return/QC/Finition — Distribute is the Gap

**Decision**: The consumed materials infrastructure (`stock_transactions` with `type='consumed'`, dedicated `*_consumption_entries` tables, `ReturnConsumptionEditor`) already exists for Return, QC, and Finition flows. The only genuinely missing piece on the backend is consumed materials support in `distribution:distribute`. The UI gap is that no shared `ConsumedMaterialsEditor` component exists — each modal has its own editor variant.

**Rationale**: Codebase exploration confirmed:
- `return_consumption_entries` table and `ReturnConsumptionEditor` UI exist in the Return modal.
- `qc_consumption_entries` and finition consumption entries exist in their respective handlers.
- `distribution:distribute` IPC handler does **not** accept `consumptionRows` and has no corresponding `distribution_consumption_entries` table.

**Decision**: Add a `distribution_consumption_entries` table and extend `distribution:distribute` to accept and process `consumptionRows`. This follows the identical pattern of all other consumption tables.

**Alternatives considered**:
- Reuse `stock_transactions` alone without a detail table — rejected: inconsistent with the existing pattern; detail tables enable traceability queries.

---

## Decision 3: Shared `ConsumedMaterialsEditor` Component

**Decision**: Build a single `ConsumedMaterialsEditor` component at `frontend/components/shared/ConsumedMaterialsEditor.tsx`. It receives `nonFabricItems: NonFabricItem[]` as props and emits `ConsumptionRow[]` via `onChange`. It is collapsed by default, toggled by a button labelled "مواد مستهلكة". Used in all four modals: NewCuttingSessionModal (Step 2), DistributeModal, ReturnModal, QC modal, Finition modal.

**Rationale**: The user specification explicitly requires a single shared component. This prevents divergence in behavior, validation logic, and Arabic labels across modals.

**Alternatives considered**:
- Copy-paste per modal — rejected: maintenance nightmare, explicitly rejected by the spec.

---

## Decision 4: Non-Fabric Items IPC Source

**Decision**: Use the existing `cutting:getNonFabricItems` IPC channel to load the non-fabric stock items for the `ConsumedMaterialsEditor`. This channel already returns `NonFabricItem[]` with `{ id, name, unit, colors: [{color, available}], totalAvailable }`.

**Rationale**: The data structure is exactly what the editor needs. No new IPC channel is required for data loading.

**Where to call it**: Each modal's hook fetches non-fabric items once on mount and passes the result as a prop to `ConsumedMaterialsEditor`.

---

## Decision 5: Real-Time Stock Validation Strategy

**Decision**: Validate consumed material quantities on every `onChange` event inside the `ConsumedMaterialsEditor` by comparing entered quantity against the `available` value from the already-fetched `NonFabricItem[]`. The validation is purely client-side (no extra IPC calls per keystroke). A final server-side re-validation occurs inside each IPC handler at submission time.

**Rationale**: `NonFabricItem[]` is fetched once on modal open and includes current available quantities per color variant. This is sufficient for immediate feedback. The server re-validates at save time to catch concurrent depletion.

**Alternatives considered**:
- Re-fetch availability on every keystroke — rejected: unnecessary network churn for a desktop Electron app.
- Server-side only — rejected: no real-time UX feedback.

---

## Decision 6: Meters-Used Validation in Cutting Step 1

**Decision**: The meters input validates on every `onChange`. Available meters for the selected `(fabricItemId, fabricColor)` are already loaded in the form state (returned by `cutting:getFabricColors`). No extra IPC call needed per keystroke. Display available quantity as muted text below the input field; turn the input red and show an error message if exceeded.

**Rationale**: The `FabricColorOption` type already carries `available: number`. The form state already holds this value once a color is selected.

---

## Decision 7: Step 1 Color Cascade

**Decision**: The color dropdown is conditionally rendered — it only appears after a fabric is selected. It is populated by `cutting:getFabricColors({ fabricItemId })` which returns colors that have been added for that fabric. The user can also create a new color inline via `lookups:createColor`.

**Rationale**: This is the existing behavior in the 014 implementation. No architectural change required — only a UX refinement to ensure the color field hides when no fabric is selected.

---

## Decision 8: Total Cost Live Calculation (Step 1)

**Decision**: Add a read-only computed field below the `layers` and `pricePerLayer` inputs showing `layers × pricePerLayer × selectedEmployees.length`. Updated on every change to those three inputs using `watch()` from `react-hook-form`.

**Rationale**: The user explicitly specified "a read-only total cost field below them updating live." This is purely a frontend computed display — no new data storage required.

---

## Decision 9: Inline Creation Pattern for Parts and Sizes (Step 2)

**Decision**: Part rows in Step 2 use `ManagedDropdown` components (the existing pattern from DistributeModal) for both the Part and Size selectors. This enables inline creation via `lookups:createPart` and `lookups:createSize` respectively, consistent with the existing patterns for Model in Step 1.

**Rationale**: `ManagedDropdown` already exists and handles the "add new inline" pattern. It is already used for Model selection in Step 1 and for ModelName in DistributeModal.

---

## Decision 10: `distribution_consumption_entries` Table Structure

**Decision**: New table mirroring `return_consumption_entries`:

```sql
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

Corresponding `stock_transactions` entry: `type='consumed', source_module='distribution', source_reference_id=batchId`.

**Rationale**: Consistent with all other `*_consumption_entries` tables in the schema.

---

## Resolved Unknowns Summary

| Unknown | Resolution |
|---------|------------|
| Where does `size_label` live in Step 2? | Per part row in `cutting_session_parts`, not session-level |
| Which modals already have consumed materials? | Return, QC, Finition — only Distribute is missing |
| Is there a shared component? | No — must be built as `ConsumedMaterialsEditor` |
| How to validate quantities client-side? | Use already-fetched `NonFabricItem.colors[].available` |
| How to source non-fabric items for all modals? | `cutting:getNonFabricItems` (existing channel) |
| New table needed? | `distribution_consumption_entries` |
| New IPC channels needed? | Extend `distribution:distribute` payload only |
