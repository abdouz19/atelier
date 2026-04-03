# Feature Specification: Cutting Session Stepper Redesign & Cost Logic Fix

**Feature Branch**: `019-cutting-session-stepper`
**Created**: 2026-04-02
**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Full Session Creation with Cost Distribution (Priority: P1)

A production manager opens the new cutting session wizard and completes all four steps: selects fabric type, color, and specific purchase batches to consume; assigns multiple employees each with their own layer count and price; records produced parts with quantities; then reviews the auto-distributed cost per piece and submits.

**Why this priority**: This is the core end-to-end workflow. Every other story is a slice of it. Without this working, no session data enters the system.

**Independent Test**: Can be tested by creating one complete session from step 1 to submission and verifying all records (session, parts, batch consumptions, employee operations) appear correctly.

**Acceptance Scenarios**:

1. **Given** the user is on step 1, **When** they select a fabric type and color, **Then** a table of all available inbound batches for that fabric+color combination appears, each showing purchase date, price per meter, available quantity, and a free-entry quantity input.
2. **Given** the batch table is visible, **When** the user enters a quantity that exceeds the batch's available stock, **Then** the input is highlighted as invalid in real time and the step cannot advance.
3. **Given** valid fabric batches are selected and a model is chosen, **When** the user proceeds to step 2, **Then** only active employees are shown in a checkbox list.
4. **Given** an employee is checked on step 2, **When** they appear in the detail row below, **Then** the row shows: employee name, layers input, price-per-layer input, and a read-only total (layers × price per layer).
5. **Given** two employees are selected with different layers and prices, **When** the totals update, **Then** each employee's total is independent and the section footer shows the correct sum of all individual totals.
6. **Given** the user reaches step 4, **When** the cost distribution table loads, **Then** every part row starts with badge "تلقائي" and unit cost = total session cost ÷ total pieces (equal distribution).
7. **Given** the user manually edits one row's unit cost, **When** they commit the change, **Then** that row's badge flips to "محدد" and all "تلقائي" rows immediately recalculate proportionally to absorb the remaining cost difference.
8. **Given** all rows are locked and their totals do not sum to the session cost, **When** the user views step 4, **Then** the grand total line is shown in red and the submit button is disabled with message "مجموع تكاليف الأجزاء لا يساوي تكلفة الجلسة".
9. **Given** all rows are locked and their totals match the session cost exactly, **When** the user views step 4, **Then** the grand total is shown in green with a checkmark and the submit button is enabled.
10. **Given** the form is submitted successfully, **Then** the session record stores fabric_cost, employee_cost, materials_cost, and total_cost as separate fields; each produced part stores its unit cost; each batch consumption is recorded individually linked to its source inbound transaction; each employee's earnings are logged with their own layers × price per layer.

---

### User Story 2 — Multi-Batch Fabric Consumption with Live Cost (Priority: P1)

A cutter selects fabric from multiple purchase batches in the same session (e.g., two batches at different prices), sees the live fabric cost update as they enter quantities, and is blocked from over-consuming any single batch.

**Why this priority**: Accurate per-batch cost tracking is the foundation of the cost distribution feature. Getting batch traceability right is critical.

**Independent Test**: Can be tested by selecting two batches, entering quantities, and verifying the live fabric cost equals the sum of (qty × price) per batch, and that over-quantity entry triggers a validation error.

**Acceptance Scenarios**:

1. **Given** a fabric type and color are selected, **When** the batch table appears, **Then** each row shows: purchase date, price per meter, currently available quantity, and an empty quantity input.
2. **Given** a user enters quantities across multiple batches, **When** values are entered, **Then** the live fabric cost below the table updates instantly: sum of (meters × price per meter) per batch, plus a total meters selected.
3. **Given** a batch has 50 meters available, **When** the user types 60 in that batch's input, **Then** the field shows a real-time validation error and step advancement is blocked.
4. **Given** the user clears all batch quantity inputs back to 0, **Then** step advancement is blocked (at least one batch with quantity > 0 is required).

---

### User Story 3 — Consumed Materials with Batch-Level Cost (Priority: P2)

A supervisor wants to record non-fabric materials (e.g., thread, buttons) consumed during the session, selecting specific purchase batches for each material, and sees the materials cost included in the live session cost summary.

**Why this priority**: Consumed materials affect total session cost and therefore cost distribution. They must be captured before cost distribution is shown.

**Independent Test**: Can be tested by adding one consumed material item, selecting its batches, and verifying the total consumed materials cost appears correctly in the step 3 cost summary card and flows into step 4's session cost.

**Acceptance Scenarios**:

1. **Given** the user is on step 3 and clicks "إضافة مواد مستهلكة", **When** the section expands, **Then** a material row appears with a stock item selector (non-fabric items only) and a color variant selector (when applicable).
2. **Given** an item and color are selected for a material row, **When** the selection is made, **Then** a batch table appears below that row showing: purchase date, price per unit, available quantity, and a free quantity input.
3. **Given** quantities are entered in material batches, **Then** that item's cost (sum of qty × price per unit) and the total consumed materials cost at the section footer update live.
4. **Given** at least one material row is added, **When** the user collapses the section, **Then** a badge on the toggle shows the count of material items added.
5. **Given** consumed materials are recorded, **When** the session cost summary card at the bottom of step 3 updates, **Then** it shows fabric cost + employee cost + materials cost = total session cost, all live.

---

### User Story 4 — Step Validation Guards (Priority: P2)

The stepper enforces data completeness before allowing the user to advance to the next step, preventing incomplete or invalid sessions from being submitted.

**Why this priority**: Without step guards, users can skip required data and create corrupt session records.

**Independent Test**: Can be tested by attempting to advance at each step with missing required data and verifying the correct fields are highlighted and the Next button stays disabled.

**Acceptance Scenarios**:

1. **Given** step 1 is incomplete (no fabric, or no color, or no batch with quantity > 0, or no model), **When** the user attempts to proceed, **Then** the Next button is disabled or shows validation errors for each missing field.
2. **Given** step 2 has at least one employee checked but their layers or price per layer is missing, **When** the user attempts to proceed, **Then** advancement is blocked and the incomplete employee row is highlighted.
3. **Given** step 3 has no valid part rows (part, size, and quantity all filled), **When** the user attempts to proceed to step 4, **Then** advancement is blocked.
4. **Given** step 4 has a date not selected, **When** the user attempts to submit, **Then** submission is blocked and the date field shows a validation error.

---

### Edge Cases

- What happens when a fabric+color combination has no available inbound batches? The batch table appears empty with a message indicating no stock is available, and the user cannot proceed.
- What happens when there is only one unlocked "تلقائي" row in cost distribution? That row absorbs the full remaining cost difference regardless of the proportional calculation.
- What happens when total session cost is zero (all costs are 0)? Each part row unit cost defaults to 0 and the grand total check passes at 0 = 0.
- What happens if an employee is unchecked after having layers/price entered? Their data is discarded and no longer included in employee cost.
- What happens when a part row is removed in step 3 after cost distribution has been configured in step 4? The cost distribution table regenerates for the remaining rows with fresh auto-distribution.
- What if two part rows have the same part name and size? They are treated as separate rows; no deduplication is applied.

---

## Requirements *(mandatory)*

### Functional Requirements

**Step 1 — Fabric & Model**

- **FR-001**: Step 1 MUST present a fabric type selector and a color selector, both required before proceeding.
- **FR-002**: When a fabric type and color are both selected, the system MUST display a batch consumption table listing all available inbound purchase batches for that combination (purchase date, price per meter, available quantity, quantity input).
- **FR-003**: Each batch's quantity input MUST validate in real time against that batch's available stock; inputs exceeding available stock MUST be flagged as invalid immediately.
- **FR-004**: The step MUST display a live fabric cost summary below the batch table: total meters selected and total fabric cost (sum of meters × price per batch).
- **FR-005**: Step 1 MUST include a model selector (required). The user MUST be able to inline-add a new model name if it does not exist.
- **FR-006**: Advancing from step 1 MUST be blocked unless: fabric type is selected, color is selected, at least one batch has a quantity greater than 0, and a model is selected.

**Step 2 — Employees & Layers**

- **FR-007**: Step 2 MUST display a checkbox list of all active employees.
- **FR-008**: When an employee is checked, an individual detail row MUST appear below the checkbox list showing: employee name, layers input (number, required), price per layer input (number, required), and a read-only total (layers × price per layer).
- **FR-009**: Each employee's layers and price per layer MUST be independent — changing one employee's values MUST NOT affect any other employee's values.
- **FR-010**: The section footer MUST display the total employee cost: sum of all individual employee totals, updating live.
- **FR-011**: Advancing from step 2 MUST be blocked unless at least one employee is checked and every checked employee has both layers and price per layer filled with valid values.

**Step 3 — Produced Parts & Consumed Materials**

- **FR-012**: Step 3 MUST include a produced parts section with repeatable rows, each containing: part selector (with inline-add), size selector (with inline-add), and quantity input (number, required). At least one fully valid part row is required to advance.
- **FR-013**: Users MUST be able to add additional part rows via an "Add row" button and remove existing rows via a per-row remove button.
- **FR-014**: Step 3 MUST include a consumed materials section that is collapsed by default, toggled open by an "إضافة مواد مستهلكة" button, with a badge showing the count of added items when any exist.
- **FR-015**: Each consumed material row MUST allow selecting a non-fabric stock item and a color variant (when applicable); upon item+color selection, a batch table MUST appear below showing: purchase date, price per unit, available quantity, and a free quantity input.
- **FR-016**: The consumed materials section footer MUST display the total consumed materials cost (sum of qty × price per unit across all material batches), updating live.
- **FR-017**: A session cost summary card MUST be pinned at the bottom of step 3, displaying: fabric cost (from step 1) + employee cost (from step 2) + consumed materials cost = total session cost, all updating live as consumed materials are modified.
- **FR-018**: Advancing from step 3 MUST be blocked unless at least one part row has part, size, and quantity all filled with valid values.

**Step 4 — Cost Distribution & Notes**

- **FR-019**: Step 4 MUST display a read-only session cost summary at the top: fabric cost, employee cost, materials cost, and total session cost.
- **FR-020**: The cost distribution table MUST contain one row per produced part from step 3, each showing: part name, size, quantity, unit cost input, row total (unit cost × quantity — read-only), and a badge ("تلقائي" or "محدد").
- **FR-021**: On initial load of step 4, all unit costs MUST be set to total session cost ÷ total pieces across all rows (equal distribution), with all badges showing "تلقائي".
- **FR-022**: When the user manually edits a row's unit cost, that row's badge MUST flip to "محدد" and all "تلقائي" rows MUST immediately recalculate proportionally: remaining cost = total session cost − sum of all locked row totals, distributed by each unlocked row's quantity proportion.
- **FR-023**: When only one "تلقائي" row remains, it MUST absorb the full remaining cost difference.
- **FR-024**: When all rows are locked ("محدد") and their totals do not equal the session cost, the grand total line MUST be shown in red and the submit button MUST be disabled with the message "مجموع تكاليف الأجزاء لا يساوي تكلفة الجلسة".
- **FR-025**: When all rows are locked and their totals equal the session cost exactly, the grand total line MUST be shown in green with a checkmark and the submit button MUST be enabled.
- **FR-026**: Step 4 MUST include a notes field (optional textarea) and a date picker (required, defaulting to today's date).
- **FR-027**: The submit button MUST be labelled "إنشاء الجلسة".

**Submission & Persistence**

- **FR-028**: On submission, the system MUST record each batch consumption individually, linked to its source inbound stock transaction, with quantity and price per unit stored.
- **FR-029**: On submission, the system MUST log each selected employee's earnings as an individual record storing that employee's own layers × price per layer.
- **FR-030**: On submission, the system MUST store the unit cost from the distribution table on each produced part record.
- **FR-031**: The session record MUST store fabric_cost, employee_cost, materials_cost, and total_cost as separate numeric fields.
- **FR-032**: All monetary values MUST be stored with 2 decimal precision.
- **FR-033**: Cutting sessions MUST never be hard-deleted; any deletion mechanism (if present) MUST use soft-delete only.

### Key Entities

- **Cutting Session**: Represents one fabric cutting event. Has fabric type, color, model, date, notes, and four cost fields (fabric, employee, materials, total). Links to employees, produced parts, and batch consumptions.
- **Fabric Batch Consumption**: One record per inbound purchase batch consumed during a session (fabric or material). Stores quantity taken and the price per unit at time of consumption for cost auditability.
- **Employee Session Entry**: One record per employee per session, storing their individual layers, price per layer, and computed earnings for that session.
- **Produced Part**: One record per part row in step 3. Stores part name, size, quantity, and the unit cost assigned during cost distribution.
- **Consumed Material Item**: Groups batch consumptions for a single non-fabric stock item within a session; has a computed total cost.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with all required data pre-existing can complete a new cutting session in under 5 minutes from opening the wizard to submission.
- **SC-002**: All four step-validation guards prevent advancement with missing or invalid data 100% of the time — no session can be saved with incomplete required fields.
- **SC-003**: The cost distribution table reflects any unit cost change within 200 milliseconds, with all "تلقائي" rows updating without a manual refresh.
- **SC-004**: The submitted session's stored total_cost equals the sum of fabric_cost + employee_cost + materials_cost to 2 decimal places in 100% of submissions.
- **SC-005**: Batch-level consumption records allow full cost traceability: given any submitted session, the source inbound transaction for every consumed meter/unit can be identified.
- **SC-006**: The cost distribution validation prevents submission when locked row totals differ from session cost, with zero false positives (valid matching totals never blocked).

---

## Assumptions

- Active employees are those whose status in the employees table is marked active; the system does not need to define "active" as part of this feature.
- "Inline-add" for models, parts, and sizes follows the existing combobox pattern already present in the codebase — no new mechanism is needed.
- Color variant selection for consumed materials follows the same pattern as the fabric color selector in step 1.
- A fabric batch's "available quantity" is derived from the existing stock transaction balance (original quantity minus prior consumptions), consistent with the existing IPC interface.
- The equal distribution formula for step 4 initial load uses rounding where needed, assigning any remainder to the last row, consistent with current behavior.
- Proportional redistribution among "تلقائي" rows uses each row's share of total unlocked quantity as the weight.
- The date picker defaults to the device's current local date.
- There is no multi-currency support; all values are in the single operating currency.
