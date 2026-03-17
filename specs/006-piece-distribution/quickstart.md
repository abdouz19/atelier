# Quickstart: Piece Distribution Management

**Branch**: `006-piece-distribution` | **Date**: 2026-03-15
**Purpose**: End-to-end test walkthrough validating all five user stories independently and in combination.

---

## Prerequisites

- App running in dev mode
- At least one cutting session with `not_distributed` pieces (created via the Cutting screen)
- At least one non-fabric stock item with available quantity > 0 (for return consumption test)

---

## User Story 1: Manage Tailors

### Step 1 — Empty state

**Action**: Navigate to Tailors from the sidebar.

**Assert**:
- Empty state message shown
- "New Tailor" button is visible
- No tailor rows in the list

---

### Step 2 — Create a tailor

**Action**: Click "New Tailor". Enter name = "خياط تجريبي", phone = "0501234567". Submit.

**Assert**:
- Modal closes
- Success toast appears
- Tailor appears in the list with zero balance
- Status shows as active

---

### Step 3 — Edit tailor

**Action**: Open the tailor. Click edit. Change name to "خياط معدّل". Save.

**Assert**:
- Updated name appears in list and detail view

---

### Step 4 — Record a payment

**Action**: Open the tailor detail. Record a payment: amount = 100, today's date.

**Assert**:
- Payment appears in payment history
- Tailor balance decreases by 100 (shown as negative if no sewing cost yet)

---

### Step 5 — Edit and delete a payment

**Action**: Edit the payment to amount = 150. Then delete it.

**Assert**:
- Edit: balance reflects 150 immediately after save
- Delete: payment removed, balance returns to zero

---

### Step 6 — Deactivate tailor

**Action**: Toggle tailor status to inactive.

**Assert**:
- Status badge changes to inactive
- Tailor still visible in list
- Tailor does NOT appear in the Distribute modal tailor selector (verify in Step 11)

---

### Step 7 — Reactivate tailor

**Action**: Toggle tailor status back to active.

**Assert**:
- Status badge changes to active
- Tailor appears again in the Distribute modal selector

---

## User Story 2: View Distribution Overview

### Step 8 — Empty state

**Action**: Navigate to Distribution from the sidebar.

**Assert**:
- All 6 KPI cards show zero
- Per-tailor summary table shows empty state message
- "Distribute" and "Return" buttons are visible

---

### Step 9 — KPIs and table after distributions exist

*(Run after Steps 11–14)*

**Action**: Return to Distribution screen after creating a distribution.

**Assert**:
- KPI "pieces in distribution" = distributed quantity
- KPI "total sewing cost" = quantity × price per piece
- Tailor row appears in summary table sorted by most pending pieces first
- All column values match the created distribution

---

### Step 10 — Tailor distribution detail view

**Action**: Click a tailor row in the Distribution summary table.

**Assert**:
- Detail view opens showing their distribution batches
- Each batch shows model, size, color, quantity, price, total cost, date
- No edit or delete controls visible anywhere

---

## User Story 3: Distribute Pieces to a Tailor

### Step 11 — Open Distribute modal

**Action**: Click "Distribute".

**Assert**:
- Modal opens
- Tailor selector shown (searchable)
- Inactive tailors are NOT listed in the selector
- Model, size, color fields are empty

---

### Step 12 — Availability counter

**Action**: Select tailor "خياط تجريبي". Enter model = (a model from an existing cutting session), size = (an existing size), color = (the fabric color from that session).

**Assert**:
- Availability counter shows the correct number of not-distributed pieces for that model+size+color
- Quantity field maximum is set to that count

---

### Step 13 — Quantity validation

**Action**: Enter quantity > available count.

**Assert**:
- Validation error shown on quantity field
- Submit button disabled or blocked

---

### Step 14 — Valid submission

**Action**: Enter valid quantity (e.g., 5), sewing price = 30, today's date. Submit.

**Assert**:
- Modal closes
- Success toast appears
- Distribution summary table shows the tailor with 5 pieces in distribution
- Availability counter (if reopened with same model+size+color) shows 5 fewer pieces
- Total cost auto-calculated as 150 ر.س shown in confirmation
- Tailor's balance on Tailors screen increases by 150

---

### Step 15 — Model and size autocomplete

**Action**: Open Distribute modal. Start typing the model name used in Step 14.

**Assert**:
- Autocomplete suggests the previously used model name

---

## User Story 4: Return Pieces from a Tailor

### Step 16 — Open Return modal

**Action**: Click "Return".

**Assert**:
- Modal opens
- Tailor selector shown (active tailors only)

---

### Step 17 — Select tailor and see batches

**Action**: Select tailor "خياط تجريبي".

**Assert**:
- List of their distributed batches appears
- Each row shows model, size, color, distributed quantity, and date
- Only batches with remaining pieces are shown

---

### Step 18 — Partial return

**Action**: Select the batch from Step 14. Change quantity from 5 to 3. Pick today's date. Submit (no consumption entries).

**Assert**:
- Modal closes
- Success toast appears
- KPI "pieces returned" increases by 3
- KPI "pieces in distribution" decreases by 3 (now 2)
- The batch still appears in the Return modal for future returns with remaining quantity = 2
- Detail view shows a return entry with quantity 3

---

### Step 19 — Return with stock consumption

**Action**: Open Return. Select tailor. Select the same batch (remaining = 2). Enter quantity = 2. Add a consumption entry: select a non-fabric item, enter quantity = 1. Submit.

**Assert**:
- Modal closes
- 2 more pieces returned (batch now fully returned — no longer appears in Return modal batches)
- Non-fabric item's available quantity decreased by 1 on the Stock screen
- Detail view shows both return records

---

### Step 20 — Exceed quantity validation

**Action**: Open Return. Select tailor. Select a batch. Enter quantity > remaining distributed quantity.

**Assert**:
- Validation error shown
- Submit blocked

---

### Step 21 — Consumption quantity validation

**Action**: Open Return. Select tailor. Select a batch. Add a consumption entry with quantity > available stock.

**Assert**:
- Validation error shown on that consumption field
- Submit blocked

---

## User Story 5: Record Immutability

### Step 22 — No edit on distribution batch

**Action**: Open the Distribution screen. Click a tailor row. Inspect their batch records.

**Assert**:
- No edit icon, edit button, or delete button on any batch row
- All text is display-only

---

### Step 23 — No edit on return record

**Action**: In the same tailor detail view, inspect their return records.

**Assert**:
- No edit or delete controls on any return record

---

### Step 24 — Data persists after restart

**Action**: Note the tailor balance, piece counts, and a specific batch's data. Restart the Electron app.

**Assert**:
- All data identical to before restart
- Tailor balance unchanged
- All batches and return records present

---

## Cross-Module Validation

### Step 25 — Stock deduction on return

**Action**: Note a non-fabric item's available quantity before Step 19. After Step 19, navigate to Stock screen.

**Assert**:
- The item's available quantity decreased by the exact amount entered in the consumption entry.

### Step 26 — Tailor balance reflects all distributions

**Action**: Create two more distributions for the same tailor (different models/sizes). Navigate to Tailors screen.

**Assert**:
- Tailor's `totalEarned` = sum of all their distribution batch `total_cost` values
- Tailor's `balanceDue` = totalEarned minus any payments made
