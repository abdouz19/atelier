# Feature Specification: Employee Management

**Feature Branch**: `004-employee-management`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "Employees — directory, operations history, balance tracking, payments"

---

## Clarifications

### Session 2026-03-14

- Q: Can operation records be manually added from the employee detail view, or do they only come from other production modules? → A: Both — operations can be manually added directly from the employee detail view (specifying type, date, quantity, price per unit), and when production modules (cutting, distribution, QC, finition) are built they will also link records to employees. Manual entry makes the module immediately self-contained and testable.
- Q: Can a deactivated employee be re-activated (status toggled back to active)? → A: Yes — deactivation is reversible; the manager can toggle status between active and inactive at any time.
- Q: Can logged payments be edited or deleted after submission? → A: Both — the manager can edit a payment's amount, date, and notes, or delete it entirely. Balance due recalculates immediately after any change.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Employee Directory Management (Priority: P1)

The workshop manager maintains a complete list of all employees. They can add new employees with their basic info and an optional photo, edit existing records, and deactivate employees who are no longer working. The employees table shows each person's name, phone, role, and active/inactive status.

**Why this priority**: The directory is the foundation of the entire module. No other story can function without employees existing in the system. Add, view, edit, and deactivate is the core workflow everything else depends on.

**Independent Test**: Can be fully tested by adding several employees, editing one, deactivating another, and confirming the table reflects correct state — no other module needed.

**Acceptance Scenarios**:

1. **Given** the employees screen is open, **When** the manager clicks "إضافة موظف", **Then** a modal opens with fields for name (required), phone, role (free text), notes, and optional photo upload.
2. **Given** the add-employee modal is open, **When** the manager submits without a name, **Then** a validation error appears and no record is saved.
3. **Given** the add-employee modal is open with a valid name, **When** the manager submits, **Then** the new employee appears in the table with status "نشط".
4. **Given** an employee exists in the list, **When** the manager clicks the edit button, **Then** a modal pre-fills all existing values and allows changes to any field including photo.
5. **Given** an employee is active, **When** the manager deactivates them via a confirmation dialog, **Then** they remain visible in the employees table marked as "غير نشط" but no longer appear in any employee selector across the app.
5b. **Given** an employee is inactive, **When** the manager re-activates them, **Then** their status changes to "نشط" and they reappear in employee selectors across the app.
6. **Given** any employee record, **When** the manager looks for a delete option, **Then** no hard-delete option exists — only deactivation is offered.

---

### User Story 2 — Employee Financial Overview (Priority: P2)

Clicking any employee row opens a detail view with their full profile at the top (name, photo, phone, role, notes) and a complete financial summary below: all linked operation records grouped by operation type, per-type earnings subtotals, total earned across all types, total paid to date, and the live balance due (total earned minus total paid).

**Why this priority**: The financial overview is the core value of the module — it answers "how much do I owe this employee right now?" Without this, payment logging has no meaningful context, and the employee record is just a contact list.

**Independent Test**: Can be tested by navigating to an employee's detail view and manually adding operation records of different types. With no operations, all totals show zero. After adding records, groupings, subtotals, and balance all calculate correctly — no other module needed.

**Acceptance Scenarios**:

1. **Given** an employee has no operations and no payments, **When** the detail view opens, **Then** the operations section shows an empty-state message, total earned = 0, total paid = 0, balance due = 0.
2. **Given** an employee has operations of multiple types (e.g., cutting and finition), **When** the detail view opens, **Then** each type appears as a separate group showing its rows and subtotal.
3. **Given** an employee has cutting operations totalling 3000 SAR and finition operations totalling 2000 SAR, **When** the detail view opens, **Then** total earned shows 5000 SAR.
4. **Given** an employee has earned 5000 SAR and been paid 2000 SAR, **When** the detail view opens, **Then** balance due shows 3000 SAR.
5. **Given** an employee is inactive, **When** the detail view opens, **Then** all historical operations and financial data are visible and correct, with a clear inactive status indicator.
6. **Given** the detail view is open and payment history exists, **When** the manager views the payments section, **Then** every logged payment appears with its date, amount, and notes.

---

### User Story 3 — Payment Logging (Priority: P3)

From the employee detail view, the manager can record a payment made to the employee. Each payment captures the amount, date, and optional notes. Payments are summed into "total paid" and the balance due updates immediately.

**Why this priority**: Payments are the action that closes the balance. Without payment logging, the financial summary is read-only and has no operational utility. It is lower priority than the overview because the overview is needed first to know what to pay.

**Independent Test**: Can be tested by logging a payment on an employee with a known balance, confirming the balance decreases by the payment amount, and confirming the payment appears in the payment history list.

**Acceptance Scenarios**:

1. **Given** the employee detail view is open, **When** the manager clicks "تسجيل دفعة", **Then** a modal opens with fields for amount (required, positive), date (required, defaults to today), and optional notes.
2. **Given** the payment modal is open, **When** the manager submits without an amount or with amount = 0, **Then** a validation error appears and no payment is saved.
3. **Given** a valid payment is submitted, **When** the detail view refreshes, **Then** the payment appears in the payment history list and total paid increases by the payment amount.
4. **Given** an employee has balance due of 3000 SAR, **When** the manager logs a payment of 1500 SAR, **Then** balance due becomes 1500 SAR.
5. **Given** total payments exceed total earned (advance payment scenario), **When** the balance is displayed, **Then** it shows a negative value — no blocking is applied and the manager sees a visual indicator of credit balance.
6. **Given** a payment exists in the history, **When** the manager edits it and submits valid changes, **Then** the payment row updates and balance due recalculates immediately.
7. **Given** a payment exists in the history, **When** the manager deletes it via a confirmation dialog, **Then** the payment is removed from the list and balance due recalculates immediately.

---

### Edge Cases

- What if an employee has operations in only one type? → Only that group is shown; other types are omitted from the grouping.
- What if a payment amount exceeds the balance due? → Allowed; balance goes negative (advance payment). No warning required.
- What if the manager uploads an oversized or unsupported photo? → Validation rejects the file with a clear error before submission (max 5 MB, JPG/PNG/WEBP only).
- What if an employee has no photo? → A placeholder avatar is shown in the detail view.
- What happens when a deactivated employee's operation records are viewed? → The detail view loads normally; history is preserved and readable in full.
- What if the manager deactivates an employee who is currently referenced by an open operation in another module? → The deactivation proceeds; existing references are preserved, new selections in other modules will not show this employee.
- What if the manager deletes a payment that brought the balance to zero or negative? → The deletion proceeds; balance recalculates to reflect the removal; no blocking is applied.

---

## Requirements *(mandatory)*

### Functional Requirements

**Employee Directory**

- **FR-001**: The system MUST display all employees (active and inactive) in a table showing: name, phone, role, and status (active/inactive).
- **FR-002**: The system MUST allow adding a new employee with: name (required, non-empty), phone (optional), role (optional, free text), notes (optional), photo (optional, JPG/PNG/WEBP, max 5 MB).
- **FR-003**: The system MUST allow editing any employee's name, phone, role, notes, and photo at any time.
- **FR-004**: The system MUST allow toggling an employee's status between active and inactive. Deactivation requires a confirmation dialog. Re-activation does not require confirmation. Deactivated employees remain in the table and their full history is preserved.
- **FR-005**: Inactive employees MUST be excluded from all employee selector inputs across the entire application.
- **FR-006**: The system MUST NOT provide a hard-delete option for any employee record.
- **FR-007**: Active and inactive employees MUST be visually distinguishable in the table via a status badge or equivalent indicator.

**Employee Detail View**

- **FR-008**: Clicking an employee row MUST navigate to a detail view using the `/employees?id=xxx` query-param pattern.
- **FR-009**: The detail view MUST show the employee's full profile: name, photo (or placeholder if none), phone, role, notes, and status.
- **FR-010**: The detail view MUST show an operations history section with all linked operation records grouped by operation type (cutting, distribution, qc, finition, custom). Records may be added manually from the detail view or linked automatically by production modules.
- **FR-010a**: The manager MUST be able to manually add an operation record from the detail view, specifying: operation type (from allowed types), date, quantity, and price per unit. Total amount is auto-calculated as quantity × price per unit.
- **FR-011**: Each operation record in the history MUST show: operation type, date, quantity, price per unit, and total amount.
- **FR-012**: Each operation type group MUST show a subtotal (sum of total amounts for that type).
- **FR-013**: The detail view MUST show a financial summary: total earned (sum of all operation totals), total paid (sum of all payment records), balance due (total earned − total paid).
- **FR-014**: The detail view MUST show a payment history section listing all payments with: date, amount, notes.

**Payment Logging**

- **FR-015**: The manager MUST be able to log a payment from the detail view with: amount (required, > 0), date (required, defaults to today), notes (optional).
- **FR-015a**: The manager MUST be able to edit any existing payment's amount, date, and notes from the payment history section.
- **FR-015b**: The manager MUST be able to delete any existing payment. Deletion requires a confirmation dialog.
- **FR-016**: Submitting a valid payment, editing a payment, or deleting a payment MUST immediately update total paid and balance due in the detail view.
- **FR-017**: Overpayment (resulting in negative balance) MUST be permitted without restriction.

**Cross-App Behaviour**

- **FR-018**: Operation records from other production modules (cutting, distribution, qc, finition) MUST be linkable to employees via an employee reference field on those records.
- **FR-019**: The "balance due" metric MUST always reflect the most current state (latest operations + latest payments) without requiring a manual refresh cycle.

### Key Entities

- **Employee**: Unique identifier, name, phone, role (free text), notes, photo path (optional), status (active/inactive), created and updated timestamps.
- **EmployeePayment**: A payment made to an employee. Attributes: employee reference, amount (positive number), payment date, notes, created timestamp.
- **EmployeeOperation**: A work record linked to an employee. Attributes: operation type (cutting, distribution, qc, finition, custom), source module reference (optional — null for manually entered records), employee reference, date, quantity, price per unit, total amount (quantity × price per unit), notes, created timestamp. May be created manually from the employee detail view or linked automatically by production modules.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Manager can add a new employee (including photo upload) and confirm they appear in the table in under 60 seconds.
- **SC-002**: Employee detail view — including full operations history and financial summary — loads in under 2 seconds for any employee with up to 1,000 operation records.
- **SC-003**: Balance due recalculates and the updated value is visible within 1 second of a payment being submitted.
- **SC-004**: 100% of deactivated employees are absent from all employee selectors in the same session immediately after deactivation, without requiring an app restart.
- **SC-005**: All employee records and payment history survive application restart with no data loss.
- **SC-006**: The complete flow — add employee, open detail, log payment, confirm updated balance — can be completed in under 3 minutes.

---

## Assumptions

- Operation records can be created manually from the employee detail view (specifying type, date, quantity, price per unit) as well as linked automatically by production modules (cutting, distribution, QC, finition) once those modules are built. Manual entry makes this module immediately self-contained and testable.
- "Custom steps" is a flexible operation type used by modules that don't fit a standard category.
- Photo storage follows the same local-file pattern used for stock item images (stored on disk, path referenced in the record).
- The application is single-user; no role-based access control is needed for this feature.
- Negative balance (advance payment) is a valid and expected business state; no alerts or blocking are required.
- The employees table shows all employees (active + inactive) by default; a status filter toggle is a desirable UX enhancement but not blocking correctness.
