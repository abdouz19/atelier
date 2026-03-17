# Quickstart: Analytics Dashboard

**Feature**: 011-analytics-dashboard | **Date**: 2026-03-17

Manual QA scenarios to validate the dashboard after implementation. Run `npm run dev:electron` and navigate to the Dashboard from the sidebar before running these scenarios.

---

## Prerequisites

Ensure the database has seed data covering:
- At least 2 fabric items in `stock_items` (unit = 'متر') with inbound transactions
- At least 3 non-fabric stock items, at least 1 with quantity = 0
- Cutting pieces at multiple pipeline stages (some not_distributed, some distributed)
- At least 2 distribution batches with returns, QC records, finition records
- At least 1 entry in `final_stock_entries`
- At least 2 employees with positive balance (operations > payments)
- At least 2 stock inbound transactions this month with `total_price_paid` set
- Operations spanning at least 2 calendar months

---

## Scenario 1 — KPI Cards Load on Page Open

**Goal**: Verify all snapshot and period KPIs show real values within 3 seconds.

1. Open the app. Verify the Dashboard is the first screen shown.
2. Observe the 10 KPI cards at the top. All should have numeric values (not loading spinners) within 3 seconds.
3. Verify fabric KPI cards match: `SELECT SUM(CASE WHEN st.type='inbound' THEN st.quantity ELSE -st.quantity END) FROM stock_transactions st JOIN stock_items si ON si.id = st.stock_item_id WHERE si.unit = 'متر' GROUP BY si.id`
4. Verify zero-stock count matches: `SELECT COUNT(*) FROM stock_items WHERE unit != 'متر'` (and available qty = 0).
5. Verify purchases KPI shows current month total.

**Expected**: All 10 KPI cards show values. Zero loading errors in the console.

---

## Scenario 2 — Pipeline Widget Navigation

**Goal**: Verify 6 pipeline stages render correctly and each is clickable.

1. On the Dashboard, locate the Production Pipeline Widget.
2. Verify exactly 6 stages appear in order: غير موزعة → في التوزيع → مُعادة — بانتظار مراقبة → جاهزة للتشطيب → في التشطيب → المخزون النهائي.
3. Verify stage counts match direct DB queries for each stage (see research.md for queries).
4. Click each stage and verify navigation to the correct screen:
   - Stage 1 → Cutting/Distribution screen
   - Stages 2–3 → Distribution screen
   - Stages 4–5 → QC screen
   - Stage 6 → Final Stock screen
5. Use browser back (Electron history) to return to Dashboard after each click.

**Expected**: Correct navigation for all 6 stages. A stage with 0 pieces still renders with count = 0.

---

## Scenario 3 — Charts Render with Default Filters

**Goal**: Verify all 6 charts render with the default (current month, all models) filter.

1. On the Dashboard, scroll to the charts section.
2. Verify each chart renders:
   - Monthly production bar chart (up to 12 bars)
   - Pipeline donut chart (6 segments)
   - Top 5 tailors horizontal bar (up to 5 bars)
   - Top 5 models horizontal bar (up to 5 bars)
   - Fabric consumption line chart (one line per fabric, up to 6 months)
   - Employee debt bar chart (only employees with positive balance)
3. Hover over a bar/slice — verify a tooltip appears with the correct value.

**Expected**: All 6 charts visible with data. No empty charts unless the underlying data is genuinely absent.

---

## Scenario 4 — Date Range Filter Affects Period KPIs and Charts

**Goal**: Verify that changing the date range updates only period-scoped data.

1. Note the current purchases KPI value.
2. Change the `from` date to a past month with known data. Verify:
   - Purchases KPI updates to reflect the new range.
   - Monthly production chart updates (if data exists in that range).
   - Top tailors chart updates.
   - Fabric consumption chart updates.
3. Verify these are NOT affected by the date range change:
   - Snapshot KPIs (pieces not distributed, pieces in distribution, etc.)
   - Pipeline widget counts
   - Top models chart
   - Employee debt chart
4. Change the range back to the current month. Verify values return to their original state.

**Expected**: Period-scoped data updates within 2 seconds. Snapshot data unchanged throughout.

---

## Scenario 5 — Model Filter Scopes Monthly Production and Top Tailors

**Goal**: Verify that the model filter narrows chart data for model-scoped charts.

1. Select a specific model from the model filter dropdown.
2. Verify the monthly production chart updates to show only pieces of that model.
3. Verify the top tailors chart updates to show only tailors who returned pieces of that model.
4. Verify the following are NOT affected:
   - Top models chart (always all models)
   - Fabric consumption chart
   - Employee debt chart
   - All snapshot KPIs and pipeline widget
5. Clear the model filter (select "all models"). Verify charts revert to showing all models.

**Expected**: Only model-scoped charts update. No page reload occurs during filter changes.

---

## Scenario 6 — Activity Feed Shows Recent Operations

**Goal**: Verify the activity feed shows the last 20 operations in reverse chronological order.

1. On the Dashboard, scroll to the Activity Feed.
2. Verify entries are ordered newest first.
3. Verify each entry shows: Arabic operation type label, model name (when applicable), and date.
4. Verify at most 20 entries are shown.
5. Click a cutting session entry — verify navigation to the cutting screen.
6. Click a QC record entry — verify navigation to the QC screen.
7. Click a final stock entry — verify navigation to the Final Stock screen.

**Expected**: Feed shows correct entries in correct order. All links navigate to valid destinations.

---

## Scenario 7 — Empty States

**Goal**: Verify graceful handling of empty data scenarios.

1. If no employees have a positive balance: The employee debt chart shows an empty state message (e.g., لا توجد بيانات).
2. If no fabric items exist: The fabric KPI section shows an empty state (no error).
3. If no tailors have returns in the selected date range: Top tailors chart shows empty state (not an error).
4. If the selected date range has no data: Charts show empty state; KPIs show 0. No crash or error dialog.
5. Set the date range to a future month (no data expected). Verify all period-scoped items show 0 or empty — no error.

**Expected**: No crashes, no error dialogs. Appropriate Arabic empty state messages are shown.

---

## Scenario 8 — Clickable KPI Cards Navigate Correctly

**Goal**: Verify the 3 clickable KPI cards navigate to the correct screens.

1. Click the employee debt KPI card. Verify navigation to the Employees screen.
2. Return to Dashboard. Click the purchases KPI card. Verify navigation to the Suppliers screen.
3. Return to Dashboard. Click the zero-stock KPI card. Verify navigation to the Stock screen showing only non-fabric items with quantity = 0.

**Expected**: All 3 navigate correctly. The zero-stock navigation pre-filters the stock screen to zero-quantity items.
