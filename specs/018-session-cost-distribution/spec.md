# Feature Specification: Session Cost Calculation & Part Cost Distribution

**Feature Branch**: `018-session-cost-distribution`
**Created**: 2026-04-01
**Status**: Draft
**Input**: User description: "Session Cost Calculation & Part Cost Distribution"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fabric Batch Selection in Step 1 (Priority: P1)

When creating a cutting session, after selecting a fabric and color, the user is presented with a list of all purchase batches for that fabric+color. Each batch shows its purchase date, price per meter, and remaining available quantity. The user selects one or more batches and enters how many meters to draw from each. The system validates that the entered meters do not exceed each batch's available quantity and computes the fabric cost live as the user types.

**Why this priority**: This is the foundational input change — without batch-level fabric selection, no cost can be computed accurately. All other cost features depend on this being correct.

**Independent Test**: Can be fully tested by selecting a fabric+color in step 1, choosing batches, entering quantities, and verifying the live fabric cost matches the sum of (meters × price) per batch, with validation blocking overdraws.

**Acceptance Scenarios**:

1. **Given** a fabric+color with two purchase batches (50m @ 120 DZD, 30m @ 140 DZD), **When** the user selects both and enters 20m and 10m respectively, **Then** the live fabric cost displays 20×120 + 10×140 = 3,800 DZD.
2. **Given** a batch with 30m available, **When** the user enters 35m for that batch, **Then** an inline validation error appears and submission is blocked.
3. **Given** a fabric+color has only one purchase batch, **When** the user opens the batch selector, **Then** only that one batch is listed with its date, price, and available quantity.
4. **Given** a batch with 0m available, **When** the batch selector opens, **Then** that batch is shown as exhausted and cannot be selected.

---

### User Story 2 - Consumed Materials Batch Selection in Step 2 (Priority: P2)

When the user reaches step 2 (consumed materials), each non-fabric stock item displays its available purchase batches the same way as fabric: purchase date, price per unit, and available quantity. The user selects batches and enters quantities freely. The materials cost updates live and each batch consumption is linked to its specific purchase record for full traceability.

**Why this priority**: Mirrors the fabric batch pattern but for auxiliary materials. Required for complete cost tracking, but the session can still be partially functional with fabric cost alone.

**Independent Test**: Can be tested by adding a consumed material in step 2, selecting multiple batches, entering quantities, and verifying the live materials cost and that consumption records reference the correct purchase batches.

**Acceptance Scenarios**:

1. **Given** a consumed material (e.g., thread) with two batches (100 units @ 5 DZD, 50 units @ 6 DZD), **When** the user selects both and enters 40 and 20 units, **Then** the live materials cost shows 40×5 + 20×6 = 320 DZD.
2. **Given** the user enters a quantity exceeding a batch's available stock, **Then** an inline error appears and submission is blocked for that row.
3. **Given** the session is submitted, **When** the system saves consumption records, **Then** each consumption record references the specific purchase batch it was drawn from.

---

### User Story 3 - Live Session Cost Display (Priority: P2)

Throughout steps 1 and 2, a running total of the full session cost is displayed and updates in real time. It breaks down as fabric cost + employee cost + consumed materials cost. Employee cost is derived from: number of layers × price per layer × number of selected employees.

**Why this priority**: Provides immediate financial feedback to the operator, enabling data-driven decisions before committing. Depends on P1 batch selection being in place.

**Independent Test**: Can be tested by filling step 1 and step 2 values and verifying that the displayed session cost matches the formula at every input change.

**Acceptance Scenarios**:

1. **Given** fabric cost = 3,800 DZD, employee cost = 5 layers × 200 DZD × 2 employees = 2,000 DZD, materials cost = 320 DZD, **When** all values are entered, **Then** the total session cost displayed is 6,120 DZD.
2. **Given** the user changes a batch quantity in step 1, **When** the value updates, **Then** the total session cost recalculates immediately without requiring any button press.
3. **Given** no batches are selected yet, **Then** the fabric cost contribution shows 0.00 and the total reflects only employee and materials costs.

---

### User Story 4 - Part Cost Distribution in Step 2 (Priority: P3)

After the user fills all produced parts rows (part name, size, quantity), a cost distribution table appears below. Each row shows the part name, size, quantity, an editable unit cost, and a read-only row total (unit cost × quantity). The grand total always equals the session cost. Parts are auto-distributed by default and auto-adjust when one part's cost is changed. Manually edited parts lock and never auto-adjust.

**Why this priority**: Delivers the cost-per-piece traceability needed for downstream pricing and reporting. Depends on the session cost being computed first (P1, P2).

**Independent Test**: Can be tested by completing all parts rows and verifying that default unit costs produce a grand total equal to session cost, that editing one part's cost locks it and adjusts the others proportionally, and that all-locked scenarios with a mismatch block submission.

**Acceptance Scenarios**:

1. **Given** session cost = 6,120 DZD and three part rows totaling 30 pieces, **When** the distribution table appears, **Then** each row defaults to unit cost = 6,120 ÷ 30 = 204 DZD and all row totals sum to 6,120 DZD.
2. **Given** two auto parts and one locked part, **When** the locked part's unit cost is edited, **Then** the two auto parts' unit costs adjust proportionally so the grand total remains equal to session cost.
3. **Given** all parts are locked and their row totals sum to 5,000 DZD while session cost is 6,120 DZD, **Then** an error message is shown and submission is blocked.
4. **Given** the session is submitted successfully, **Then** each produced piece record stores the unit cost from its part row, rounded to 2 decimal places.

---

### Edge Cases

- What happens when a fabric+color has no purchase batches? The batch selector shows an empty state; the user cannot proceed past step 1 without at least one valid batch selection.
- What happens when the total pieces count across all part rows is 0? Default unit costs cannot be computed; the system shows 0.00 and the user must enter unit costs manually or add parts.
- What happens when rounding of `total ÷ pieces` creates fractions that don't perfectly sum to session cost? The last auto row absorbs the remainder to keep the grand total exact.
- What happens if all part rows are locked and their totals happen to equal session cost exactly? Submission proceeds normally — the error only triggers on a mismatch.
- What happens if session cost is 0 (no fabric, no employees, no materials)? All unit costs default to 0.00 and the grand total is 0 — valid and submittable.

## Requirements *(mandatory)*

### Functional Requirements

**Fabric batch selection (Step 1):**

- **FR-001**: When a fabric+color is selected in step 1, the system MUST display all inbound purchase batches for that fabric+color, showing purchase date, price per meter, and available quantity per batch.
- **FR-002**: Available quantity per batch MUST be computed as: original inbound quantity minus the sum of all previously recorded consumptions linked to that batch.
- **FR-003**: The user MUST be able to select one or more batches and freely enter a meters quantity for each selected batch.
- **FR-004**: The system MUST validate that the entered meters per batch do not exceed that batch's available quantity, and MUST block progression on violation.
- **FR-005**: Fabric cost MUST be computed live as the sum of (meters entered × price per meter) across all selected batches, updating on every input change.

**Consumed materials batch selection (Step 2):**

- **FR-006**: Each non-fabric consumed material in step 2 MUST display all available purchase batches for that item, showing purchase date, price per unit, and available quantity.
- **FR-007**: The user MUST be able to select one or more batches per material and enter a quantity for each, validated against each batch's available quantity.
- **FR-008**: Consumed materials cost MUST be computed live as the sum of (quantity × price per unit) across all selected batches for all materials.
- **FR-009**: On session submission, each batch-level quantity entered MUST be saved as a consumption record linked to the specific purchase batch.

**Session cost computation:**

- **FR-010**: Total session cost MUST equal: fabric cost + employee cost + consumed materials cost.
- **FR-011**: Employee cost MUST equal: number of layers × price per layer × number of selected employees.
- **FR-012**: The total session cost MUST be displayed live throughout steps 1 and 2, recalculating on every relevant input change.
- **FR-013**: On submission, the system MUST persist total session cost, fabric cost, employee cost, and consumed materials cost as separate fields on the cutting session record.

**Part cost distribution (Step 2):**

- **FR-014**: After all produced parts rows are filled, the system MUST display a cost distribution table with one row per part, showing: part name, size, quantity, editable unit cost, and read-only row total (unit cost × quantity).
- **FR-015**: The default unit cost per part row MUST be: total session cost ÷ total pieces across all part rows (equal distribution).
- **FR-016**: The grand total of all row totals MUST always equal the total session cost; the system MUST enforce this invariant at all times.
- **FR-017**: Each part row MUST be flagged as either "auto" (not manually edited) or "locked" (manually edited).
- **FR-018**: When a locked part's unit cost is edited, the remaining auto parts MUST adjust their unit costs proportionally to keep the grand total equal to session cost.
- **FR-019**: Locked parts MUST NOT be auto-adjusted when other parts change.
- **FR-020**: If all parts are locked and their grand total does not equal session cost, the system MUST display an error and block submission.
- **FR-021**: On submission, each produced piece record MUST store the unit cost inherited from its part row with 2 decimal precision.
- **FR-022**: All cost values (session cost, fabric cost, employee cost, materials cost, unit costs, row totals) MUST be stored and displayed with 2 decimal precision.

### Key Entities

- **Purchase Batch (Inbound Transaction)**: An individual inbound stock transaction for a specific item. Key attributes: item reference, purchase date, original quantity, price per unit/meter.
- **Batch Consumption Record**: Links a consumed quantity to a specific purchase batch and a cutting session. Key attributes: batch reference, quantity consumed, session reference.
- **Cutting Session**: The top-level record for a cutting run. Extended with: total cost, fabric cost, employee cost, consumed materials cost (all in DZD, 2 decimal precision).
- **Produced Piece**: A piece record for each part+size row in the session. Extended with: unit cost (2 decimal precision).
- **Cost Distribution Row**: UI-level row per part, tracking: part name, size, quantity, unit cost, lock status (auto/locked), row total. Not persisted directly — results flow into produced piece records on submission.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can select fabric batches and see the live fabric cost update within 1 second of each quantity input, without a page reload.
- **SC-002**: Batch available quantities are always enforced — no session can be submitted with any batch overdraw.
- **SC-003**: The part cost distribution grand total equals session cost exactly at all times; submission with a locked-only mismatch is always blocked by an error.
- **SC-004**: After session submission, 100% of produced piece records carry a unit cost traceable to the cost distribution table, and 100% of batch consumptions reference their originating purchase batch.
- **SC-005**: The live session cost display reflects current inputs within 1 second of any change across steps 1 and 2.
- **SC-006**: All monetary values stored are accurate to 2 decimal places with no silent rounding errors.

## Assumptions

- Price per layer (used in employee cost) is already a collected field in the existing cutting session flow; this feature reads but does not change how it is gathered.
- Number of selected employees is already determined in the existing step 1 employee selection; this feature reads that value to compute employee cost.
- Inbound purchase transactions already exist in the database, are associated with a specific stock item, and carry a price-per-unit/meter field; this feature reads but does not modify those records.
- A "purchase batch" maps to a single inbound stock transaction record in the existing database.
- The lock/auto flag on cost distribution rows is UI-only state and does not need to be persisted after submission.
- Rounding strategy: the last auto row in the list absorbs any remainder to keep the grand total exactly equal to session cost.
- This feature modifies the existing cutting session creation wizard (steps 1 and 2) rather than introducing a new standalone flow.
