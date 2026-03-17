# Feature Specification: Models, Pieces & Platform-Wide Relational Consistency

**Feature Branch**: `009-models-parts-consistency`
**Created**: 2026-03-16
**Status**: Draft
**Input**: User description: "Models, Pieces & Platform-Wide Relational Consistency"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Managed Models, Sizes & Parts in Settings (Priority: P1)

A settings administrator manages three new lookup lists — Models, Sizes, and Parts — exactly like the existing Colors, Types, and Units lists. They can add, edit, and soft-delete entries. They can also add a new model, size, or part inline directly from any dropdown where that field appears across the app, without navigating away.

**Why this priority**: All other user stories depend on these lists existing. Without managed models/sizes/parts, no other consistency work can proceed. This is the foundational enabler.

**Independent Test**: Open Settings, add a model "حجاب", a size "S", and a part "الضهر". Verify they appear in their respective lists immediately. Open the cutting session form and confirm the new entries appear in the dropdowns without a page refresh.

**Acceptance Scenarios**:

1. **Given** the settings screen is open, **When** the user adds a new model, **Then** the model appears in the models list and immediately in every model dropdown across the app.
2. **Given** a model dropdown is open in any form, **When** the user clicks "إضافة موديل" at the bottom, **Then** an inline input appears, and on save the new model is added to the list and selected in the current field.
3. **Given** a model entry exists in settings, **When** the user edits or soft-deletes it, **Then** the change is reflected immediately in all selectors (deleted entries are hidden from new selections; historical records retain the stored value).
4. **Given** a part or size is added inline in a dropdown, **When** save is confirmed, **Then** it is immediately available in all other dropdowns of the same type without a page refresh.

---

### User Story 2 — Cutting Step 2: Structured Part + Size Rows (Priority: P2)

In the cutting session creation wizard (Step 2), the user builds a list of produced-piece rows where each row is: **Part** (select from managed parts) + **Size** (select from managed sizes) + **Quantity produced**. Multiple rows can be added for different part/size combinations. Each stored piece record carries the model (from Step 1), part, size, color (inherited from Step 1 fabric selection), and status.

**Why this priority**: This is a core data-quality improvement — replacing free-text model/size fields with structured relational data. It unlocks accurate traceability downstream in distribution, QC, and finition.

**Independent Test**: Create a cutting session for model "حجاب". In Step 2, add two rows: "الضهر / S / 30" and "الأمام / M / 20". Submit. Verify the cutting session detail shows both part/size rows and that 50 total pieces are recorded, each storing model, part, size, and color.

**Acceptance Scenarios**:

1. **Given** Step 2 of a cutting session, **When** the user adds a part+size row, **Then** the part dropdown lists all active managed parts and the size dropdown lists all active managed sizes.
2. **Given** a part not yet in the list is needed, **When** the user selects "إضافة قطعة" in the part dropdown, **Then** the new part is saved to the managed list, selected inline, and immediately available in all other part dropdowns.
3. **Given** multiple part+size rows are entered, **When** the session is submitted, **Then** each piece record stores model, part, size, color, and status, and the total quantity equals the sum of all rows.
4. **Given** Step 2 is open with no rows, **When** the user tries to submit, **Then** submission is blocked with a validation message requiring at least one row.

---

### User Story 3 — Platform-Wide Select Consistency (Priority: P3)

Every field across the entire app that corresponds to a managed list becomes a select dropdown — never free text. This covers: Model (all forms), Size (all forms), Color (all forms), Part (all forms where applicable), Unit (stock), Type (stock), Employee (cutting, QC, finition, steps), Supplier (stock inbound). Any entity added anywhere in the app is immediately available in all relevant selectors without requiring a page refresh.

**Why this priority**: Prevents data fragmentation (e.g. "حجاب" vs "حجاب " vs "Hijab" all representing the same model). Essential for filtering and reporting correctness.

**Independent Test**: Add a new employee "Fatima" in the employees screen. Without refreshing, open the cutting session form and verify "Fatima" appears in the employee dropdown. Select "Fatima" and submit a session. Verify the session record links to Fatima by ID, not free text.

**Acceptance Scenarios**:

1. **Given** a new employee is added in the employees screen, **When** any form with an employee selector is opened in the same session (without refresh), **Then** the new employee appears in the selector.
2. **Given** a new supplier is added, **When** the stock inbound form is opened, **Then** the new supplier is immediately available without refresh.
3. **Given** any form that previously had a free-text model field, **When** the form is opened, **Then** the model field is a select dropdown populated from the managed models list.
4. **Given** a managed list entry is soft-deleted, **When** a selector is opened, **Then** the deleted entry does not appear as a new option (existing records referencing it are unaffected).

---

### User Story 4 — Employee Operation Traceability (Priority: P4)

Every earning logged against an employee carries full context: operation type (cutting, distribution, QC, finition, custom step), model, part, size, color, quantity, price per unit, total cost, date, and the source record ID. The employee detail view shows drillable line items. Clicking a line navigates to the source record.

**Why this priority**: Provides full payroll auditability and allows supervisors to verify each earning against the originating work record.

**Independent Test**: Log a cutting operation for employee "Ahmed" (model حجاب, part الضهر, size S, qty 30, price 5دج). Open Ahmed's detail view. Verify the operations history shows: "قطع — حجاب — الضهر — S — 30 قطعة — 5دج/قطعة — 150دج — [date]". Click the entry and verify it navigates to the cutting session record.

**Acceptance Scenarios**:

1. **Given** an operation is logged for an employee, **When** the employee detail view is opened, **Then** each operation line shows: type, model, part, size, color, quantity, unit price, total, and date.
2. **Given** an operation line is shown in the employee detail, **When** the user clicks it, **Then** the app navigates to the source record (cutting session, distribution batch, QC record, finition record, or custom step).
3. **Given** operations from multiple source types exist for an employee, **When** the history is displayed, **Then** each line correctly identifies its source type with an appropriate Arabic label.

---

### User Story 5 — Stock Consumption Traceability (Priority: P5)

Every stock consumption entry carries full context: source operation type, source record ID, model, and date. The stock item detail view shows consumption transactions with this source context — not just a quantity, but which operation consumed it and for which model.

**Why this priority**: Enables stock auditing and lets managers trace exactly which production operation consumed which materials.

**Independent Test**: Consume 2m of fabric in a cutting session for model "حجاب". Open the fabric's stock detail. Verify the transaction shows: "استهلاك — قص — حجاب — [date]" with a reference to the cutting session.

**Acceptance Scenarios**:

1. **Given** a cutting session consumes fabric, **When** the fabric's stock detail is opened, **Then** the transaction shows: type "استهلاك", source "قص", model name, and date.
2. **Given** a QC or finition step consumes a non-fabric item, **When** the item's stock detail is opened, **Then** the transaction shows the correct source operation type and model.
3. **Given** multiple operations consumed the same stock item, **When** viewing the transaction history, **Then** each entry has distinct source context showing its own operation type and model.

---

### Edge Cases

- What happens when a managed list entry is soft-deleted while a form referencing it is open? The open form retains the selection; on next open the entry is absent from new selections.
- What happens when the inline "add" fails due to a duplicate name? The error is shown inline in the dropdown without closing the parent form.
- What if a cutting session has rows with duplicate part+size combinations? Allowed — two rows with the same part+size are independent production entries.
- What if model/part/size fields contain historical free-text values from before this feature? Those records retain their stored text; they are not retroactively linked to managed-list entries.
- What if an employee is deactivated while their name appears in a selector that's already open? The current form session is unaffected; on next open inactive employees are hidden.

## Requirements *(mandatory)*

### Functional Requirements

**Models, Sizes & Parts Management**

- **FR-001**: System MUST provide a managed models list in settings with add, edit, and soft-delete operations, following the same pattern as existing lookup lists (colors, types, units).
- **FR-002**: System MUST provide a managed parts list in settings with add, edit, and soft-delete operations.
- **FR-003**: System MUST provide a managed sizes list in settings with add, edit, and soft-delete operations.
- **FR-004**: Every dropdown for model, part, and size across the app MUST include an inline "add" option at the bottom that saves the new entry to the managed list and immediately selects it in the current field.
- **FR-005**: Inline-added entries MUST be immediately available in all other selectors of the same type in the current session without requiring a page refresh.
- **FR-006**: Soft-deleted entries MUST NOT appear as selectable options in any dropdown; existing records that reference a deleted entry MUST retain their stored value unchanged.

**Cutting Step 2 Restructure**

- **FR-007**: In cutting session Step 2, each row MUST contain: part (select from managed parts), size (select from managed sizes), and quantity produced (positive integer).
- **FR-008**: Multiple part+size rows MUST be addable per session, and at least one row MUST be required to submit.
- **FR-009**: Each cutting piece record MUST store: model (from Step 1), part name, size name, color (inherited from Step 1 fabric), and status.
- **FR-010**: The total piece count for a cutting session MUST equal the sum of quantities across all part+size rows.

**Platform-Wide Select Consistency**

- **FR-011**: The model field MUST be a select dropdown (not free text) everywhere it appears: cutting sessions, distribution batches, QC records, finition records, and final stock entries.
- **FR-012**: The size field MUST be a select dropdown on every form that currently has an editable size input. Distribution, QC, and finition forms do not gain a new size input field — size for those records is inherited from the cutting pieces they reference, not entered by the user.
- **FR-013**: The color field MUST be a select dropdown everywhere it appears, populated from the managed colors list.
- **FR-014**: The employee field MUST be a select dropdown everywhere it appears, populated from the live employees list.
- **FR-015**: The supplier field MUST be a select dropdown everywhere it appears, populated from the live suppliers list.
- **FR-016**: Any entity (employee, supplier, model, size, part, color, unit, type) added anywhere in the app MUST be immediately available in all relevant selectors within the same session without a page refresh.

**Employee Operation Traceability**

- **FR-017**: Every operation logged for an employee MUST store: operation type, model, color, quantity, price per unit, total cost, date, and source record ID. For cutting operations specifically, part name and size name MUST also be stored. Distribution, QC, and finition operations record model and color only (not part/size), as these operate at batch level across mixed piece types.
- **FR-018**: The employee detail view MUST display each operation as a line item showing all stored context fields in human-readable Arabic format.
- **FR-019**: Each operation line item in the employee detail MUST be clickable and navigate to the corresponding source record.

**Stock Consumption Traceability**

- **FR-020**: Every stock consumption entry MUST store: source operation type, source record ID, model name, and date.
- **FR-021**: The stock item detail view transaction history MUST display each consumption entry with its source operation type, model name, and date.

### Key Entities

- **Model**: A managed lookup with a unique name (e.g. "حجاب"). Referenced by cutting sessions, distribution batches, QC records, finition records, and final stock entries. Supports soft-delete.
- **Part**: A managed lookup with a unique name (e.g. "الضهر"). Referenced by cutting piece records. Supports soft-delete.
- **Size**: A managed lookup with a unique name (e.g. "S", "12yo"). Editable size input appears in: cutting session Step 2 and final stock entries. Distribution/QC/finition display size only as inherited from cutting pieces — no editable size field. Supports soft-delete.
- **CuttingPiece** (enhanced): Each piece stores model name, part name, size name, color (from session fabric), and status.
- **EmployeeOperation** (enhanced): Each operation record stores: operation type, model, color, quantity, unit price, total cost, source operation type, and source record ID. Cutting operations additionally store part name and size name; distribution/QC/finition operations do not (batch-level granularity).
- **StockTransaction** (enhanced): Each consumption record stores source operation type, source record ID, and model name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A manager can trace any employee earning back to its originating production record in 2 clicks or fewer from the employee detail view.
- **SC-002**: A manager can trace any stock consumption event to its originating operation and model in 2 clicks or fewer from the stock item detail view.
- **SC-003**: 100% of model, size, part, color, employee, and supplier fields across all forms are select dropdowns — zero free-text fields remain for managed-list data.
- **SC-004**: An entity (model, employee, supplier) added in one screen is available in all relevant selectors within the same session without any page refresh.
- **SC-005**: Adding a new model, part, or size inline takes under 10 seconds and does not interrupt the user's current form workflow.
- **SC-006**: Zero duplicate or inconsistently-named model/part/size values are creatable through normal app usage after this feature ships.

## Assumptions

- Historical records created before this feature (with free-text model/size fields) retain their stored text values and are not retroactively migrated to managed-list references.
- The "tailor" concept continues to use the existing tailors table (feature-006); the consistency requirement means no free-text tailor name fields remain — all tailor selectors reference managed list entries.
- The inline "add" interaction is a compact inline input that appears within the open dropdown, not a full modal, to minimize workflow interruption.
- Soft-deleted models/parts/sizes remain readable in historical records (display the stored name string) but are not selectable in new records.
- The parts list and sizes list are separate concepts: a "part" is a piece of a garment (e.g. sleeve/الكم), a "size" is a measurement label (e.g. S, M, 12yo).
- Real-time selector updates within the same session are achieved through the existing app state/IPC architecture; no external real-time sync mechanism is needed.
- The scope of "immediately available" is within the same running app session — no cross-device or cross-session sync requirement.

## Clarifications

### Session 2026-03-16

- Q: Does the "tailor" selector use the existing tailors table or the employees list? → A: The existing tailors table (feature-006) remains; all tailor selectors reference it rather than free-text — consistency requirement applies to eliminating any remaining free-text tailor fields.
- Q: Should the inline-add interaction be a mini modal or an inline input within the dropdown? → A: Inline input within the dropdown — minimal interruption to the current form workflow.
- Q: Should historical free-text model/size values be migrated to the new managed lists? → A: No migration — historical records retain their stored text values as-is.
- Q: For non-cutting operations (distribution, QC, finition) employee earnings, should part+size be logged? → A: No — non-cutting operations record model and color only; part and size are logged exclusively for cutting operations where a single definitive part+size is known per row.
- Q: Does FR-012 (size as select dropdown) require adding a size input to distribution, QC, and finition creation forms? → A: No — FR-012 applies only to forms that already have an editable size field; distribution/QC/finition inherit size from cutting pieces and do not gain a new size input.
