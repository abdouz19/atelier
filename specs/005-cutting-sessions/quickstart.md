# Quickstart: Cutting Session Management

**Branch**: `005-cutting-sessions` | **Date**: 2026-03-15
**Purpose**: End-to-end test walkthrough validating all three user stories independently and in combination.

---

## Prerequisites

- App running in dev mode
- At least one stock item of type "قماش" with a color variant and available quantity > 0
- At least one active employee
- At least one non-fabric stock item with available quantity > 0 (for step 2 consumption test)

---

## User Story 1: View and Track Cutting Sessions

### Step 1 — Empty state

**Action**: Navigate to Cutting from the sidebar.

**Assert**:
- All 5 KPI cards show zero
- Sessions table shows an empty state message
- "New Cutting Session" button is visible

---

### Step 2 — KPIs and table after sessions exist

*(Run after Steps 7–12 to re-verify)*

**Action**: Return to Cutting screen after creating sessions.

**Assert**:
- KPI "total sessions" increments by 1 per created session
- KPI "total pieces" = sum of all pieces created
- KPI "pieces not distributed" = same as total pieces (none distributed yet)
- KPI "meters consumed" = sum of metersUsed across sessions
- KPI "total cost" = sum of all earnings paid to employees

---

### Step 3 — Session table columns

**Assert**: Each session row shows: date, fabric name + color, model name, meters used, total pieces, employee name(s), total cost. Rows are present for each created session.

---

### Step 4 — Session detail view (read-only)

**Action**: Click a session row.

**Assert**:
- Detail view opens (URL shows `?id=...`)
- Shows: date, fabric name + color, model name, meters used, layers, price per layer, notes, employees with earnings
- Shows pieces breakdown by size (size label → count)
- Shows list of consumed non-fabric items (name + color + quantity)
- No edit or delete buttons anywhere on the detail view

---

## User Story 2: Create a Cutting Session

### Step 5 — Open the new session modal

**Action**: Click "New Cutting Session".

**Assert**:
- Two-step modal opens showing step 1
- Step indicator shows "Step 1 of 2"

---

### Step 6 — Step 1 fabric selector only shows قماش

**Action**: Open the fabric dropdown.

**Assert**: Only items of type "قماش" are listed. No other item types appear.

---

### Step 7 — Fabric color selector shows available variants

**Action**: Select a fabric. Observe the color selector.

**Assert**: Color dropdown shows only color variants with available quantity > 0, displaying the available quantity next to each color.

---

### Step 8 — Meters validation (exceed available)

**Action**: Select fabric + color, enter meters > available quantity.

**Assert**: An error is shown on the meters field. "Next" button remains disabled or clicking Next shows a validation error.

---

### Step 9 — Complete step 1

**Action**: Fill in: fabric + color (valid), model name = "موديل تجريبي", meters = 5 (within available), select 2 active employees, layers = 10, price per layer = 20. Set date to today. Click Next.

**Assert**:
- No validation errors
- Modal advances to Step 2
- Step indicator shows "Step 2 of 2"
- Total cost display shows: 10 × 20 = 200 ر.س per employee

---

### Step 10 — Step 2: size rows required

**Action**: On step 2, click Submit without adding any size rows.

**Assert**: Validation error requires at least one size row.

---

### Step 11 — Step 2: add size rows

**Action**: Add rows: "M" → 30 pieces, "L" → 20 pieces. Running total shows 50.

**Assert**: Running total = 50 pieces.

---

### Step 12 — Step 2: add consumption entry with quantity validation

**Action**: Add a non-fabric consumption entry. Select a non-fabric item. Enter quantity > available for that item.

**Assert**: Error shown on the quantity field. Submit is blocked.

---

### Step 13 — Step 2: valid submission

**Action**: Correct the consumption quantity to a valid value (≤ available). Click Submit.

**Assert**:
- Modal closes
- Success toast appears
- Sessions table shows the new session
- Fabric stock quantity decreased by 5 meters for that color
- Consumed non-fabric item quantity decreased by the entered amount
- 50 pieces created (30 "M" + 20 "L") — visible in session detail
- Both selected employees each have an employee_operations record with amount = 10 × 20 = 200
- Employees screen shows updated earnings for both employees

---

### Step 14 — Model name autocomplete

**Action**: Open new session modal, start typing "مو" in the model name field.

**Assert**: "موديل تجريبي" appears as a suggestion (from the previously created session).

---

### Step 15 — Size label autocomplete

**Action**: In step 2, start typing "M" in the size label field.

**Assert**: "M" appears as a suggestion from previous sessions.

---

## User Story 3: Session Immutability

### Step 16 — No edit controls on detail view

**Action**: Open the detail view of any saved session.

**Assert**: No edit icon, no "Edit" button, no inline editable fields. All text is display-only.

---

### Step 17 — No delete option

**Action**: Inspect all actions available on the session row and on the detail view.

**Assert**: No delete button exists anywhere.

---

### Step 18 — Data persists after restart

**Action**: Note the session count and a specific session's data. Restart the Electron app.

**Assert**: All sessions, KPIs, and piece data are identical to before restart.

---

## Cross-module Validation

### Step 19 — Fabric stock deduction reflects on Stock screen

**Action**: Note fabric+color quantity before creating a session. Create a session using 5 meters. Navigate to Stock screen and find the fabric item.

**Assert**: The fabric item's available quantity for that color decreased by exactly 5 meters.

### Step 20 — Employee earnings reflect on Employees screen

**Action**: Note employee balance before session creation. After creating the session with layers=10, price=20. Navigate to Employees screen, open that employee's detail.

**Assert**: A new "cutting" operation appears in their operations history with total = 200. Their balance due updated accordingly.
