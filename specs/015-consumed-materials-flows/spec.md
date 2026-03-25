# Feature Specification: Cutting, Distribution, QC & Finition Flow Finalization

**Feature Branch**: `015-consumed-materials-flows`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Cutting, Distribution, QC & Finition Flow Finalization — consumed materials sections across all production modals, revised cutting step forms"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record a Cutting Session with Full Details (Priority: P1)

A production manager opens the New Cutting Session modal. In Step 1, they select a fabric type from stock (or create a new one inline), choose a color (or add new), select a model (or add new), enter the meters used — with real-time validation against available stock for that fabric+color — select the employees via checkboxes, enter layers count, price per layer, date, and optional notes. In Step 2, they define produced parts rows (part, size, quantity), add/remove rows freely, and optionally expand the consumed materials section to record non-fabric accessories used, with each quantity validated against stock. On submission, all consumed material stock deductions happen atomically and the session is saved.

**Why this priority**: The cutting session form is the primary data-entry point for the entire production workflow. Without accurate Step 1 and Step 2 data, all downstream flows (distribution, QC, finition) cannot function correctly.

**Independent Test**: Can be fully tested by creating a new cutting session end-to-end, verifying stock validation on meters used, adding part rows, adding consumed materials with one valid and one over-stock row, and confirming that only the over-stock case blocks submission.

**Acceptance Scenarios**:

1. **Given** a fabric+color combination with 50 meters in stock, **When** a user enters 60 in the meters used field, **Then** the field is flagged invalid in real time and the form cannot be submitted.
2. **Given** a fabric+color combination with 50 meters in stock, **When** a user enters 40 meters, **Then** no validation error is shown and the user can proceed to Step 2.
3. **Given** the user is on Step 1 and the desired fabric is not in the list, **When** the user chooses to create it inline, **Then** the new fabric is saved globally and selected without leaving the modal.
4. **Given** the user is on Step 2, **When** they click "إضافة جزء", **Then** a new row with Part, Size, and Quantity fields is appended to the produced parts list.
5. **Given** the user has added multiple part rows, **When** they click the remove button on one row, **Then** that row is deleted and the rest remain unaffected.
6. **Given** the consumed materials section is collapsed, **When** the user expands it and selects a non-fabric stock item, then enters a quantity exceeding available stock, **Then** the row is flagged and submission is blocked.
7. **Given** all fields are valid, **When** the user submits, **Then** all consumed material quantities are atomically deducted from stock and a consumption transaction is logged per item, each linked to this cutting session.

---

### User Story 2 - Record Consumed Materials During Distribution (Priority: P2)

A distribution manager opens the Distribute modal, fills in the existing fields for pieces handed to a tailor, and optionally expands the consumed materials section to record non-fabric items used during distribution handoff. Each item's quantity is validated against stock in real time. On submission, deductions are applied atomically and linked to the distribution record.

**Why this priority**: Distribution is the next step after cutting; logging accessories consumed during handoff improves inventory accuracy and full traceability.

**Independent Test**: Can be fully tested by distributing pieces to a tailor, expanding the consumed materials section, adding one item with valid stock and one with insufficient stock, and verifying that only the insufficient item blocks submission.

**Acceptance Scenarios**:

1. **Given** the Distribute modal is open, **When** the user does not expand the consumed materials section and submits, **Then** no consumption entries are created and submission succeeds normally.
2. **Given** the user expands the section and opens the stock item dropdown, **When** the list renders, **Then** only non-fabric items appear — fabric items must not be selectable.
3. **Given** a non-fabric item with 10 units in stock, **When** the user enters a quantity of 15, **Then** the row is flagged and submission is blocked.
4. **Given** valid consumed material entries, **When** the user submits, **Then** each item's quantity is deducted from stock and a consumption transaction is logged linked to the distribution record.

---

### User Story 3 - Record Consumed Materials During Return (Priority: P2)

A distribution manager opens the Return modal, fills in existing return fields, and optionally expands the consumed materials section to log materials used during the return operation. Quantities are validated; submission deducts atomically and logs transactions linked to the return record.

**Why this priority**: Returns may involve materials (packaging, re-labelling). Capturing this closes the stock audit trail for the return step.

**Independent Test**: Can be tested by processing a return with one consumed material entry and verifying the deduction appears in stock correctly.

**Acceptance Scenarios**:

1. **Given** the Return modal with the consumed materials section collapsed, **When** the user submits without expanding it, **Then** submission proceeds with no consumption entries created.
2. **Given** a valid consumed material row in the Return modal, **When** the user submits, **Then** the quantity is deducted from stock and a transaction is logged linked to the return record.

---

### User Story 4 - Record Consumed Materials During QC (Priority: P3)

A QC operator opens the Quality Control modal, completes existing QC fields, and optionally records materials consumed during QC (labels, tags, thread). Quantities validated in real time; deductions applied atomically on submission.

**Why this priority**: QC material consumption is less frequent but important for complete inventory accuracy.

**Independent Test**: Can be tested by submitting a QC entry with one consumed material item and verifying the stock decrement.

**Acceptance Scenarios**:

1. **Given** the QC modal with the consumed materials section collapsed, **When** the user submits, **Then** no consumption entries are created.
2. **Given** a valid non-fabric item selected with an in-stock quantity, **When** the user submits, **Then** the stock is decremented and a transaction is logged linked to the QC record.

---

### User Story 5 - Record Consumed Materials During Finition (Priority: P3)

A finition operator opens the Finition modal, completes existing fields, and optionally records materials consumed (buttons, zippers, packaging). Quantities validated; submission deducts atomically and links transactions to the finition record.

**Why this priority**: Finition is the last production stage; capturing accessory consumption here closes the full material tracking loop.

**Independent Test**: Can be tested by submitting a finition entry with consumed materials and verifying stock reflects the deduction.

**Acceptance Scenarios**:

1. **Given** the Finition modal with consumed materials section collapsed, **When** the user submits without adding any entries, **Then** no consumption entries are created.
2. **Given** a valid consumed material row, **When** the user submits, **Then** the quantity is deducted from stock and a transaction is logged linked to the finition record.

---

### Edge Cases

- What happens when a stock item's available quantity is exactly 0 at submission time (depleted by a concurrent action)? — The system must detect the insufficient stock at save time and reject the submission with an error.
- What happens when a user adds a consumed material row but leaves the item or quantity blank? — Blank rows must be validated before submission; they must not create zero-quantity deductions.
- What happens if a user opens a modal and stock changes (another operation deducts the same item) before this user submits? — The submission must re-validate stock at the moment of save and reject if now insufficient.
- What happens when an inline-created fabric, color, model, part, or size name duplicates an existing one? — The system must prevent the duplicate and show a clear error.
- What happens when Step 2 has zero produced part rows? — Submission must be blocked; at least one produced part row is required.
- What happens when a consumed material color variant is left blank for an item that has color variants? — The system should allow blank (treat as "any variant") or require selection; default assumption: color variant is optional and blank is accepted.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Cutting — Step 1

- **FR-001**: The system MUST allow users to select a fabric from the stock list (fabric-type items only) or create a new fabric entry inline without leaving the modal.
- **FR-002**: The system MUST allow users to select a color from the managed colors list or create a new color inline.
- **FR-003**: The system MUST allow users to select a model from the managed models list or create a new model inline.
- **FR-004**: The system MUST validate the "meters used" value in real time against the available stock for the selected fabric+color combination and prevent submission if the value exceeds available stock.
- **FR-005**: The system MUST display the available stock quantity for the selected fabric+color combination so the user can enter an informed value.
- **FR-006**: The system MUST present a checkbox list of all active employees allowing multiple simultaneous selection.
- **FR-007**: The system MUST accept a "number of layers" numeric input.
- **FR-008**: The system MUST accept a "price per layer" numeric input.
- **FR-009**: The system MUST accept a date via a date picker, defaulting to today's date.
- **FR-010**: The system MUST accept an optional additional notes field.

#### Cutting — Step 2

- **FR-011**: The system MUST present a produced parts section with at least one row. Each row contains: Part (select or add new inline), Size (select or add new inline), Quantity (number input).
- **FR-012**: The system MUST allow users to add additional part rows via an "إضافة جزء" button.
- **FR-013**: The system MUST allow users to remove any individual part row; a minimum of one row must remain.
- **FR-014**: The system MUST block submission if the produced parts section contains no rows.
- **FR-015**: The system MUST present a "مواد مستهلكة" (consumed materials) section, collapsed by default and expandable on demand.
- **FR-016**: Each consumed material row MUST contain: a non-fabric stock item selector, an optional color variant selector, and a quantity input.
- **FR-017**: The system MUST allow users to add additional consumed material rows via an "إضافة مادة مستهلكة" button.
- **FR-018**: The system MUST validate each consumed material quantity in real time against available stock and flag any row that exceeds it.
- **FR-019**: On submission, the system MUST atomically deduct all consumed material quantities from stock and log each deduction as a consumption transaction linked to the cutting session.

#### Distribution — Distribute Modal

- **FR-020**: The Distribute modal MUST include a consumed materials section following the same rules as FR-015 through FR-019, with consumption transactions linked to the distribution record.

#### Distribution — Return Modal

- **FR-021**: The Return modal MUST include a consumed materials section following the same rules, with consumption transactions linked to the return record.

#### Quality Control Modal

- **FR-022**: The QC modal MUST include a consumed materials section following the same rules, with consumption transactions linked to the QC record.

#### Finition Modal

- **FR-023**: The Finition modal MUST include a consumed materials section following the same rules, with consumption transactions linked to the finition record.

#### Universal Consumed Materials Behavior

- **FR-024**: Consumed materials sections MUST be collapsed by default across all modals.
- **FR-025**: Only non-fabric stock items MUST appear in the stock item selector within consumed materials sections.
- **FR-026**: The system MUST block form submission if any consumed material row has a quantity exceeding available stock.
- **FR-027**: Each stock deduction MUST be recorded as a consumption transaction that captures the source operation type and its record identifier.
- **FR-028**: All stock deductions from a single submission MUST be applied atomically — either all succeed or none are applied.

### Key Entities

- **Cutting Session**: A single fabric-cutting event. Key attributes: fabric, color, model, meters used, employees, layers, price per layer, date, notes, produced parts list, consumed materials list.
- **Produced Part Row**: A line item within a cutting session. Key attributes: part name, size, quantity generated.
- **Consumed Material Entry**: A record of a non-fabric stock item deducted during an operation. Key attributes: stock item, color variant (optional), quantity, source operation type, source operation ID.
- **Stock Item**: An inventory item. Key attributes: name, type (fabric vs. non-fabric), color variants, available quantity.
- **Distribution Record**: Pieces handed to a tailor. Extended in this feature with consumed material entries.
- **Return Record**: Pieces returned from a tailor. Extended in this feature with consumed material entries.
- **QC Record**: A quality control check. Extended in this feature with consumed material entries.
- **Finition Record**: A finishing operation. Extended in this feature with consumed material entries.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a full cutting session entry (Step 1 + Step 2 with at least one part row and one consumed material) in under 3 minutes.
- **SC-002**: Stock validation feedback for meters used and consumed material quantities appears within 1 second of any value change.
- **SC-003**: 100% of submissions containing any quantity that exceeds available stock are blocked before any data is persisted.
- **SC-004**: After every valid submission, all affected stock quantities are updated with zero discrepancy between logged consumption and actual stock change.
- **SC-005**: Users can create new fabric, color, model, part, or size entries inline from within any modal without navigating away.
- **SC-006**: Consumed materials sections across all five modals are collapsed by default and do not add friction for users who do not use them.
- **SC-007**: Every consumption transaction record is traceable to its exact source operation (type + ID) with no orphaned entries.

---

## Assumptions

- Fabric items are distinguishable from non-fabric items by a type/category field already present in the stock system.
- Color variants for consumed non-fabric items are optional; not all stock items have color variants.
- Inline creation of fabric, color, model, part, and size produces a globally reusable record, not a session-local one.
- Existing fields in the Distribute, Return, QC, and Finition modals are unchanged; this feature only adds the consumed materials section to each.
- At least one produced part row is required to submit a cutting session.
- The "price per layer" field and any employee cost display in Step 1 are informational only and do not affect stock deductions.
- Atomic deduction means all consumed items are deducted together in a single operation — partial deductions must never occur.
- All users accessing these modals share the same permission level; no role-based access changes are in scope.
