# Research: Piece Distribution Management

**Branch**: `006-piece-distribution` | **Date**: 2026-03-15

---

## Decision 1: Tailors as a Separate Entity

**Decision**: Tailors are a new first-class entity (`tailors` table), completely independent of the `employees` table.

**Rationale**: Clarified explicitly in the spec — tailors are sewing contractors tracked differently from internal employees. They have their own balance (sewing cost owed vs payments made), which does not belong in the `employee_operations` flow. Mixing them would pollute the Employees module's earnings grouping and prevent independent financial tracking per tailor.

**Alternatives considered**: Reusing the `employees` table with a `role='خياط'` filter — rejected because tailors need a separate payment model and their balance semantics differ (debt owed TO a contractor vs earnings DUE TO an employee).

---

## Decision 2: Distribute Modal UX — Cascading Fields with Live Counter

**Decision**: The Distribute modal uses cascading form fields: tailor selector → model field (with suggestions) → size field (with suggestions) → color field → live availability counter → quantity field (max = available) → price per piece → auto-calculated total → date.

**Rationale**: The plan input description (the most detailed authoritative source) describes this cascading pattern with a live availability counter. This gives the user direct control over each dimension and shows real-time feedback, consistent with how the Cutting module handles form fields.

**Note**: An earlier spec clarification (session 2026-03-15) indicated a "list-based table" selection. The plan input supersedes this with the cascading field approach, which is simpler to implement and consistent with existing form patterns.

**Alternatives considered**: Showing a pre-built table of all (model, color, size, count) rows — superseded by plan input description.

---

## Decision 3: Piece-to-Batch Binding via Join Table

**Decision**: On distribution, specific `cutting_pieces` IDs are selected and stored in a `distribution_piece_links` join table linking `batch_id → piece_id`. On return, those exact piece IDs change status to `'returned'`.

**Rationale**: Provides exact audit trail — we know precisely which pieces were distributed to which tailor and which were returned. Prevents count drift across partial returns. Consistent with spec clarification Q2 answer.

**Alternatives considered**: Count-based tracking (batch stores quantity only, arbitrary piece statuses updated by count) — rejected because it loses individual piece identity and makes audit trails ambiguous.

---

## Decision 4: Batch Remaining Quantity — Derived from Return Records

**Decision**: The remaining distributed quantity for a batch is computed as:
`batch.quantity - SUM(return_records.quantity_returned WHERE batch_id = batch.id)`

No separate "remaining" column is stored on the batch.

**Rationale**: Avoids denormalization. The sum of return records is always authoritative. Batches are immutable after creation, so this derivation is always consistent.

**Alternatives considered**: Storing a mutable `remaining_quantity` column on the batch — rejected because it requires updating an immutable record on every return.

---

## Decision 5: No Separate Tailor Sewing Transaction Table

**Decision**: There is no separate `tailor_sewing_transactions` table. The tailor's "sewing transaction history" (shown in their detail view) is queried directly from `distribution_batches`. Balance = `SUM(distribution_batches.total_cost) - SUM(tailor_payments.amount)`.

**Rationale**: Distribution batches already contain all the information needed (tailor, amount, date, model, size, color). A separate transaction table would be a redundant copy.

**Alternatives considered**: A separate `tailor_sewing_transactions` table mirroring batch data — rejected as pure duplication.

---

## Decision 6: Return Consumption — Same Pattern as Cutting Module

**Decision**: Return consumption entries follow the exact same pattern as `cutting_consumption_entries`. On return submission, a `stock_transactions` record is inserted (`type='consumed'`, `source_module='distribution'`, `source_reference_id=return_id`).

**Rationale**: Consistency with the existing cutting module reduces implementation complexity. The same `ConsumptionRowsEditor` component pattern can be reused.

---

## Decision 7: Tailor Payments Are Editable and Deletable

**Decision**: Tailor payment records can be edited and deleted after submission (spec clarification session 2026-03-15 Q5).

**Rationale**: Payments are administrative records that may need correction. Locking them would create friction. Only distribution/return records warrant immutability.

**Alternatives considered**: Immutable payments — rejected per clarification.

---

## Decision 8: Distribution and Return Records Are Fully Immutable

**Decision**: `distribution_batches`, `return_records`, and `return_consumption_entries` are permanently read-only after submission. No update or delete IPC channels exist for these.

**Rationale**: These records affect piece status and stock levels — post-hoc mutations would create inconsistencies in the audit trail and piece lifecycle.

---

## Decision 9: IPC Namespace Split — `tailors` and `distribution`

**Decision**: Two separate IPC namespaces: `tailors:*` (8 channels) and `distribution:*` (10 channels).

**Rationale**: Clear separation of concerns. The Tailors module is independent and can be accessed without the Distribution screen. Matches the existing pattern (`employees:*`, `cutting:*`, etc.).
