# Quickstart: Final Stock Screen

**Feature**: 010-final-stock-screen | **Date**: 2026-03-17

## Prerequisites

The app must have existing `final_stock_entries` rows (created via the QC & Finition flow). If starting fresh, add at least 2–3 entries via the Finition → Add to Final Stock action before testing this screen.

---

## Scenario 1 — Screen loads with correct KPI values

1. Open the app and navigate to **المخزون النهائي** in the sidebar
2. **Verify**: Three KPI cards appear at the top
3. **Verify**: "إجمالي القطع في المخزون" matches `SELECT SUM(quantity) FROM final_stock_entries`
4. **Verify**: "عدد الموديلات المختلفة" matches `SELECT COUNT(DISTINCT model_name) FROM final_stock_entries`
5. **Verify**: "تركيبات المقاس/اللون" matches `SELECT COUNT(DISTINCT size_label || '|' || color) FROM final_stock_entries`
6. **Verify**: The table shows all grouped rows (one row per unique model+part+size+color)

---

## Scenario 2 — Filter by model

1. From the Final Stock screen with multiple models in the table
2. Select a model from the **model dropdown** (e.g., "حجاب")
3. **Verify**: Only rows with `modelName = "حجاب"` remain visible
4. **Verify**: The size and color dropdowns are unaffected (still show all options)
5. **Verify**: KPI cards remain unchanged (KPIs always show totals across all data)
6. Select the empty option ("جميع الموديلات") to clear the filter
7. **Verify**: All rows return

---

## Scenario 3 — Combined model + size + color filter

1. Select model "حجاب", size "S", and color "أبيض"
2. **Verify**: Only rows matching all three criteria are shown
3. **Verify**: Empty state "لا توجد نتائج" appears if no rows match the combination
4. Clear all three filters
5. **Verify**: All rows are restored

---

## Scenario 4 — Zero-quantity row is visible but flagged

*(Requires a row where the computed SUM equals 0 — this can occur if entries exist but were manually zeroed in SQLite for testing)*

1. If a row with `currentQuantity = 0` exists in the table
2. **Verify**: The row is visible in the table
3. **Verify**: The row is visually muted (reduced opacity) compared to positive-quantity rows
4. **Verify**: The quantity badge shows a red/muted style instead of green

---

## Scenario 5 — Click a row to see addition history

1. Click any row in the Final Stock table (e.g., model "حجاب", size "S", color "أبيض")
2. **Verify**: A history panel appears below the table
3. **Verify**: The panel header shows: model · part (or nothing if null) · size · color
4. **Verify**: Each history entry shows: source type label (تشطيب / خطوة مخصصة), date, and quantity added
5. **Verify**: The quantity shown in each entry sums to the row's `currentQuantity`
6. Click the **✕** button
7. **Verify**: The history panel closes

---

## Scenario 6 — Navigate to source record from history

1. Open the history panel for a row that has at least one `finition` source entry
2. Click one of the history entries
3. **Verify**: The app navigates to `/qc?id={sourceId}` and the corresponding finition record is visible
4. Navigate back to المخزون النهائي
5. **Verify**: The screen reloads correctly

---

## Scenario 7 — Empty state (no final stock entries)

1. Test with a fresh database (or temporarily with no `final_stock_entries` rows)
2. Navigate to المخزون النهائي
3. **Verify**: KPI cards show 0 for all values
4. **Verify**: Table body shows the empty state message "لا توجد نتائج"
5. **Verify**: Filter dropdowns are still visible (not hidden)

---

## Scenario 8 — Null part is a distinct bucket

1. Ensure there are two entries in `final_stock_entries` with the same model/size/color but different `part_name` values:
   - Entry A: `model='حجاب', part_name=NULL, size='S', color='أبيض', quantity=3`
   - Entry B: `model='حجاب', part_name='الضهر', size='S', color='أبيض', quantity=2`
2. Navigate to المخزون النهائي
3. **Verify**: Two separate rows appear — one with part "—" (quantity 3) and one with part "الضهر" (quantity 2)
4. **Verify**: They are NOT merged into a single row with quantity 5
