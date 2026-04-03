# Feature Specification: Distribution Modal Redesign & Cost Calculation

**Feature Branch**: `020-distribution-modal-cost`
**Created**: 2026-04-03
**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Full Distribution Creation with Cost Tracking (Priority: P1)

A production manager opens the distribution modal, fills in Step 1 with all required information (tailor, model, size, color, expected final garments, sewing price, parts given with quantities), reviews the complete summary in Step 2, and confirms the distribution. All pieces are marked as distributed, all costs are stored, and tailor earnings are logged as pending.

**Why this priority**: This is the core end-to-end workflow. Without a working distribution creation with cost tracking, no downstream returns or cost analysis is possible.

**Independent Test**: Open the modal, complete both steps, submit, and verify: the distribution record appears in the tailor's history with correct cost breakdown; the distributed pieces no longer appear as available; the tailor has a pending earnings entry equal to expected_final_quantity × sewing_price_per_piece.

**Acceptance Scenarios**:

1. **Given** the user opens the distribution modal, **When** they select a tailor, **Then** the model selector becomes available.
2. **Given** a model is selected, **When** the user opens the size selector, **Then** only sizes that have not_distributed pieces for that model are shown.
3. **Given** model and size are selected, **When** the user opens the color selector, **Then** only colors that have not_distributed pieces for that model+size are shown.
4. **Given** model, size, and color are all selected, **When** the user opens the parts section, **Then** only parts that have not_distributed pieces for that model+size+color appear in the part selector.
5. **Given** a part is selected in a row, **Then** the average unit cost (average of unit_cost across all not_distributed pieces of that part+model+size+color) is shown read-only next to the quantity input, and the row total (quantity × average unit cost) is shown read-only.
6. **Given** the user enters expected final garments and sewing price per piece, **Then** the sewing cost line updates live showing: القطع المتوقعة × سعر الخياطة = إجمالي تكلفة الخياطة.
7. **Given** all required fields are valid, **When** the user clicks Next, **Then** Step 2 shows a complete read-only summary of all entered data including the full cost breakdown card.
8. **Given** the user is on Step 2, **When** they click "توزيع", **Then** the distribution is submitted and the modal closes.
9. **Given** a successful submission, **Then**: selected piece quantities change status to "distributed" and are linked to the distribution record; tailor pending earnings are logged equal to expected_final_quantity × sewing_price_per_piece; the distribution record stores pieces_cost, sewing_cost, materials_cost, total_cost, cost_per_final_item, and expected_final_quantity.

---

### User Story 2 — Average Unit Cost Display per Part (Priority: P1)

When a production manager selects a part in the الأجزاء المعطاة section, the system automatically computes and shows the average unit cost derived from all available (not_distributed) pieces of that part+model+size+color, enabling informed decisions about distribution cost.

**Why this priority**: The average unit cost is the foundation of pieces_cost and total_cost calculations. Without it, the cost tracking feature has no value.

**Independent Test**: Select a part that was produced across two cutting sessions with different unit costs. Verify the displayed average unit cost equals the mathematical average of the unit costs recorded on those not_distributed pieces.

**Acceptance Scenarios**:

1. **Given** a part is selected with not_distributed pieces at varying unit costs across sessions, **When** the row renders, **Then** the average unit cost shown equals the mean of all unit costs on those not_distributed pieces.
2. **Given** the user changes the quantity, **Then** the row total (quantity × average unit cost) updates immediately.
3. **Given** two part rows with different parts are added, **Then** the total pieces cost below the rows equals the sum of both row totals.
4. **Given** a part has no unit cost recorded on its pieces (cutting session pre-dates cost tracking), **Then** the average unit cost defaults to 0 and the row total shows 0.

---

### User Story 3 — Consumed Materials with Batch-Level Cost (Priority: P2)

A supervisor records non-fabric materials consumed during distribution (e.g., buttons, thread), selects specific purchase batches for each item, and sees the materials cost reflected live in the total distribution cost.

**Why this priority**: Materials cost is one of three cost components in the distribution total. It must be captured for accurate cost_per_final_item calculation.

**Independent Test**: Add one consumed material with two batches at different prices. Enter quantities in both batches. Verify the materials cost in the summary card equals sum(qty × price) per batch, and the total distribution cost updates accordingly.

**Acceptance Scenarios**:

1. **Given** the user expands the consumed materials section, **When** they select a non-fabric stock item and color, **Then** a batch sub-table appears showing: purchase date, price per unit, available quantity, and a quantity input per batch.
2. **Given** quantities are entered across batches, **Then** the total consumed materials cost at the section footer updates live.
3. **Given** at least one material row is added, **When** the section is collapsed, **Then** a count badge on the toggle shows the number of added items.
4. **Given** consumed materials are entered, **Then** the cost summary card updates live: تكلفة المواد and التكلفة الإجمالية للتوزيع both reflect the new values.
5. **Given** submission occurs, **Then** each batch consumption is recorded individually linked to its source inbound transaction.

---

### User Story 4 — Step 2 Review Before Confirmation (Priority: P2)

Before committing a distribution, the manager reviews a complete read-only summary of all data entered in Step 1 to catch any errors, then either confirms with "توزيع" or goes back to correct.

**Why this priority**: The review step prevents costly mistakes (wrong tailor, wrong quantity, wrong model) since distribution records are immutable after submission.

**Independent Test**: Fill Step 1 completely and advance to Step 2. Verify every field from Step 1 is accurately reflected in the summary. Click Back and modify one field, advance again, and verify the summary shows the updated value.

**Acceptance Scenarios**:

1. **Given** the user advances to Step 2, **Then** the summary shows: tailor name, model, size, color, distribution date, parts table (part, quantity, average unit cost, row total), expected final garments count, sewing price per piece, consumed materials list (if any), and the full cost breakdown card.
2. **Given** no consumed materials were added, **Then** the consumed materials section is omitted from the Step 2 summary.
3. **Given** the user clicks Back, **When** they return to Step 1, **Then** all previously entered values are preserved exactly.
4. **Given** the user is on Step 2 and clicks "توزيع", **Then** the submit button shows a loading state until the operation completes.

---

### Edge Cases

- What happens when all not_distributed pieces of a part are already selected in another row? The part should not appear as a duplicate option in additional rows, or its available quantity should be 0.
- What if the user selects a quantity greater than the available not_distributed piece count for a part? The input must validate against the available count and show an error.
- What if the average unit cost is 0 (pieces have no recorded unit cost)? The row total shows 0; submission is still allowed; no blocking validation.
- What happens when there are no not_distributed pieces for the selected model? The size selector shows empty; the user cannot proceed and sees a message indicating no available pieces.
- What if the user removes a part row that was the only valid row? The Next button becomes disabled.
- What happens if expected_final_quantity is 0? The input must require a value ≥ 1; 0 is not valid.
- What if sewing_price_per_piece is 0? This is allowed (free sewing arrangement); sewing cost becomes 0.
- What happens to the consumed materials cost if a material row is removed after batches were entered? The cost summary card recalculates immediately to reflect the removal.

---

## Requirements *(mandatory)*

### Functional Requirements

**Selectors and Cascading Filters**

- **FR-001**: Step 1 MUST present a tailor selector populated from the active tailors list (required).
- **FR-002**: Step 1 MUST present a model selector (required) that shows all models that have not_distributed pieces.
- **FR-003**: The size selector MUST be populated only with sizes that have not_distributed pieces for the selected model; it MUST be disabled until a model is selected.
- **FR-004**: The color selector MUST be populated only with colors that have not_distributed pieces for the selected model+size; it MUST be disabled until both model and size are selected.

**Sewing Cost Inputs**

- **FR-005**: Step 1 MUST include a "القطع المتوقعة النهائية" number input (integer ≥ 1, required).
- **FR-006**: Step 1 MUST include a "سعر الخياطة للقطعة" number input (decimal ≥ 0, required).
- **FR-007**: A live sewing cost line MUST display: القطع المتوقعة × سعر الخياطة = إجمالي تكلفة الخياطة, updating on every keystroke.

**Parts Given Section**

- **FR-008**: Step 1 MUST include a repeatable الأجزاء المعطاة section with at least one row required.
- **FR-009**: Each part row MUST contain: a part selector (filtered to parts with not_distributed pieces for the selected model+size+color), a quantity number input (integer ≥ 1), a read-only average unit cost field, and a read-only row total (quantity × average unit cost).
- **FR-010**: The average unit cost MUST be computed as the mean of unit_cost values across all not_distributed pieces of that part+model+size+color derived from their cutting sessions. If no unit costs exist, the average defaults to 0.
- **FR-011**: The row total MUST update immediately when the quantity changes.
- **FR-012**: A total pieces cost line MUST show the sum of all row totals, updating live.
- **FR-013**: Users MUST be able to add additional part rows and remove existing rows. At least one valid row is required to advance.
- **FR-014**: The quantity entered per row MUST be validated against the actual available not_distributed piece count for that part+model+size+color; entering more than available MUST show a validation error.

**Date**

- **FR-015**: Step 1 MUST include a date picker (required, defaulting to today's date).

**Consumed Materials**

- **FR-016**: Step 1 MUST include a consumed materials section, collapsed by default, with a count badge when items exist.
- **FR-017**: Each consumed material row MUST allow selecting a non-fabric stock item and a color variant; upon selection, a batch sub-table MUST appear with: purchase date, price per unit, available quantity, and a free quantity input per batch.
- **FR-018**: The total consumed materials cost MUST display at the section footer, updating live as batches are filled.

**Cost Summary Card**

- **FR-019**: A cost summary card MUST be visible in Step 1 (pinned above the footer), showing four lines: تكلفة الأجزاء المعطاة, تكلفة الخياطة, تكلفة المواد المستهلكة, and التكلفة الإجمالية للتوزيع, all updating live.
- **FR-020**: The Next button MUST be disabled until all required fields are valid: tailor selected, model selected, size selected, color selected, expected_final_quantity ≥ 1, sewing_price_per_piece entered, at least one part row with part selected and valid quantity, and date selected.

**Step 2 — Review**

- **FR-021**: Step 2 MUST display a complete read-only summary: tailor name, model, size, color, date, parts table (part, quantity, average unit cost, row total), expected final garments, sewing price per piece, consumed materials (if any), and the full cost breakdown card.
- **FR-022**: Step 2 MUST include a "توزيع" confirm button and a back button that returns to Step 1 with all data preserved.

**Submission & Persistence**

- **FR-023**: On submission, each part row's selected quantity of not_distributed cutting pieces MUST be updated to "distributed" status and linked to the distribution record.
- **FR-024**: The average unit cost per part row MUST be stored on the distribution record for future traceability.
- **FR-025**: The sewing cost (expected_final_quantity × sewing_price_per_piece) MUST be logged as pending earnings against the tailor, linked to the distribution record. Earnings remain pending until the return is completed.
- **FR-026**: Each consumed material batch consumption MUST be recorded individually, linked to its source inbound stock transaction.
- **FR-027**: The distribution record MUST store the following cost fields separately: pieces_cost, sewing_cost, materials_cost, total_cost, cost_per_final_item (= total_cost ÷ expected_final_quantity), and expected_final_quantity.
- **FR-028**: All monetary values MUST be stored with 2 decimal precision.
- **FR-029**: Distribution records MUST never be hard-deleted.
- **FR-030**: All distribution records MUST be read-only after submission — no editing is permitted.

### Key Entities

- **Distribution Record**: Represents one distribution event from production to a tailor. Stores tailor, model, size, color, date, all cost fields (pieces_cost, sewing_cost, materials_cost, total_cost, cost_per_final_item, expected_final_quantity), and links to part rows and consumed materials.
- **Distribution Part Row**: One entry per part given in a distribution. Stores part name, quantity distributed, and average unit cost at time of distribution.
- **Piece Link**: Associates individual cutting pieces with the distribution record, recording the status change from not_distributed to distributed.
- **Tailor Earnings Entry**: A pending earnings record for the tailor, created at distribution time. Amount = expected_final_quantity × sewing_price_per_piece. Status changes to settled when the return is completed.
- **Distribution Batch Consumption**: One record per stock batch consumed during distribution. Stores item, color, quantity, price per unit at consumption time, and link to source inbound transaction.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with all required data available (cut pieces, active tailor, stock materials) can complete a full distribution in under 4 minutes from opening the modal to confirmation.
- **SC-002**: The cost summary card in Step 1 reflects all cost changes within 200 milliseconds of any input change, with no manual refresh required.
- **SC-003**: After a successful distribution, 100% of selected piece quantities are correctly marked as distributed and no longer appear in available piece counts.
- **SC-004**: The distribution record's stored total_cost equals pieces_cost + sewing_cost + materials_cost to 2 decimal places in 100% of submissions.
- **SC-005**: The Step 2 summary accurately reflects 100% of the data entered in Step 1 — no fields are missing or misrepresented.
- **SC-006**: Tailor pending earnings are created for every distribution record submitted, with amount equal to expected_final_quantity × sewing_price_per_piece.

---

## Assumptions

- "Active tailors" in the tailor selector refers to records in the existing tailors table with active status — not the employees table. The spec description's reference to "active employees list" is interpreted as the active tailors list for distribution purposes.
- The average unit cost computation uses the `unit_cost` field on `cutting_session_parts` records. Pieces from cutting sessions that pre-date the cost tracking feature will have a null or 0 unit cost, which the average treats as 0.
- The "pending until return is completed" state for tailor earnings follows the existing earnings model — the employee_operations or tailor_payments system already tracks pending vs. settled status; this feature creates the pending record, not the settlement logic.
- Piece-level linking (not_distributed → distributed status on cutting_pieces + distribution_piece_links) is the authoritative tracking mechanism. The quantity per part row determines how many pieces of that type are marked.
- cost_per_final_item = total_cost ÷ expected_final_quantity; if expected_final_quantity is 0 (not possible given FR-005), cost_per_final_item defaults to 0.
- The consumed materials batch table uses the same existing component and IPC pattern as the cutting session's consumed materials section.
- No part can appear twice in the الأجزاء المعطاة section for the same distribution; the same part can only be added once per modal session.
