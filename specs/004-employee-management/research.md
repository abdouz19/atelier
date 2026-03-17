# Research: Employee Management

**Branch**: `004-employee-management` | **Date**: 2026-03-14
**Status**: Complete — all decisions resolved

---

## Decision 1: Photo Storage Pattern

**Decision**: Reuse the stock-images pattern — employee photos are transferred as base64 strings via IPC, saved to disk inside `app.getPath('userData')/employee-photos/`, and the filename is stored in the `employees.photo_path` column. A `resolveImagePath()` helper in the service converts the filename to an absolute `file://` path for renderer display.

**Rationale**: This is already proven and in production for stock item images (`stock.service.ts` lines 93–125). Reusing the same pattern eliminates research debt, keeps IPC payloads uniform, and avoids storing binary blobs in SQLite.

**Alternatives considered**: Storing base64 in SQLite (rejected — inflates DB file), using a separate file server (rejected — Electron is a single-process app with direct FS access).

---

## Decision 2: Balance Due Computation

**Decision**: Compute `balance_due` on the fly at the SQL layer using subqueries — not stored as a column. For `getAll`, embed subqueries directly in the Drizzle select. For `getById`, compute as part of the full detail query.

**Rationale**: A stored balance column would require updating on every operation/payment write, introducing consistency risk. SQL subqueries are fast enough for the expected data volume (SC-002 target: ≤2 s for 1,000 operation records). Computed values are always correct without a reconciliation step, satisfying FR-019.

**Alternatives considered**: Storing balance in the `employees` row (rejected — denormalized, requires careful transactional updates), computing in the service layer via separate queries (rejected — N+1 for the list view).

---

## Decision 3: Operations Grouping Strategy

**Decision**: The `getById` query returns all operation rows flat and ordered by `operation_date DESC`. The service layer groups them by `operation_type`, computes per-group subtotals and counts, and returns a structured `OperationGroup[]` array in the DTO.

**Rationale**: Grouping in the service (not in SQL) keeps queries simple and avoids complex `GROUP BY` / `OVER` window functions in Drizzle. The expected row count per employee is modest (the 1,000-record SC-002 benchmark is a ceiling, not a typical value).

**Alternatives considered**: SQL `GROUP BY` with aggregates only (rejected — loses individual operation rows needed for the history table), client-side grouping (rejected — constitution prohibits business logic in components).

---

## Decision 4: Status Toggle IPC Design

**Decision**: Dedicated `employees:setStatus` channel accepting `{ id, status: 'active' | 'inactive' }`. Status change is handled separately from profile update (`employees:update`) to keep semantics clear and avoid accidental status resets when editing profile fields.

**Rationale**: In the suppliers module, soft-delete used a separate `delete` call. Employee status is more nuanced (bidirectional toggle), so a dedicated channel with an explicit status value is cleaner than a boolean flag.

**Alternatives considered**: Including status in `employees:update` (rejected — risks silent status changes during profile edits; confirmation-dialog logic becomes harder to enforce).

---

## Decision 5: Payment Mutability

**Decision**: Payments are fully mutable — edit (`employees:updatePayment`) and delete (`employees:deletePayment`) are both supported. Each modifying operation returns a fresh `EmployeeDetail` so the UI reflects updated totals immediately. Delete requires a `ConfirmDialog` (constitution requirement for destructive actions).

**Rationale**: User answered C in clarification Q3. Full mutability is appropriate for a single-user desktop app where there is no audit/multi-user concern.

**Alternatives considered**: Immutable ledger (answered A — rejected by user), delete-only (answered B — rejected by user).

---

## Decision 6: Manual Operation Entry

**Decision**: Manual operation records use the `employees:addOperation` channel. They set `source_module = null` and `source_reference_id = null` in the DB, making them distinguishable from auto-linked production-module records. No delete for operation records — the spec specifies only add (FR-010a). Auto-linked operations from future production modules will also write to the same `employee_operations` table.

**Rationale**: Keeping the same table for both manual and auto-linked records means the financial aggregates and grouping logic require no change when production modules are built — they simply start writing rows with non-null `source_module`.

**Alternatives considered**: Separate tables for manual vs. auto (rejected — doubles query complexity for no gain).

---

## Decision 7: IPC Channel Set

Full channel listing for the feature:

| Channel | Input | Returns |
|---|---|---|
| `employees:getAll` | — | `EmployeeSummary[]` |
| `employees:getById` | `{ id }` | `EmployeeDetail` |
| `employees:create` | `CreateEmployeePayload` | `EmployeeSummary` |
| `employees:update` | `UpdateEmployeePayload` | `EmployeeSummary` |
| `employees:setStatus` | `{ id, status }` | `null` |
| `employees:addOperation` | `AddOperationPayload` | `EmployeeDetail` |
| `employees:addPayment` | `AddPaymentPayload` | `EmployeeDetail` |
| `employees:updatePayment` | `UpdatePaymentPayload` | `EmployeeDetail` |
| `employees:deletePayment` | `{ id }` | `EmployeeDetail` |

**Rationale**: Mutation channels (`addPayment`, `updatePayment`, `deletePayment`) return full `EmployeeDetail` so the hook can replace state in one step — no second fetch needed (satisfies SC-003: balance recalculates within 1 s of payment submit).
