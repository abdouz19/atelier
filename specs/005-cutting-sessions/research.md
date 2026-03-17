# Research: Cutting Session Management

**Branch**: `005-cutting-sessions` | **Date**: 2026-03-15

---

## Decision 1: New Tables vs Reusing Existing

**Decision**: Create 3 new tables (`cutting_sessions`, `cutting_pieces`, `cutting_consumption_entries`) and reuse 2 existing tables (`stock_transactions` for fabric/non-fabric deductions, `employee_operations` for earnings).

**Rationale**: The `stock_transactions` table already has `source_module` and `source_reference_id` columns (present in `electron/main.js` CREATE TABLE) — designed precisely for cross-module consumption records. The `employee_operations` table (added in Spec 4) has `operation_type` and `source_module` columns for the same purpose. Reusing them avoids duplicating the inventory and payroll ledger concepts.

**Alternatives considered**: A dedicated `cutting_employee_earnings` table — rejected because it would create a parallel earnings system that wouldn't appear on the employee detail screen without a join.

---

## Decision 2: Individual Pieces vs Size Aggregates in cutting_pieces

**Decision**: Store individual piece records in `cutting_pieces` (one row per piece), each with a `size_label` and `status` column. Detail view queries use `GROUP BY size_label` for display.

**Rationale**: The spec requires "each piece is created individually with status not_distributed" for downstream distribution tracking. Individual rows allow future distribution modules to select and claim specific pieces. KPI and detail queries use COUNT/GROUP BY — trivial in SQLite even at thousands of rows.

**Alternatives considered**: One aggregate row per size (size_label + count) — rejected because it cannot support individual piece selection in distribution.

---

## Decision 3: Atomic Submission Strategy

**Decision**: Use SQLite's `db.transaction()` in `electron/main.js` to wrap all submission operations: fabric deduction, non-fabric deductions, piece creation, and employee earnings.

**Rationale**: `better-sqlite3` supports synchronous transactions via `db.transaction(fn)`. This is already the established pattern in the project (see `stock:addInbound` handler). A failed step automatically rolls back all prior writes.

**Alternatives considered**: Manual rollback on error — rejected because it requires complex error handling and risks partial state if the rollback itself fails.

---

## Decision 4: KPI Computation Strategy

**Decision**: Compute all KPIs at query time via SQL aggregates (COUNT, SUM) — no cached or pre-computed KPI columns.

**Rationale**: Consistent with the existing pattern for `stock:getAll` (balance computed via subquery) and `employees:getAll` (balance_due via subquery). SQLite handles these aggregates in milliseconds for the expected data volume of an atelier.

**Alternatives considered**: Storing running totals in a `cutting_kpis` summary table — rejected as premature optimization that adds write-path complexity.

---

## Decision 5: Fabric Color / Available Quantity Lookup

**Decision**: For the fabric color selector and meters-available display, query `stock_transactions` with `SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END)` grouped by `color` for the selected `stock_item_id`, filtered by `quantity > 0`.

**Rationale**: Exact same calculation used by `stock:getById` to compute current quantity per color variant. No new mechanism needed.

**Alternatives considered**: Denormalized current-quantity column on `stock_items` — rejected as it would require updating on every transaction, adding race conditions.

---

## Decision 6: Autocomplete Data Sources

**Decision**:
- Model name autocomplete: `SELECT DISTINCT model_name FROM cutting_sessions ORDER BY model_name` (returned by `cutting:getModelSuggestions`)
- Size label autocomplete: `SELECT DISTINCT size_label FROM cutting_pieces ORDER BY size_label` (returned by `cutting:getSizeSuggestions`)

**Rationale**: Free-text with suggestions pattern already used in the codebase. Keeping suggestions separate from list endpoints avoids over-fetching.

**Alternatives considered**: Returning suggestions inline with `cutting:getAll` — rejected as it couples unrelated concerns.

---

## Decision 7: IPC Channel Set (9 channels)

**Decision**: 9 IPC channels:

| Channel | Purpose |
|---------|---------|
| `cutting:getAll` | All sessions for the table (summary rows) |
| `cutting:getById` | Full session detail with pieces and consumption |
| `cutting:getKpis` | 5 KPI values |
| `cutting:create` | Atomic session creation (both steps) |
| `cutting:getFabrics` | قماش items with per-color availability |
| `cutting:getFabricColors` | Colors + available qty for one fabric |
| `cutting:getNonFabricItems` | Non-قماش items with color variants |
| `cutting:getModelSuggestions` | Distinct model names for autocomplete |
| `cutting:getSizeSuggestions` | Distinct size labels for autocomplete |

**Rationale**: Mirrors the granularity of the employees module (9 channels). Separating `getFabrics` from `getFabricColors` avoids fetching all color data for all fabrics upfront.

---

## Decision 8: Frontend Navigation

**Decision**: The cutting session detail view uses the `?id=` query param pattern (same as employees module). The cutting page reads `searchParams.get('id')` and renders either the list view or the detail view.

**Rationale**: Consistent with the established navigation pattern for detail views in this project (static Next.js export cannot use dynamic route segments — must use query params).

---

## Decision 9: Two-Step Modal Architecture

**Decision**: A single `NewCuttingSessionModal` component holds step state (1 or 2) and passes validated step-1 data to the step-2 form. Each step is a separate child component (`Step1Form`, `Step2Form`) under the 150-line limit. Step-1 data is held in React state within the modal and included in the final submission payload.

**Rationale**: Splitting steps into separate components respects the 150-line constitution limit. Holding step-1 data in the parent modal component (not global state) keeps the form scope local.

**Alternatives considered**: Zustand store for cross-step form state — rejected per constitution ("NO Zustand for single-component data").
