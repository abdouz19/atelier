# Feature Specification: Cutting Session Management

**Feature Branch**: `005-cutting-sessions`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "Cutting - two-step session creation modal, pieces tracking, stock deduction, employee earnings"

## Clarifications

### Session 2026-03-15

- Q: Does creating a cutting session write to the `employee_operations` table (type = "cutting") in the employees module, or to a separate cutting-specific earnings table? → A: Write to `employee_operations` (type = "cutting") — earnings appear automatically on the employee detail screen.
- Q: Can a user edit model name, date, or notes after a session is saved, or is the entire session fully immutable? → A: Entire session is fully immutable — no fields can be edited after submission.
- Q: Is updating a piece's status from "not_distributed" to "distributed" in scope for this feature, or handled by a future distribution module? → A: Future distribution module — cutting only creates pieces; status transitions are out of scope here.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Track Cutting Sessions (Priority: P1)

A production manager navigates to the Cutting section from the sidebar and sees summary KPIs at the top (total sessions, total pieces produced, pieces not yet distributed, total meters consumed, total cost paid to cutting employees) and a table of all cutting sessions below. They can click any row to view that session's full details including a pieces breakdown by size.

**Why this priority**: This is the read-only foundation. Even before any new sessions are created, this view must work correctly to display seeded or previously created sessions. It is the primary dashboard for monitoring production.

**Independent Test**: With pre-existing cutting sessions in the system, navigate to Cutting. Verify KPIs aggregate correctly. Verify the table shows all sessions with correct columns. Click a session and verify full detail view shows all step-1 fields plus a pieces-by-size breakdown.

**Acceptance Scenarios**:

1. **Given** no cutting sessions exist, **When** the Cutting screen loads, **Then** all KPIs show zero and the session table shows an empty state message.
2. **Given** multiple sessions exist, **When** the Cutting screen loads, **Then** KPIs reflect correct totals aggregated across all sessions.
3. **Given** sessions exist, **When** the user views the table, **Then** each row shows: date, fabric name + color, model name, meters used, total pieces produced, employee name(s), and total cost.
4. **Given** a session row, **When** the user clicks it, **Then** the detail view shows all session fields plus a breakdown of pieces by size (size label and count per size).

---

### User Story 2 - Create a Cutting Session (Priority: P2)

A production manager creates a new cutting session using a two-step modal. In step 1 they select a قماش-type fabric and its color variant, enter the model name, meters used, select active employees, enter layers and price per layer, set a date, and optionally add notes. In step 2 they add size rows (size + pieces count) and optionally add non-fabric stock consumption entries. On submit, all inventory deductions, piece creation, and employee earnings are recorded atomically.

**Why this priority**: This is the primary data-entry action. Without it there are no sessions to view.

**Independent Test**: Create a full cutting session (both steps). Verify fabric stock decreases by meters entered, non-fabric consumed items decrease by their quantities, the session appears in the table with correct data, all pieces appear with status "not_distributed", and each selected employee has an employee_operations record of type "cutting" with amount = layers × price per layer.

**Acceptance Scenarios**:

1. **Given** the fabric selector, **When** it is opened, **Then** only items of type "قماش" are shown; no other item types appear.
2. **Given** a fabric selected, **When** the color selector is opened, **Then** only color variants with available stock for that fabric are shown.
3. **Given** meters entered exceeds available quantity for the selected fabric+color, **When** the user attempts to proceed to step 2, **Then** a validation error is shown and navigation is blocked.
4. **Given** valid step-1 data, **When** the user proceeds to step 2, **Then** the modal advances and size rows can be added.
5. **Given** step 2 with no size rows, **When** the user attempts to submit, **Then** a validation error requires at least one size row.
6. **Given** a size row with piece count of zero, **When** the user attempts to submit, **Then** a validation error requires piece count ≥ 1.
7. **Given** a non-fabric consumption entry where quantity exceeds available stock, **When** the user submits, **Then** submission is blocked with a clear error.
8. **Given** valid step-1 and step-2 data, **When** the user submits, **Then** fabric meters are deducted, non-fabric items are deducted, individual piece records are created (one per piece) with status "not_distributed", and each selected employee receives an employee_operations record of type "cutting" with amount = layers × price per layer.
9. **Given** two employees selected, **When** the session is submitted, **Then** both employees each receive the same earnings amount (layers × price per layer) as separate employee_operations records.

---

### User Story 3 - Session Immutability and Data Integrity (Priority: P3)

After a session is saved, it is fully immutable — no fields (including model name, date, notes, deductions, or earnings) can be modified. Sessions are never deleted. Users can always view any past session but cannot change any part of it.

**Why this priority**: Immutability protects stock accuracy and employee payroll integrity. Accidental edits would corrupt historical data.

**Independent Test**: Save a session. Navigate to its detail view. Verify no edit controls exist for any field. Verify the session persists after app restart.

**Acceptance Scenarios**:

1. **Given** a saved session, **When** the user opens its detail view, **Then** all fields (model name, date, notes, meters used, consumed stock, employee earnings) are displayed as read-only — no edit action is present anywhere on the detail view.
2. **Given** any session in the list, **When** the user inspects available actions, **Then** there is no delete option.

---

### Edge Cases

- What happens when a fabric has no color variants with available stock? The user cannot select that fabric; it is either excluded from the list or shown as disabled with a tooltip explaining why.
- What happens when an active employee list is empty? The employee selector shows an empty state and the user cannot proceed past step 1 without selecting at least one employee.
- What happens when two non-fabric consumption entries reference the same item+color? Each entry is validated independently; on submit both are logged as separate consumption transactions against the same item.
- What happens when the user enters zero meters? Validation blocks submission — meters used must be greater than zero.
- What happens when price per layer is zero? Validation blocks submission — price per layer must be greater than zero (earnings must be non-zero to be meaningful).
- What happens when a session is created with a fabric that has exactly enough stock (quantity = meters entered)? Submission succeeds and the fabric+color stock reaches zero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a Cutting section accessible from the main sidebar navigation.
- **FR-002**: System MUST display KPIs at the top of the Cutting screen: (a) total number of cutting sessions, (b) total pieces produced across all sessions, (c) total pieces with status "not_distributed", (d) total meters of fabric consumed, (e) total cost paid to cutting employees.
- **FR-003**: System MUST display a table of all cutting sessions with columns: date, fabric name + color, model name, meters used, total pieces produced, employee name(s), and total cost.
- **FR-004**: System MUST allow the user to click a session row to open a detail view showing all session fields plus a pieces breakdown (size label → piece count).
- **FR-005**: System MUST provide a "New Cutting Session" action that opens a two-step modal.
- **FR-006**: In step 1, the fabric selector MUST include only stock items of type "قماش"; no other types may appear.
- **FR-007**: In step 1, once a fabric is selected, the color selector MUST show only the color variants available for that fabric that have quantity > 0.
- **FR-008**: In step 1, the model name field MUST support free-text entry and display autocomplete suggestions from model names used in previous sessions.
- **FR-009**: System MUST validate that meters entered ≤ available quantity for the selected fabric+color; submission or step-advance must be blocked with an error message if this is violated.
- **FR-010**: Meters entered must be greater than zero; a value of zero must be rejected.
- **FR-011**: In step 1, the employee multi-selector MUST show only employees with status "active". At least one employee must be selected to proceed.
- **FR-012**: Layers and price per layer must both be required numeric values greater than zero.
- **FR-013**: In step 2, the user MUST be able to add one or more size rows. Each row requires a size label (free text with autocomplete from previously used size labels) and a piece count ≥ 1. At least one row is required to submit.
- **FR-014**: In step 2, the user MAY add non-fabric stock consumption entries. Each entry requires: a stock item (type ≠ "قماش"), an optional color variant (shown only if that item has color variants), and a quantity > 0.
- **FR-015**: System MUST validate that each consumption entry's quantity ≤ available stock for that item+color. Submission must be blocked if any entry exceeds available stock.
- **FR-016**: On successful submission, the system MUST atomically perform all of the following: deduct meters used from the selected fabric+color stock (as a consumption transaction), deduct each non-fabric consumption entry's quantity from the respective item+color stock (as consumption transactions), create one piece record per piece (total = sum of all size row quantities) each with status "not_distributed" and linked to this session and its size label, and create one `employee_operations` record (type = "cutting") per selected employee with amount = layers × price per layer, referencing this cutting session as the source.
- **FR-017**: Cutting sessions MUST never be hard deleted. No delete action may appear in the UI.
- **FR-018**: Cutting sessions are fully immutable after submission. All fields — including model name, date, notes, meters used, consumed stock quantities, and employee earnings — MUST be read-only. No edit action may be exposed anywhere on the session detail view.
- **FR-019**: "قماش" items MUST appear only in fabric selectors (step 1 fabric picker). They MUST NOT appear in non-fabric consumption selectors (step 2). Non-fabric items MUST NOT appear in fabric selectors.

### Key Entities

- **CuttingSession**: A single cutting run. Attributes: date, fabric stock item, fabric color, model name, meters used, number of layers, price per layer, notes. Related to: employee_operations (many, type="cutting"), pieces (many), non-fabric consumption entries (many).
- **Piece**: An individual garment piece produced by a session. Attributes: size label, status (not_distributed / distributed). Belongs to one CuttingSession.
- **SessionConsumptionEntry**: A non-fabric stock item deducted during a session. Attributes: stock item reference, color variant (optional), quantity. Belongs to one CuttingSession.
- **EmployeeOperation** (shared with Employees module): Records earnings per employee per session. For cutting sessions: operation_type = "cutting", source_module = "cutting", source_reference_id = cutting session ID, amount = layers × price per layer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete a full two-step cutting session (including size rows and at least one consumption entry) in under 3 minutes.
- **SC-002**: After submitting a session, fabric stock and any consumed non-fabric stock quantities reflect the deductions immediately — no manual refresh required.
- **SC-003**: After submitting a session, each selected employee's earnings balance on the Employees screen reflects the new earnings immediately (via the shared employee_operations table).
- **SC-004**: KPI totals on the Cutting screen remain accurate and consistent with session data at all times — stale or incorrect aggregates must not occur.
- **SC-005**: Every piece created by a session is individually trackable by size and "not_distributed" status — 100% traceability from session to piece.
- **SC-006**: All validation errors (insufficient stock, no size rows, zero values) produce clear, actionable messages that tell the user exactly what to fix — users are never silently blocked.

## Assumptions

- Each employee selected for a session earns the same amount (layers × price per layer). There is no per-employee pricing differentiation within a single session.
- "Color variants" for stock items are already tracked in the system per Spec 2. A fabric item with no color variants cannot be selected in step 1 (edge case: shown as unavailable).
- Size labels are free text (e.g., "S", "M", "L", "38", "40") with autocomplete from previously used values across all sessions — they are not a predefined enum.
- The "total cost paid to cutting employees" KPI is the sum of all employee_operations records with type "cutting", independent of any cash payments recorded separately in the Employees module.
- Stock deductions are recorded as "outbound / consumption" transactions against the relevant stock items, consistent with how other modules log consumption.
- The session detail view shows pieces grouped by size (size label + count), not as an exhaustive list of individual piece IDs.
- Fabric type "قماش" and its locked unit "متر" are already enforced by the stock system (Spec 2); this feature relies on that constraint and does not need to re-enforce it.
- The `employee_operations` table's `source_module` and `source_reference_id` fields (already defined in the employees module schema) are used to link each operation back to its originating cutting session.
- Transitioning a piece from "not_distributed" to "distributed" is exclusively the responsibility of a future distribution module. The cutting screen has no UI for updating piece status. The KPI "pieces not yet distributed" (FR-002c) simply counts all pieces currently holding status "not_distributed" across all sessions.
