# Feature Specification: Quality Control & Finition

**Feature Branch**: `008-qc-finition`
**Created**: 2026-03-15
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Quality Control Review (Priority: P1)

A supervisor receives returned distribution batches and needs to evaluate the quality of each piece. They open a QC session for a specific return batch, record how many pieces fall into each quality grade (تالف, مقبول, جيد, جيد جداً), note the review cost, and optionally log any non-fabric materials consumed during inspection. The session is saved and the batch's unreviewed quantity decreases accordingly. Multiple QC sessions can be run against the same batch until all returned pieces are reviewed.

**Why this priority**: QC is the entry point of the post-production pipeline. Nothing can proceed to finition or final stock without passing through QC first.

**Independent Test**: Can be fully tested by creating a QC record against a return batch and verifying that grade totals, unreviewed quantity, and KPI counts update correctly.

**Acceptance Scenarios**:

1. **Given** a return batch with 20 unreviewed pieces, **When** the user creates a QC record reviewing 12 pieces (4 تالف, 5 مقبول, 3 جيد جداً), **Then** the batch shows 8 pieces still unreviewed, the QC record is saved read-only, and KPI totals reflect the new grade counts.
2. **Given** a QC record in creation mode, **When** the user enters grade quantities whose sum does not equal the reviewed quantity, **Then** the form blocks submission with a validation error.
3. **Given** a batch whose total returned quantity has been fully reviewed across multiple sessions, **When** the user opens the new QC modal, **Then** that batch no longer appears in the selectable list.
4. **Given** a submitted QC record, **When** the user attempts to modify it, **Then** all fields are read-only and no edit action is available.

---

### User Story 2 — Finition (Priority: P2)

A worker takes accepted-grade pieces (مقبول, جيد, or جيد جداً) from a QC record and performs the finition operation. They log the quantity processed, the employee responsible, the cost per piece, and optionally record stock consumption. On submission they are immediately asked whether the product is ready for final stock. If yes, they specify model, size, and color and the quantity is recorded in final stock.

**Why this priority**: Finition is the next mandatory step after QC for all accepted pieces. It must exist before custom steps can be built on top of it.

**Independent Test**: Can be fully tested by creating a finition record against a QC record, marking the product ready, and verifying the final stock entry and KPI counters update correctly.

**Acceptance Scenarios**:

1. **Given** a QC record with 8 finitionable pieces, **When** the user creates a finition record for 5 pieces and marks the product ready, **Then** 5 pieces are added to final stock, the QC record shows 3 remaining finitionable pieces, and the "ready for final stock" KPI increases by 5.
2. **Given** a QC record where all finitionable pieces have already been finitioned, **When** the user opens the new finition modal, **Then** that QC record does not appear in the selectable list.
3. **Given** a finition record in creation mode, **When** the user enters a quantity exceeding the available finitionable quantity of the selected QC record, **Then** the form blocks submission with a validation error.
4. **Given** a submitted finition record, **When** the user views it, **Then** all fields are read-only.

---

### User Story 3 — Custom Processing Steps (Priority: P3)

When a finitioned product is not yet ready for final stock, the supervisor creates custom processing steps (e.g., كي, تغليف, تعبئة) one at a time. Each step records the operation name, quantity (which can be reduced but not increased from the previous step), optional employee, optional cost, and optional stock consumption. After each step the user is asked again whether the product is ready. This loop continues until the product is declared ready, at which point the quantity is added to final stock.

**Why this priority**: Custom steps handle the variable finishing operations that some product types require. They extend the finition workflow without blocking the core QC and finition paths.

**Independent Test**: Can be fully tested by creating a finition record, choosing "not ready", completing two custom steps, then marking the second step ready and verifying the final stock entry is created.

**Acceptance Scenarios**:

1. **Given** a finition record marked "not ready", **When** the user completes a custom step with quantity 5 and marks it ready, **Then** 5 pieces are added to final stock linked to that finition record.
2. **Given** a custom step form pre-filled with quantity 10 from the finition record, **When** the user enters quantity 12, **Then** the form blocks submission because quantity cannot exceed the source quantity.
3. **Given** a custom step marked "not ready", **When** the user submits it, **Then** a new custom step form immediately appears for the same finition record.
4. **Given** a chain of custom steps for a finition record, **When** viewed in the finition table, **Then** each step is listed as its own read-only record linked to the finition entry.

---

### User Story 4 — Dashboard & KPI Overview (Priority: P4)

A manager opens the Quality Control & Finition screen and immediately sees aggregated KPIs: total pieces pending QC (unreviewed), total reviewed, breakdown by quality grade (تالف / مقبول / جيد / جيد جداً), total finition pending, and total pieces in final stock. The screen also provides tabbed navigation to the QC records table and the finition records table.

**Why this priority**: The overview provides operational visibility but does not block any core workflow. It is additive to stories 1–3.

**Independent Test**: Can be tested independently by verifying KPI counts match the underlying record data after a series of QC and finition operations.

**Acceptance Scenarios**:

1. **Given** the dashboard is open, **When** a new QC record is created with 3 تالف and 5 مقبول, **Then** the KPI for تالف increases by 3, مقبول increases by 5, and pending QC decreases by 8.
2. **Given** the dashboard is open, **When** 5 pieces are added to final stock via finition, **Then** the "ready for final stock" KPI increases by 5.

---

### Edge Cases

- What happens if the reviewed quantity across all QC sessions exceeds the batch's total returned quantity? (System must validate against remaining unreviewed quantity, not total returned.)
- What happens if the employee selected for a QC or finition record is later deactivated? (Historical records retain the reference; no retroactive change.)
- What happens if a QC record has zero finitionable pieces (e.g., all تالف)? (That record must not appear in the finition selection list.)
- Can a custom step reduce quantity to zero? (Minimum quantity is 1; zero-quantity steps must be blocked.)
- What happens when the user dismisses the "هل المنتج جاهز؟" prompt without choosing? (The record is already saved; the prompt must re-appear when the user re-opens that record.)

---

## Requirements *(mandatory)*

### Functional Requirements

**Quality Control**

- **FR-001**: The system MUST display a QC tab listing all QC records with: source return batch (tailor name, model, size, color), date, reviewing employee, grade quantities (تالف / مقبول / جيد / جيد جداً / معلق), and status.
- **FR-002**: The system MUST allow creating a new QC record via a modal that shows only return records (from the piece distribution module) with remaining unreviewed quantity.
- **FR-003**: Each return record row in the selection list MUST show: tailor name, model, size, color, and quantity available for review.
- **FR-004**: The reviewed quantity MUST NOT exceed the unreviewed quantity of the selected batch; the system MUST enforce this with a validation error.
- **FR-005**: The sum of grade quantities (تالف + مقبول + جيد + جيد جداً) MUST equal the reviewed quantity; submission MUST be blocked if the sum does not match.
- **FR-006**: Grade quantity fields MUST default to 0; معلق count for a batch is derived (total returned − sum of all reviewed quantities) and is never entered by the user.
- **FR-007**: The QC record MUST include price per piece (required) and total cost (auto-calculated, read-only).
- **FR-008**: The QC record MUST include a date field (required).
- **FR-009**: The QC record MUST support optional stock consumption entries — each row specifies a non-fabric stock item, color variant, and quantity; multiple rows are allowed.
- **FR-010**: QC records MUST be fully read-only after submission with no edit or delete action available.
- **FR-011**: A single return batch MUST support multiple QC sessions until all returned quantity is reviewed.

**Finition**

- **FR-012**: The system MUST display a Finition tab listing all finition records with: source QC record, date, employee, quantity finitioned, and status.
- **FR-013**: The system MUST allow creating a new finition record via a modal showing only QC records with remaining finitionable quantity (مقبول + جيد + جيد جداً minus already finitioned > 0).
- **FR-014**: The quantity to finition MUST NOT exceed the available finitionable quantity of the selected QC record; the system MUST enforce this.
- **FR-015**: The finition record MUST include: employee (required), price per piece (required), total cost (auto-calculated, read-only), date (required), and optional stock consumption entries.
- **FR-016**: On submission, the system MUST immediately prompt: "هل المنتج جاهز للمخزون النهائي؟"
- **FR-017**: If the user answers yes, the system MUST present a form to select model, size, and color, then add the finitioned quantity to final stock.
- **FR-018**: If the user answers no, the system MUST present the custom step creation form for that finition record.
- **FR-019**: Finition records MUST be fully read-only after submission.

**Custom Steps**

- **FR-020**: A custom step MUST capture: step name (free text, required), quantity (required, defaulting to source quantity), optional employee, optional price per piece, total cost (auto-calculated when price is entered, read-only), date (required), and optional stock consumption entries.
- **FR-021**: Custom step quantity MUST NOT exceed the quantity from the preceding record (finition or prior step); it may be reduced but not increased.
- **FR-022**: On submission, the system MUST prompt "هل المنتج جاهز للمخزون النهائي؟" with the same yes/no flow as finition.
- **FR-023**: Each custom step MUST be saved as its own record linked to its finition record; custom step records are NEVER hard-deleted.
- **FR-024**: The readiness loop MUST continue presenting new custom step forms until the user marks the product ready.

**General**

- **FR-025**: The screen MUST show KPIs: total pieces pending QC, total reviewed, total per grade (تالف / مقبول / جيد / جيد جداً), total finition pending, total pieces ready for final stock.
- **FR-026**: تالف pieces MUST be tracked in KPIs but MUST never appear in the finition selection list or proceed to custom steps.
- **FR-027**: The screen MUST be accessible from the main sidebar and use tabs to navigate between the QC and Finition sections.

### Key Entities

- **QC Record**: A single review session for a portion of a return batch. Attributes: source return batch, reviewing employee, date, quantity reviewed, grade breakdown (تالف/مقبول/جيد/جيد جداً), price per piece, total cost, stock consumption entries.
- **Finition Record**: A finition operation on accepted pieces from one QC record. Attributes: source QC record, employee, date, quantity finitioned, price per piece, total cost, stock consumption entries, readiness status.
- **Custom Step Record**: A named processing step linked to one finition record. Attributes: step name, source finition record, sequence, employee (optional), date, quantity, price per piece (optional), total cost (optional), stock consumption entries, readiness status.
- **Final Stock Entry**: An append-only record created each time a product is marked ready. Attributes: model, size, color, quantity, source record (finition or custom step), date. Total stock for a model/size/color is computed by summing all entries at query time; no aggregate row is maintained.
- **Stock Consumption Entry**: A line item recording use of a non-fabric stock item during any operation. Attributes: stock item, color variant, quantity consumed.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A supervisor can create a complete QC record (select batch, assign grades, add cost) in under 2 minutes.
- **SC-002**: The system correctly enforces grade-sum validation in 100% of submission attempts — no QC record with a mismatched sum can be saved.
- **SC-003**: KPI counts on the dashboard are always consistent with the underlying records — zero discrepancies between displayed KPIs and actual data.
- **SC-004**: A finition record with the "ready" path (no custom steps) can be completed from opening the modal to final stock entry in under 90 seconds.
- **SC-005**: The full custom step loop (finition + N steps until ready) completes within the same screen session with no page reloads required.
- **SC-006**: Zero تالف-grade pieces ever appear in the finition selection list or in final stock.

---

## Clarifications

### Session 2026-03-15

- Q: When quantity is added to final stock, does each "ready" event create a new record or increment an existing model/size/color row? → A: New append-only record per "ready" event; totals are summed at query time.
- Q: Are "returned distribution batches" in the QC modal sourced from existing feature-006 return records, or a new concept? → A: QC reads directly from existing feature-006 return_records; no new return concept needed.
- Q: What values does the "status" column show in the QC records table? → A: Batch completion status — "مكتمل" (all returned pieces reviewed) or "جزئي" (unreviewed pieces remain). [Assumed — Q3 was skipped]

---

## Assumptions

- **Employee in QC modal**: The QC creation modal includes an employee selector (required, from active employees) consistent with other modules, even though the original description did not explicitly list it as a modal field.
- **Final stock is a new entity**: "Final stock" refers to finished-goods inventory (completed garments by model/size/color) and is separate from the raw-material stock module. A new data entity is required.
- **Model and size**: When adding to final stock, "model" and "size" refer to the garment design and size label already present in the distribution system. No new master-data management for these is required within this feature.
- **معلق is derived**: The معلق count is computed as total returned quantity minus sum of all reviewed quantities across all QC sessions. It is not entered by the user.
- **Finitionable quantity**: Defined per QC record as (مقبول + جيد + جيد جداً) minus the sum of quantities already covered by existing finition records for that QC record.
- **Stock consumption items**: "Non-fabric stock items" are items from the existing stock management module (e.g., buttons, thread, packaging). Color variant selection follows the existing consumption entry pattern used in cutting and distribution modules.
- **Readiness prompt timing**: The "هل المنتج جاهز؟" prompt appears immediately after the finition or custom step record is saved, within the same modal/flow session.
