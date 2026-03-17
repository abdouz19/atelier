# Quickstart / QA Scenarios: Models, Pieces & Platform-Wide Relational Consistency

**Feature**: 009-models-parts-consistency
**Date**: 2026-03-16

---

## Scenario 1 — Settings: Add model, part, and size; verify they propagate

**Steps**:
1. Open Settings → scroll to the new **الموديلات** section
2. Add a model named `حجاب`
3. Scroll to **القطع** section; add a part named `الضهر`
4. Scroll to **المقاسات** section; add a size named `S`
5. Open the Cutting session creation form (Step 1)

**Expected**:
- `حجاب` appears in the model dropdown immediately (no page refresh needed)
- Open Step 2: `الضهر` appears in the part dropdown; `S` appears in the size dropdown
- Values appear across ALL forms that have model/size selectors

**Verifies**: FR-001, FR-002, FR-003, FR-005, SC-004

---

## Scenario 2 — Inline add: model from cutting form; part from cutting Step 2

**Steps**:
1. Open Cutting session creation (Step 1)
2. In the model field, click `إضافة موديل` at the bottom of the dropdown
3. Type `خمار` and save — new model is auto-selected
4. Complete Step 1 and proceed to Step 2
5. In the part field of a new row, click `إضافة قطعة`; type `الأمام` and save
6. In the size field, click `إضافة مقاس`; type `M` and save
7. Set quantity to 15; submit the session

**Expected**:
- `خمار` is now in the models list and selected in the current field
- `الأمام` is in the parts list; `M` is in the sizes list
- Session submits successfully
- Cutting session detail shows: model `خمار`, rows with part `الأمام` / size `M` / qty 15
- 15 cutting_pieces rows exist with `part_name = 'الأمام'`, `size_label = 'M'`, `color` from fabric

**Verifies**: FR-004, FR-005, FR-007, FR-008, FR-009, SC-005

---

## Scenario 3 — Cutting Step 2: multiple part+size rows, total pieces correct

**Steps**:
1. Create cutting session with model `حجاب`, fabric color `أزرق`
2. In Step 2, add row 1: part `الضهر` / size `S` / qty 30
3. Add row 2: part `الأمام` / size `M` / qty 20
4. Submit

**Expected**:
- Session detail shows 2 rows totaling 50 pieces
- DB: 50 cutting_pieces rows — 30 with part_name `الضهر`/size_label `S`/color `أزرق`, 20 with part_name `الأمام`/size_label `M`/color `أزرق`
- Attempting to submit with zero rows shows validation error

**Verifies**: FR-007, FR-008, FR-009, FR-010, SC-006

---

## Scenario 4 — Platform-wide consistency: employee added, immediately selectable

**Steps**:
1. Navigate to Employees → add a new employee named `Fatima`
2. Without refreshing, open Cutting session creation form
3. Check the employee selector

**Expected**:
- `Fatima` appears in the employee dropdown
- Select `Fatima` and submit a session — DB record stores `employee_id` (FK), not free text

**Verifies**: FR-014, FR-016, SC-003, SC-004

---

## Scenario 5 — Employee operations traceability: cutting operation with full context

**Steps**:
1. Create a cutting session: model `حجاب`, employee `Ahmed`, row: part `الضهر` / size `S` / qty 30 / price 5 دج
2. Submit the session
3. Open Ahmed's employee detail view → Operations History

**Expected**:
- Operations history shows: `قطع — حجاب — الضهر — S — 30 قطعة — 5دج/قطعة — 150دج — [date]`
- Clicking the row navigates to the cutting session record
- Distribution/QC/finition operations for Ahmed show model + color but no part/size column

**Verifies**: FR-017, FR-018, FR-019, SC-001

---

## Scenario 6 — Stock consumption traceability: consumed transaction shows model

**Steps**:
1. Create cutting session consuming 2m of fabric `قماش أزرق`, model `حجاب`
2. Submit
3. Navigate to Stock → open `قماش أزرق` detail → Transaction History

**Expected**:
- Transaction history shows a consumed row: `استهلاك — قص — حجاب — [date]` with reference to the cutting session
- Clicking shows source context (source_module = 'cutting', source_reference_id = session id)

**Verifies**: FR-020, FR-021, SC-002

---

## Scenario 7 — Soft-delete: deleted model hidden from selectors, existing records unaffected

**Steps**:
1. In Settings, soft-delete the model `حجاب`
2. Open any model dropdown (cutting, distribution, etc.)

**Expected**:
- `حجاب` does not appear as a selectable option
- Existing cutting sessions and distribution batches that stored `model_name = 'حجاب'` still display `حجاب` correctly

**Verifies**: FR-006, SC-006

---

## Scenario 8 — Duplicate inline-add shows inline error

**Steps**:
1. In a model dropdown, click `إضافة موديل` and type `حجاب` (already exists)
2. Press save

**Expected**:
- Error message displayed inline within the dropdown: `هذا الموديل موجود مسبقاً`
- Parent form remains open and unchanged

**Verifies**: FR-004, Edge Case (duplicate inline-add)
