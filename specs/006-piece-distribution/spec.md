# Feature Specification: Piece Distribution Management

**Feature Branch**: `006-piece-distribution`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "Distribution screen with distribute and return actions for tailors"

## Clarifications

### Session 2026-03-15

- Q: How should the Distribute modal present piece availability — what is the selection flow? → A: List-based: the modal shows a table of all available (model, color, size, count) rows from existing cutting sessions and the user picks a row directly.
- Q: When distributing, should specific cutting piece IDs be bound to the distribution batch? → A: Yes — specific piece IDs are linked to the batch. On return, those exact piece records change status to "returned".
- Q: Are tailors employees, or a separate entity? → A: Tailors are a separate entity, not employees. They have their own sidebar section (similar to Suppliers and Employees) where debt and transactions are tracked.
- Q: Should tailors have an active/inactive status the user can toggle? → A: Yes — same pattern as employees: active by default, user can deactivate, inactive tailors are hidden from the Distribute modal but remain visible in the Tailors list with full history.
- Q: Should tailor payment records be editable/deletable or immutable? → A: Editable and deletable — same pattern as employee payments. Only distribution and return records are immutable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Manage Tailors (Priority: P1)

The user accesses a dedicated Tailors section from the sidebar. The screen lists all tailors with their names, current status (active/inactive), and current balance (total sewing costs owed minus payments made). The user can create a new tailor (name, phone, notes), edit their profile, toggle their active/inactive status, and record payments against them. Clicking a tailor opens their detail view: full history of all sewing transactions (from distribution events) and all payments made, with running balance.

**Why this priority**: Tailors must exist before any distribution is possible. This also delivers standalone value — the user can track how much is owed to each tailor independently of the distribution workflow.

**Independent Test**: Navigate to Tailors from the sidebar. Create a new tailor. Verify they appear in the list with zero balance. Record a payment; verify balance updates. View their detail and confirm transaction and payment history is shown.

**Acceptance Scenarios**:

1. **Given** no tailors exist, **When** the user navigates to Tailors, **Then** an empty state message is shown with a "New Tailor" button.
2. **Given** the user fills in a tailor name and submits, **When** the tailor is created, **Then** they appear in the list with a zero balance.
3. **Given** a tailor exists, **When** the user opens their detail view, **Then** their sewing transaction history and payment history are shown with a running balance.
4. **Given** a tailor has a balance due, **When** the user records a payment, **Then** the tailor's balance decreases by the payment amount immediately.
5. **Given** a tailor exists, **When** the user edits their name or notes and saves, **Then** the updated details are reflected in the list and detail view.

---

### User Story 2 — View Distribution Overview (Priority: P2)

The user opens the Distribution screen from the sidebar and sees the current state of all piece distributions at a glance. KPI cards show aggregated totals: pieces in distribution, pieces returned, pieces not yet returned, number of tailors with active distributions, total sewing cost, and total unsettled sewing cost. Below the KPIs a per-tailor summary table lists every tailor who has received pieces, with their individual piece counts and financial balance. Clicking a tailor row opens a read-only detail view of all their distribution batches and returns.

**Why this priority**: Provides full visibility into where pieces are and what is owed. Depends on tailors existing (Story 1) but delivers the core read-only screen as an MVP before actions are available.

**Independent Test**: Navigate to Distribution from the sidebar with no data. Verify all 6 KPI cards show zero and the table shows an empty state. After creating distributions via Story 3, verify KPIs and table rows update correctly.

**Acceptance Scenarios**:

1. **Given** no distributions exist, **When** the user navigates to Distribution, **Then** all 6 KPI cards display zero and the table shows an empty state.
2. **Given** distributions exist, **When** the user views the Distribution screen, **Then** each tailor row shows name, pieces in distribution, pieces returned, pieces not returned, total sewing cost, settled amount, and remaining balance.
3. **Given** a tailor has distribution history, **When** the user clicks their row, **Then** a detail view opens showing all batches and returns with date, model, size, color, quantity, and cost.
4. **Given** the distribution detail view is open, **When** the user inspects it, **Then** no edit or delete controls are visible.

---

### User Story 3 — Distribute Pieces to a Tailor (Priority: P3)

The user distributes cut pieces to a tailor for sewing. They open the Distribute modal, select a tailor from the Tailors list, then see a table of all available (model, color, size, count) rows from existing cutting sessions. They select one row, enter the quantity (limited to available not-distributed pieces for that row), set the sewing price per piece and the date. Total sewing cost is auto-calculated. On submission the selected piece IDs change status to "distributed", a sewing transaction is recorded against the tailor, and their balance increases accordingly.

**Why this priority**: Core data entry — without distributions there is nothing to track or return.

**Independent Test**: With at least one tailor and at least one not-distributed piece, open the Distribute modal. Select a tailor, select an available row, enter quantity and price, submit. Verify piece count decreases, the tailor appears in the Distribution summary, and their balance on the Tailors screen increases.

**Acceptance Scenarios**:

1. **Given** not-distributed pieces exist, **When** the user opens Distribute, **Then** a table of available (model, color, size, count) rows is shown; selecting a row populates the quantity maximum.
2. **Given** the user enters a quantity exceeding available pieces, **When** they attempt to submit, **Then** a validation error is shown and submission is blocked.
3. **Given** all fields are valid, **When** the user submits, **Then** the modal closes, a success toast appears, the tailor row updates in the Distribution table, and the tailor's balance on the Tailors screen increases by the sewing cost.
4. **Given** a distribution was submitted, **When** the user opens Distribute again, **Then** the distributed pieces no longer appear in the available rows table.

---

### User Story 4 — Return Pieces from a Tailor (Priority: P4)

The user records the return of sewn pieces from a tailor. They open the Return modal, select a tailor, and see all their currently distributed (not fully returned) batches. They select one batch, enter the return quantity (partial returns allowed), and optionally record non-fabric stock consumption entries. On submission the returned piece IDs change status to "returned" and any stock consumption is deducted.

**Why this priority**: Completes the distribution lifecycle. Partial returns and stock consumption make this the most complex action — delivered last.

**Independent Test**: With at least one active distribution batch, open Return. Select tailor, select batch, enter partial quantity, add a stock entry, submit. Verify returned count increases, batch still shows remaining pieces, and stock quantities decrease on the Stock screen.

**Acceptance Scenarios**:

1. **Given** a tailor has distributed batches, **When** the user opens Return and selects that tailor, **Then** all their not-fully-returned batches are shown with model, size, color, distributed quantity, and date.
2. **Given** a batch with 20 distributed pieces, **When** the user enters return quantity 12 and submits, **Then** 12 pieces become "returned", 8 remain "distributed", and the batch still appears with quantity 8.
3. **Given** the user enters a return quantity exceeding the distributed quantity, **When** they attempt to submit, **Then** a validation error blocks submission.
4. **Given** a stock consumption entry quantity exceeds available stock, **When** the user attempts to submit, **Then** a validation error is shown on that field.
5. **Given** a valid return with stock consumption is submitted, **When** the user navigates to Stock, **Then** the consumed item's quantity has decreased by the entered amount.

---

### User Story 5 — Record Immutability (Priority: P5)

All distribution and return records are permanently read-only after submission. No edit or delete controls exist anywhere on distribution batches or return records.

**Why this priority**: Protects financial integrity and provides a reliable audit trail.

**Independent Test**: Open any tailor distribution detail. Confirm no edit or delete controls exist on any batch or return row.

**Acceptance Scenarios**:

1. **Given** any submitted distribution batch, **When** the user inspects it, **Then** no edit or delete control is present.
2. **Given** any submitted return record, **When** the user inspects it, **Then** no edit or delete control is present.

---

### Edge Cases

- What happens when all pieces for a model+size+color are distributed and a user tries to distribute more? → That row no longer appears in the available rows table (count = 0 rows are hidden).
- What happens when a tailor is deactivated? → Their existing distribution history and batches remain fully visible and returnable; they no longer appear in the tailor selector for new distributions. Their status is shown as inactive in the Tailors list.
- What happens when a partial return reduces a batch to 0 remaining? → The batch no longer appears in the distributed batches list for future returns.
- What happens when a stock consumption entry references an item with 0 available? → Validation blocks submission and shows an error on that entry.
- What happens when a tailor has no active distributions but past return history? → They still appear in the Distribution summary table with their historical totals.
- What happens when a new tailor is created with no distributions yet? → They appear in the Tailors list with zero balance but do not appear in the Distribution summary table.

## Requirements *(mandatory)*

### Functional Requirements

**Tailors module:**

- **FR-001**: System MUST provide a Tailors screen accessible from the main sidebar navigation.
- **FR-002**: The Tailors screen MUST list all tailors with their name and current balance (total sewing cost owed minus total payments made).
- **FR-003**: System MUST allow creating a new tailor with name (required), phone (optional), and notes (optional). New tailors default to active status.
- **FR-004**: System MUST allow editing a tailor's name, phone, and notes.
- **FR-004b**: System MUST allow toggling a tailor's status between active and inactive. Inactive tailors are excluded from the Distribute modal tailor selector but remain fully visible in the Tailors list with their complete history.
- **FR-005**: System MUST allow recording a payment against a tailor (amount, date, optional notes), which reduces their balance.
- **FR-005b**: System MUST allow editing and deleting tailor payment records after submission (for error correction).
- **FR-006**: Clicking a tailor MUST open a read-only detail view showing their full sewing transaction history (from distribution events) and payment history, with a running balance.
- **FR-007**: Tailor records MUST never be hard deleted.

**Distribution screen:**

- **FR-008**: System MUST provide a Distribution screen accessible from the main sidebar navigation.
- **FR-009**: System MUST show 6 KPI cards: total pieces in distribution, total pieces returned, total pieces not yet returned, number of tailors with active distributions, total sewing cost across all distributions, and total unsettled sewing cost.
- **FR-010**: System MUST display a per-tailor summary table with: tailor name, pieces in distribution, pieces returned, pieces not returned, total sewing cost, settled amount, remaining balance.
- **FR-011**: Clicking a tailor row MUST open a read-only detail view of their full distribution and return history.
- **FR-012**: The distribution detail view MUST show each batch (date, model, size, color, quantity, sewing price, total cost) and each return (date, quantity) with no edit or delete controls.

**Distribute action:**

- **FR-013**: System MUST provide a Distribute button that opens a modal.
- **FR-014**: The Distribute modal MUST allow selecting a tailor from the active Tailors list.
- **FR-015**: The Distribute modal MUST display a table of available piece rows (model, color, size, available count) derived from not-distributed cutting pieces; rows with zero available are excluded.
- **FR-016**: The Distribute modal MUST enforce that the entered quantity does not exceed the available count for the selected row, and MUST display the available count.
- **FR-017**: The Distribute modal MUST display total sewing cost (quantity × price per piece) as a read-only auto-calculated value.
- **FR-018**: On distribution submission, System MUST atomically: bind the selected piece IDs to the batch, change their status from "not_distributed" to "distributed", and record a sewing transaction against the tailor (increasing their balance).

**Return action:**

- **FR-019**: System MUST provide a Return button that opens a modal.
- **FR-020**: The Return modal MUST require tailor selection first, then display all their not-fully-returned distribution batches.
- **FR-021**: The Return modal MUST enforce that the entered return quantity does not exceed the remaining distributed quantity for the selected batch.
- **FR-022**: System MUST support partial returns — remaining pieces stay "distributed" and the batch remains available for future returns.
- **FR-023**: The Return modal MUST allow zero or more non-fabric stock consumption entries (item, optional color, quantity validated against available stock).
- **FR-024**: On return submission, System MUST atomically: mark the returned piece IDs as "returned", record the return date, and deduct any stock consumption from available stock.

**Immutability:**

- **FR-025**: System MUST prevent editing or deleting distribution batches, return records, and tailor sewing transactions after submission. Tailor payment records are editable and deletable.
- **FR-026**: Distribution, return, and tailor records MUST never be permanently deleted.

### Key Entities

- **Tailor**: A sewing contractor — name, phone, notes, status (active/inactive). Independent of the Employees module. Defaults to active on creation.
- **Tailor Sewing Transaction**: A credit recorded against a tailor when pieces are distributed to them — links to tailor, distribution batch, amount, date.
- **Tailor Payment**: A payment made to a tailor, reducing their balance — links to tailor, amount, date, notes.
- **Distribution Batch**: A record of pieces given to a tailor — tailor, model name, size label, color, quantity, sewing price per piece, distribution date. Links to the specific `cutting_pieces` IDs distributed.
- **Distribution Piece Link**: A join record binding a specific `cutting_piece` ID to a distribution batch.
- **Return Record**: Links to a distribution batch, quantity returned, return date. Marks the exact piece IDs as "returned".
- **Return Consumption Entry**: Non-fabric stock item consumed at return time — stock item, optional color, quantity.
- **Piece**: Individual cut piece (from Cutting module) with status: not_distributed → distributed → returned.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new tailor in under 1 minute.
- **SC-002**: Users can complete a full distribute action in under 2 minutes.
- **SC-003**: Users can complete a full return action including stock consumption entries in under 3 minutes.
- **SC-004**: KPI cards, summary table, and tailor balances reflect accurate totals immediately after any action — no manual refresh required.
- **SC-005**: 100% of tailor, distribution, and return records are preserved and correctly displayed after an app restart.
- **SC-006**: Stock quantities on the Stock screen accurately reflect all return-time consumption deductions within the same session.
- **SC-007**: Tailor balance on the Tailors screen accurately reflects all sewing transactions and payments within the same session.
- **SC-008**: Partial return tracking is accurate: returned + remaining always equals the original distributed quantity for every batch.

## Assumptions

- Tailors are a new entity type separate from Employees — they have their own sidebar section, their own list, and their own transaction/payment history.
- The Employees module is NOT used to track tailor earnings or payments.
- Pieces are individual records created by the Cutting module with initial status "not_distributed". The Distribution module does not create pieces.
- Color in the available piece rows table is derived from the cutting session's fabric color (not free-text entry by the user).
- Non-fabric stock consumption in the Return modal uses the same item selector as the Cutting module — fabric-type items are excluded.
- All UI is right-to-left (Arabic).
- "Total unsettled sewing cost" KPI = total sewing cost across all distributions minus total tailor payments across all tailors.
- "Settled amount" per tailor = sum of all payments recorded against that tailor.
