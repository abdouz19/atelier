# Quickstart: Distribution & Dashboard Pieces Availability Enhancement

**Feature**: 012-pieces-availability | **Date**: 2026-03-17

Run `npm run dev:electron` before executing these scenarios. Ensure the database has cutting pieces at multiple stages.

---

## Prerequisites

- At least 2 models with cut pieces in various (part, size, color) combinations
- At least 1 combination with zero not-distributed pieces (all distributed or returned)
- At least 1 combination with exactly 3 not-distributed pieces (to test low threshold)
- At least 1 tailor active in the system
- At least 2 months of distribution history (for chart series)

---

## Scenario 1 — Distribution Modal: Availability Table Replaces Dropdowns

**Goal**: Verify that selecting a model in the Distribute modal shows an availability table instead of size/color dropdowns.

1. Navigate to the Distribution screen.
2. Click the "توزيع" (Distribute) button.
3. Select a model that has cut pieces.
4. Verify: the size and color dropdown fields are gone; instead a table appears showing columns: part, size, color, available count.
5. Verify a row with zero available pieces is shown but greyed out / non-clickable.
6. Click a row with > 0 available pieces.
7. Verify: a quantity field appears showing the available count as the maximum.
8. Enter a quantity ≤ the available count and complete the distribution.
9. Verify: the distribution batch is created successfully (appears in tailor's detail view).

**Expected**: Table-based selection works end-to-end; zero-count rows are visible but disabled.

---

## Scenario 2 — Distribution Modal: Quantity Constraint

**Goal**: Verify the quantity field enforces the maximum from the selected combination.

1. Open the Distribute modal and select a model.
2. Click a combination row showing available count = 3.
3. Try entering quantity = 5.
4. Verify: the form shows a validation error (quantity cannot exceed available count) or the input is capped at 3.
5. Enter quantity = 2 and submit.
6. Reopen the Distribute modal, select the same model — verify the same combination now shows available count = 1.

**Expected**: Quantity is strictly bounded by the combination's not-distributed count.

---

## Scenario 3 — Pieces Availability Tab

**Goal**: Verify the Pieces Availability tab shows the full breakdown with correct counts.

1. Navigate to the Distribution screen.
2. Click the "توافر القطع" tab (or navigate to `?tab=availability`).
3. Verify the table loads with columns: model, part, size, color, total produced, not distributed, in distribution, returned.
4. Verify row counts match direct database queries for each combination.
5. Apply the model filter — verify only rows for that model appear.
6. Apply the size filter on top — verify the table narrows further.
7. Clear filters — verify all rows return.

**Expected**: Availability tab loads within 3 seconds with accurate counts.

---

## Scenario 4 — Red and Amber Flagging

**Goal**: Verify flagging colors appear correctly based on the low-stock threshold.

1. Open the Pieces Availability tab.
2. Note the current threshold value in the threshold input (default: 5).
3. Verify: any combination with 0 not-distributed pieces has a red background row.
4. Verify: any combination with 1–5 not-distributed pieces has an amber background row.
5. Change the threshold to 10 and save (input should save immediately).
6. Verify: combinations with 6–10 not-distributed pieces are now amber.
7. Change threshold back to 5.

**Expected**: Flagging updates immediately after threshold change without page reload.

---

## Scenario 5 — Re-cut Action on Flagged Rows

**Goal**: Verify the "قطع مرة أخرى" button opens the cutting session modal with pre-filled fields.

1. Open the Pieces Availability tab.
2. Locate a red or amber flagged row.
3. Click the "قطع مرة أخرى" button on that row.
4. Verify: the cutting session creation modal (or cutting screen) opens with the model name and color pre-filled.
5. Verify: the manager can still change part and size freely in the cutting session form.

**Expected**: Button appears only on flagged rows; model + color are pre-filled.

---

## Scenario 6 — Dashboard KPI Cards (Zero and Low Stock)

**Goal**: Verify the two new KPI cards appear with correct counts.

1. Navigate to the Dashboard.
2. Locate the two new KPI cards: "تركيبات بدون مخزون" (zero combinations) and "تركيبات بمخزون منخفض" (low combinations).
3. Verify the zero-stock count matches: count of (model+part+size+color) combinations where not_distributed = 0.
4. Verify the low-stock count matches: combinations where 0 < not_distributed ≤ 5 (default threshold).
5. Change the threshold in the Pieces Availability screen to 10, return to Dashboard, refresh.
6. Verify the low-stock KPI count has updated to reflect the new threshold.

**Expected**: Both cards show accurate counts. Threshold change affects the low-stock card.

---

## Scenario 7 — Dashboard Pieces Availability Widget

**Goal**: Verify the top-10 critical combinations widget is visible and navigates correctly.

1. Navigate to the Dashboard.
2. Locate the Pieces Availability summary widget.
3. Verify: at most 10 rows are shown, sorted by not-distributed count ascending (zero rows first).
4. Verify each row shows model, part, size, color, and not-distributed count.
5. Click a row — verify navigation to the Pieces Availability tab in the Distribution screen.

**Expected**: Widget renders within 3 seconds; navigation works.

---

## Scenario 8 — Monthly Production Chart: Two Series

**Goal**: Verify the monthly production bar chart shows both produced and distributed series.

1. Navigate to the Dashboard.
2. Locate the monthly production bar chart.
3. Verify: each month has two bars (or grouped bars) — one for pieces reaching final stock, one for pieces distributed.
4. Verify the chart legend identifies both series.
5. Hover over a bar — verify the tooltip shows the correct value for that series.
6. Apply the model filter — verify both series update to show only that model's data.

**Expected**: Both series visible with correct labels; filter affects both series.
