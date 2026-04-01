# Research: Session Cost Calculation & Part Cost Distribution

**Branch**: `018-session-cost-distribution` | **Date**: 2026-04-01

---

## Decision 1: Batch Identification Strategy

**Decision**: A "purchase batch" maps 1-to-1 to a single `stock_transactions` row with `type = 'inbound'`. No new abstraction needed.

**Rationale**: The `stock_transactions` table already stores every inbound purchase with `price_per_unit`, `quantity`, `transaction_date`, `color`, and `stock_item_id`. Using the inbound transaction id as the batch handle is natural and avoids schema duplication.

**Alternatives considered**: Creating a separate `purchase_batches` table — rejected because it would duplicate data already in `stock_transactions` and break the existing stock availability calculation pattern.

---

## Decision 2: Available Quantity Per Batch

**Decision**: Available quantity per batch = `original inbound quantity − SUM(quantity)` in a new `cutting_batch_consumptions` table where `stock_transaction_id = batch.id`.

**Rationale**: The existing pattern computes total available stock by summing across all inbound vs consumed transactions. For per-batch availability we need a table that links consumed quantities to their specific source inbound transaction — something the current `cutting_consumption_entries` and `stock_transactions` (consumed) records do not track. A new `cutting_batch_consumptions` table fills this gap cleanly.

**Alternatives considered**:
- Adding a `source_inbound_id` column to `cutting_consumption_entries` — rejected because it conflates two concerns (session metadata vs batch accounting) and the existing row structure targets item+color granularity, not batch granularity.
- Storing batch references in `stock_transactions` consumed rows — rejected because consumed transactions don't currently carry purchase-batch linkage and adding it would complicate the stock availability calculation used by all other modules.

---

## Decision 3: Preserving Backward Compatibility for Fabric Consumption

**Decision**: The existing `meters_used` column on `cutting_sessions` is kept and populated as `SUM(quantity)` across all fabric batch consumptions. The existing `stock_transactions` consumed row for fabric is also kept, generated as before (total meters deducted). The new `cutting_batch_consumptions` rows sit alongside, adding per-batch traceability without breaking existing queries.

**Rationale**: Multiple existing queries, the KPI handler, and the detail view read `meters_used` directly. Removing or nulling it would break the display of all historical sessions and any downstream logic relying on it.

**Alternatives considered**: Removing `meters_used` and computing it from batch consumptions on read — rejected because it would require rewriting every existing query and detail view.

---

## Decision 4: Employee Cost Formula Source

**Decision**: Employee cost = `layers × price_per_layer × COUNT(employeeIds)`. All three inputs are already collected in Step 1 and stored on the session. No additional data needed.

**Rationale**: The spec states this formula explicitly and all fields already exist in the current payload and session table. The existing `employee_operations` records store per-employee earnings = `layers × price_per_layer` — consistent with the formula.

**Alternatives considered**: Per-employee variable pay rates — rejected; not in scope.

---

## Decision 5: Cost Distribution Lock/Auto State

**Decision**: Lock/auto state is pure frontend UI state managed in component-local state (not Zustand, not persisted). On submission, only the resolved `unit_cost` per part row is sent to the backend and stored on `cutting_session_parts` rows. The lock/auto flag itself is not persisted.

**Rationale**: The flag is transient — it only matters during the editing session. After submission the unit cost value is what matters for traceability. Using component-local state (not Zustand) aligns with the Constitution: "NO Zustand for single-component data."

**Alternatives considered**: Persisting lock state in the database — rejected; it has no business value after submission.

---

## Decision 6: Rounding Strategy for Auto-Adjustment

**Decision**: When distributing session cost equally across part rows, compute `unitCost = sessionCost / totalPieces` rounded to 2 decimal places per row. The last auto row absorbs the rounding remainder: its unit cost = `sessionCost − SUM(all other row totals)` divided by its quantity. If there is only one auto row remaining, its unit cost = `(sessionCost − SUM(locked row totals)) / its quantity`.

**Rationale**: This guarantees the grand total invariant (grand total = session cost exactly) regardless of floating-point rounding edge cases. The last-row absorption is the standard accounting approach for fixed-sum distribution.

**Alternatives considered**: Distributing remainder across all auto rows evenly — rejected; more complex and still potentially leaves fractional remainders.

---

## Decision 7: New IPC Channels

**Decision**: Two new IPC channels are added:
- `cutting:getFabricBatches` — accepts `{ stockItemId, color }`, returns all inbound batches with their available quantities
- `cutting:getMaterialBatches` — accepts `{ stockItemId, color? }`, returns all inbound batches for a non-fabric item

**Rationale**: Batch data is backend-computed (requires database joins to subtract prior consumptions) so it must come through IPC. Keeping them separate from the existing `cutting:getFabrics` / `cutting:getNonFabricItems` channels preserves the existing payload shape and avoids over-fetching on initial load.

**Alternatives considered**: Embedding batch data in the existing `getFabrics` response — rejected; batch data is only needed after a specific fabric+color is selected, so fetching it upfront would waste resources and bloat the initial response.

---

## Decision 8: Schema Migration Strategy

**Decision**: All schema changes are applied via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements in `main.js` at startup (the existing migration pattern used throughout the project). The new `cutting_batch_consumptions` table is created with `CREATE TABLE IF NOT EXISTS`.

**Rationale**: This project uses an inline migration pattern in `main.js` — no ORM migration runner. Adding columns with `IF NOT EXISTS` is safe for existing databases and existing sessions (which will have NULL for the new cost columns, displayed as 0 in the UI).

---

## Key Existing Files Relevant to This Feature

| File | Relevance |
|------|-----------|
| `electron/main.js` lines 1909–2257 | All cutting IPC handlers & SQL queries |
| `frontend/components/cutting/CuttingStep1Form.tsx` | Step 1 form — fabric, meters, employees, layers |
| `frontend/components/cutting/CuttingStep2Form.tsx` | Step 2 form — parts, consumption entries |
| `frontend/components/shared/ConsumedMaterialsEditor.tsx` | Consumed materials rows editor |
| `frontend/features/cutting/cutting.types.ts` | TypeScript types for cutting domain |
| `frontend/lib/ipc-client.ts` lines 155–168 | IPC client methods for cutting |
| `frontend/public/locales/ar/common.json` | Arabic strings for all UI copy |
