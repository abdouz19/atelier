# Quickstart: Quality Control & Finition

Integration scenarios for verifying end-to-end correctness.

---

## Scenario 1 — QC: Partial then full review of a return batch

**Precondition**: A `return_records` row exists with `quantity_returned = 20`, linked to a distribution batch (tailor: Ahmed, model: Classic Shirt, size: L, color: أبيض).

**Steps**:
1. Call `qc:getReturnBatchesForQc` → verify the batch appears with `quantityAvailable = 20`.
2. Call `qc:create` with `quantityReviewed = 12`, `qtyDamaged = 2`, `qtyAcceptable = 4`, `qtyGood = 4`, `qtyVeryGood = 2`, `pricePerPiece = 50`.
3. Call `qc:getReturnBatchesForQc` → batch now shows `quantityAvailable = 8`, `batchStatus = "جزئي"`.
4. Call `qc:getRecords` → new QC record visible with correct grade breakdown.
5. Call `qc:getKpis` → `pendingQc` decreased by 12, `totalDamaged` = 2, `totalAcceptable` = 4, etc.
6. Call `qc:create` with `quantityReviewed = 8` (remaining), any valid grade split.
7. Call `qc:getReturnBatchesForQc` → batch no longer appears (fully reviewed).
8. Call `qc:getRecords` → second QC record shows `batchStatus = "مكتمل"`.

**Expected**: Two QC records exist; batch is fully reviewed; KPIs consistent.

---

## Scenario 2 — Finition → Directly ready → Final stock

**Precondition**: QC record from Scenario 1 session 1 exists with `qtyAcceptable=4, qtyGood=4, qtyVeryGood=2` (finitionable = 10).

**Steps**:
1. Call `finition:getQcRecordsForFinition` → QC record appears with `finitionableRemaining = 10`.
2. Call `finition:create` with `qcId`, `quantity = 7`, `pricePerPiece = 30`, `employeeId`.
3. Call `finition:getQcRecordsForFinition` → same QC record now shows `finitionableRemaining = 3`.
4. Call `finition:addToFinalStock` with `sourceType = 'finition'`, model/size/color, `quantity = 7`.
5. Finition record now has `isReady = true`.
6. Call `qc:getKpis` → `finitionPending` decreased by 7, `readyForStock` increased by 7.

**Expected**: Final stock entry created; finition record is_ready=1; KPIs correct.

---

## Scenario 3 — Finition → Custom Steps → Final stock

**Precondition**: A finition record exists with `quantity = 6`, `isReady = false`.

**Steps**:
1. Call `finition:createStep` with `finitionId`, `stepName = "كي"`, `quantity = 6`.
2. Verify step created with `stepOrder = 1`, `isReady = false`.
3. Call `finition:createStep` with same `finitionId`, `stepName = "تغليف"`, `quantity = 5` (reduced from 6).
4. Verify step created with `stepOrder = 2`.
5. Call `finition:addToFinalStock` with `sourceType = 'finition_step'`, step 2's id, `quantity = 5`.
6. Step 2 is now `isReady = true`; step 1 remains `isReady = false`.
7. Call `qc:getKpis` → `readyForStock` increased by 5.

**Expected**: Two step records; final stock entry for 5 pieces; step 2 marked ready.

---

## Scenario 4 — Validation: Grade sum mismatch

**Steps**:
1. Call `qc:create` with `quantityReviewed = 10`, `qtyDamaged = 3`, `qtyAcceptable = 3`, `qtyGood = 3`, `qtyVeryGood = 3` (sum = 12 ≠ 10).
2. Expect `{ success: false, error: "مجموع الدرجات لا يساوي الكمية المراجعة" }`.

---

## Scenario 5 — Validation: Finition exceeds available

**Steps**:
1. QC record has `finitionableRemaining = 3`.
2. Call `finition:create` with `quantity = 5`.
3. Expect `{ success: false, error: "الكمية تتجاوز الكمية القابلة للتشطيب" }`.

---

## Scenario 6 — KPI consistency check

After running Scenarios 1–3:

| KPI | Expected value |
|-----|---------------|
| pendingQc | 0 (all 20 pieces reviewed) |
| totalReviewed | 20 |
| totalDamaged | 2 (from session 1) + session 2 damaged count |
| finitionPending | 3 (session 1 remaining) + session 2 finitionable |
| readyForStock | 7 + 5 = 12 |
