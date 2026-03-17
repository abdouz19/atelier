# Quickstart: Employee Management

**Branch**: `004-employee-management` | **Date**: 2026-03-14
**Purpose**: End-to-end test walkthrough validating all three user stories independently and in combination.

---

## Prerequisites

- App running in dev mode (`npm run dev` / Electron launched)
- Navigate to the Employees section in the sidebar

---

## User Story 1: Employee Directory Management

### Step 1 — Empty state

**Action**: Open the Employees screen for the first time.

**Assert**:
- Table shows an empty-state message (no employees yet)
- "إضافة موظف" button is visible

---

### Step 2 — Add employee without photo

**Action**: Click "إضافة موظف". Fill in name = "أحمد محمد", role = "خياط", phone = "0501234567". Leave notes and photo empty. Submit.

**Assert**:
- Modal closes
- Success toast appears
- Employee row appears in table: name "أحمد محمد", role "خياط", phone "0501234567", status badge "نشط"
- Balance due column shows 0

---

### Step 3 — Validation: submit without name

**Action**: Open add modal. Leave name empty. Submit.

**Assert**:
- Validation error appears on name field
- Modal remains open
- No new row added

---

### Step 4 — Add second employee with photo

**Action**: Add "فاطمة علي", role = "فصال", with a valid JPG photo (< 5 MB).

**Assert**:
- Second row appears with photo thumbnail in table
- Both employees visible, both "نشط"

---

### Step 5 — Edit employee

**Action**: Click edit on "أحمد محمد". Change role to "قصاب". Submit.

**Assert**:
- Edit modal closes
- Row updates to show new role "قصاب"

---

### Step 6 — Deactivate employee

**Action**: Click deactivate on "فاطمة علي". Confirm in the confirmation dialog.

**Assert**:
- "فاطمة علي" row status changes to "غير نشط"
- Employee remains visible in table (not hidden)

---

### Step 7 — Re-activate employee

**Action**: Click activate on "فاطمة علي" (no confirmation dialog for re-activation).

**Assert**:
- Status badge returns to "نشط"

---

### Step 8 — No hard delete

**Action**: Inspect the UI for "أحمد محمد". Look for any delete button.

**Assert**:
- No hard-delete option is present; only edit and deactivate actions exist

---

## User Story 2: Employee Financial Overview

### Step 9 — Detail view empty state

**Action**: Click on "أحمد محمد" row.

**Assert**:
- Navigates to detail view (`/employees?id=xxx`)
- Profile section shows: name, role, phone, status "نشط", no photo placeholder variant visible
- Financial summary: total earned = 0, total paid = 0, balance due = 0
- Operations history shows empty-state message
- Payments history shows empty-state message

---

### Step 10 — Add manual operations (single type)

**Action**: Click "إضافة عملية" from the detail view. Fill in: type = cutting, date = today, quantity = 10, price per unit = 50. Submit.

**Assert**:
- Operations history shows one group: "قص" with 1 row (qty 10, price/unit 50, total 500)
- Operations summary card shows: cutting: 1 operation, 500 SAR
- Financial summary: total earned = 500, total paid = 0, balance due = 500

---

### Step 11 — Add operation of a different type

**Action**: Add another operation: type = finition, quantity = 5, price per unit = 80 (total = 400).

**Assert**:
- Two operation groups appear: "قص" (subtotal 500) and "تشطيب" (subtotal 400)
- Financial summary: total earned = 900, balance due = 900
- Operations summary card shows both types

---

### Step 12 — Inactive employee history is preserved

**Action**: Deactivate "أحمد محمد". Navigate back to employees list. Click his row.

**Assert**:
- Detail view loads with status "غير نشط" indicator
- All operations and totals are exactly the same as before deactivation

Re-activate before continuing.

---

## User Story 3: Payment Logging

### Step 13 — Log a payment

**Action**: From "أحمد محمد" detail view, click "تسجيل دفعة". Enter amount = 400, date = today. Submit.

**Assert**:
- Payment modal closes
- Payment appears in payments history: amount 400, today's date
- Financial summary updates immediately: total paid = 400, balance due = 500 (900 − 400)

---

### Step 14 — Validation: zero amount

**Action**: Open payment modal. Enter amount = 0. Submit.

**Assert**:
- Validation error on amount field
- No payment saved

---

### Step 15 — Advance payment (negative balance)

**Action**: Log a payment of 600 SAR (exceeds remaining balance of 500).

**Assert**:
- Payment saves successfully
- Balance due shows −100 (credit balance)
- A visual indicator distinguishes the negative balance (e.g., red color or negative sign)

---

### Step 16 — Edit a payment

**Action**: Click edit on the 400 SAR payment. Change amount to 300. Submit.

**Assert**:
- Payment row updates to show 300 SAR
- Financial summary recalculates: total paid = 900 (300 + 600), balance due = 0

---

### Step 17 — Delete a payment

**Action**: Click delete on the 600 SAR payment. Confirm in the confirmation dialog.

**Assert**:
- Payment row is removed from history
- Financial summary recalculates: total paid = 300, balance due = 600

---

### Step 18 — Full end-to-end flow (SC-006 target: < 3 min)

**Action**: Starting from a fresh employee, complete the full flow:
1. Add employee "تجربة موظف"
2. Open detail view
3. Add one operation (type = custom, qty = 20, price = 100 → total 2000)
4. Log a payment of 1000 SAR
5. Confirm balance due = 1000

**Assert**: All steps complete in under 3 minutes. Balance is correct throughout.

---

## Cross-App: Employee Selectors (FR-005)

### Step 19 — Inactive employees excluded from selectors

**Action**: Deactivate "فاطمة علي". Navigate to any module that has an employee selector (when future production modules exist — cutting, distribution, QC, finition).

**Assert**:
- "فاطمة علي" does not appear in any employee dropdown
- "أحمد محمد" (active) appears normally
- "فاطمة علي"'s detail view and history remain fully accessible from the Employees screen
