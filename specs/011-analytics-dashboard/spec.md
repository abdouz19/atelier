# Feature Specification: Analytics Dashboard

**Feature Branch**: `011-analytics-dashboard`
**Created**: 2026-03-17
**Status**: Draft
**Input**: User description: "Dashboard — KPI cards, pipeline widget, charts, activity feed, filters"

## Clarifications

### Session 2026-03-17

- Q: How is "low quantity" defined for non-fabric stock items — zero only, per-item threshold, or global threshold? → A: Zero only — count only items where available quantity = 0
- Q: How should employee debt KPI and debt chart handle negative balances (overpaid employees)? → A: Exclude from chart and KPI; sum of positive balances only (negatives treated as 0)

## User Scenarios & Testing *(mandatory)*

### User Story 1 — At-a-Glance KPI Overview (Priority: P1)

A manager opens the app and lands on the Dashboard. Without navigating anywhere, they immediately see 10 KPI cards giving them a complete snapshot of the business: how much fabric is in stock, how many pieces are at each production stage, total employee debt, and this month's purchases. Three of these cards are clickable and take the manager to the relevant screen with appropriate context pre-applied.

**Why this priority**: The KPI cards are the core value of the dashboard — the reason a manager opens the app first thing. Without them, the dashboard has no value.

**Independent Test**: Navigate to the Dashboard. Verify all KPI cards appear with real values. Click the employee debt card — verify navigation to the Employees screen. Click the purchases card — verify navigation to the Suppliers screen. Click the zero-stock card — verify navigation to the Stock screen filtered to zero-quantity items.

**Acceptance Scenarios**:

1. **Given** the manager has just logged in, **When** the Dashboard loads, **Then** all KPI cards are visible with real computed values within 3 seconds
2. **Given** the KPI cards are visible, **When** the manager reads the total debt card, **Then** the value equals the sum of all current balances owed to all employees
3. **Given** the KPI cards are visible, **When** the manager clicks the total employee debt card, **Then** the app navigates to the Employees screen
4. **Given** the KPI cards are visible, **When** the manager clicks the purchases-this-month card, **Then** the app navigates to the Suppliers screen
5. **Given** there are non-fabric stock items with quantity = 0, **When** the manager clicks the zero-stock count card, **Then** the app navigates to the Stock screen showing only items with quantity = 0
6. **Given** the date range filter is set to a specific month, **When** the manager reads the purchases KPI, **Then** the value reflects total purchases within that date range

---

### User Story 2 — Production Pipeline Widget (Priority: P2)

The manager wants a quick visual representation of how pieces flow through the production pipeline. A step-by-step widget shows the count of pieces at each stage: not distributed → in distribution → returned → in QC → in finition → in final stock. Each stage is labeled and clicking it navigates to the corresponding screen.

**Why this priority**: The pipeline gives the manager an immediate sense of where bottlenecks are occurring. It builds on the KPI data from P1 and adds spatial flow context.

**Independent Test**: With pieces at multiple pipeline stages in the database, verify the pipeline widget shows correct counts at each of the 6 stages. Click each stage — verify navigation to the correct screen.

**Acceptance Scenarios**:

1. **Given** the pipeline widget is visible, **When** the manager reads it left to right, **Then** 6 stages appear in order: not distributed, in distribution, returned (awaiting QC), in QC review, in finition, in final stock — each with a piece count
2. **Given** a stage has 0 pieces, **When** the pipeline renders, **Then** the stage still appears with a count of 0 (no stage is hidden)
3. **Given** the pipeline widget is visible, **When** the manager clicks the "in QC" stage, **Then** the app navigates to the QC screen
4. **Given** the pipeline widget is visible, **When** the manager clicks the "in finition" stage, **Then** the app navigates to the QC/Finition screen
5. **Given** the pipeline widget is visible, **When** the manager clicks the "in final stock" stage, **Then** the app navigates to the Final Stock screen

---

### User Story 3 — Charts and Analytics (Priority: P3)

The manager wants to understand trends and patterns over time. Six charts provide different analytical views: monthly production volume, current pipeline breakdown, top tailors by returns, top models in stock, fabric consumption trends, and employee debt comparison.

**Why this priority**: Charts provide the "why" behind the KPI numbers. They require the P1 data foundation and add trend context. Can be omitted from an MVP without losing core operational value.

**Independent Test**: With at least 3 months of data in the database, verify all 6 charts render with correct data. Apply the date range filter — verify time-series charts update. Apply a model filter — verify model-scoped charts update.

**Acceptance Scenarios**:

1. **Given** the charts section is visible, **When** the manager views the monthly production bar chart, **Then** it shows up to 12 months of data with the count of pieces that reached final stock each month
2. **Given** the charts section is visible, **When** the manager views the pipeline donut chart, **Then** the total across all segments equals the total pieces currently active in the pipeline
3. **Given** the charts section is visible, **When** the manager views the top tailors chart, **Then** it shows at most 5 tailors ranked by pieces returned in the active date range, with names and quantities
4. **Given** the charts section is visible, **When** the manager views the top models chart, **Then** it shows at most 5 models ranked by pieces currently in final stock
5. **Given** the charts section is visible, **When** the manager views the fabric consumption line chart, **Then** it shows up to 6 months of data with one line per fabric item showing meters consumed per month
6. **Given** the charts section is visible, **When** the manager views the employee debt chart, **Then** only employees with a positive balance owed are shown, sorted in descending order of amount

---

### User Story 4 — Activity Feed (Priority: P4)

The manager wants to see what has happened recently across the entire app. The activity feed shows the last 20 operations in reverse chronological order: cutting sessions, distributions, returns, QC records, finition records, and final stock additions. Each entry is clickable and navigates to the source record.

**Why this priority**: The activity feed provides operational awareness and audit capability. Valuable but not blocking — the dashboard functions without it.

**Independent Test**: With at least 5 recent operations across different types, verify the feed shows entries in reverse chronological order. Click each type and verify navigation to the correct source record.

**Acceptance Scenarios**:

1. **Given** the activity feed is visible, **When** the manager reads it, **Then** at most 20 entries are shown in reverse chronological order (newest first)
2. **Given** the activity feed has entries, **When** the manager reads an entry, **Then** each entry shows: operation type label (in Arabic), model name when applicable, and date
3. **Given** the activity feed shows a cutting session entry, **When** the manager clicks it, **Then** the app navigates to that cutting session detail
4. **Given** the activity feed shows a QC record entry, **When** the manager clicks it, **Then** the app navigates to the QC screen with that record
5. **Given** the activity feed shows a final stock addition entry, **When** the manager clicks it, **Then** the app navigates to the Final Stock screen
6. **Given** there are fewer than 20 recent operations total, **When** the feed loads, **Then** only the available entries are shown with no empty placeholder rows

---

### User Story 5 — Date Range and Model Filters (Priority: P5)

The manager wants to scope the dashboard to a specific time period or model. A date range picker and a model dropdown at the top of the screen affect all charts and period-based KPIs simultaneously. The default is the current calendar month with all models.

**Why this priority**: Filters enhance analysis but the dashboard is fully functional with the default view. All other stories work without this one.

**Independent Test**: With data spanning at least 3 months, set the date range to a past month. Verify charts and period KPIs update. Select a specific model — verify model-scoped charts update. Verify snapshot KPIs are not affected.

**Acceptance Scenarios**:

1. **Given** the dashboard loads, **When** the manager checks the date filter, **Then** it defaults to the first and last day of the current calendar month
2. **Given** the manager changes the date range to a past month, **When** the page updates, **Then** the monthly production chart, top tailors chart, fabric consumption chart, and purchases KPI all reflect data within that date range only
3. **Given** the manager selects a model from the model filter, **When** the page updates, **Then** the top models chart and monthly production chart show data for only that model
4. **Given** both filters are active, **When** the manager clears both, **Then** all charts and KPIs revert to current-month / all-models defaults
5. **Given** snapshot KPIs (pieces in distribution, pieces in QC, etc.) are visible, **When** the date range is changed, **Then** these KPIs are NOT affected — they always reflect the current database state

---

### Edge Cases

- What happens when all pipeline stages have 0 pieces? All 6 stages still render with 0 counts — no stage is hidden or collapsed.
- What if there are no operations in the last 20 records? The activity feed shows an empty state message (لا توجد عمليات حديثة).
- What if there are fewer than 5 tailors with returns this month? The top tailors chart shows only the available tailors (1–4 entries) rather than padding with empty rows.
- What if no fabric items exist in stock? The fabric KPI section and fabric consumption chart show empty states (no error).
- What if the selected date range has no matching data? Charts show empty/zero state; no crash or error message is shown.
- What if a manager navigates to the Dashboard from another screen? The Dashboard reloads fresh data; filters reset to defaults.
- What if all employees have zero or negative balance? The employee debt chart shows an empty state (no employees with positive balance to display).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Dashboard MUST be the first screen shown after successful login and MUST be accessible from the main sidebar navigation
- **FR-002**: All values displayed on the Dashboard MUST be computed in real-time from the database at load time — no static, cached, or manually entered values are permitted
- **FR-003**: The Dashboard MUST display the following snapshot KPI cards (always reflecting current live state, never scoped by the date range filter): (a) total meters of each fabric item currently in stock — one value per fabric item; (b) count of non-fabric stock items with quantity = 0; (c) total pieces not yet assigned to any tailor (not distributed); (d) total pieces currently in active distribution with tailors (sent, not yet returned); (e) total pieces returned and awaiting QC review; (f) total pieces currently undergoing finition; (g) total pieces currently in final stock; (h) count of active tailors who have at least one pending (unreturned) distribution
- **FR-004**: The Dashboard MUST display the following period-scoped KPI cards (affected by the date range filter): (a) total amount owed across all employees — computed as the sum of positive individual balances only (employees with zero or negative balance contribute 0 to this total); (b) total purchase amount recorded within the active date range
- **FR-005**: The zero-stock KPI card (FR-003b) MUST be clickable and navigate to the Stock screen pre-filtered to show only non-fabric items with quantity = 0
- **FR-006**: The total employee debt KPI card (FR-004a) MUST be clickable and navigate to the Employees screen
- **FR-007**: The purchases KPI card (FR-004b) MUST be clickable and navigate to the Suppliers screen
- **FR-008**: The Dashboard MUST display a Production Pipeline Widget showing piece counts at exactly 6 stages in sequential order: (1) not distributed, (2) in distribution, (3) returned awaiting QC, (4) in QC review, (5) in finition, (6) in final stock
- **FR-009**: Each stage in the Pipeline Widget MUST be clickable: stage 1 navigates to the Cutting/Distribution screen, stage 2 and 3 navigate to the Distribution screen, stage 4 and 5 navigate to the QC screen, stage 6 navigates to the Final Stock screen
- **FR-010**: The Dashboard MUST display the following six charts: (a) Monthly production bar chart — count of pieces reaching final stock per month for the last 12 months; (b) Pipeline distribution donut chart — current piece counts across all 6 pipeline stages; (c) Top 5 tailors horizontal bar chart — tailors ranked by pieces returned within the active date range; (d) Top 5 models horizontal bar chart — models ranked by total pieces currently in final stock; (e) Fabric consumption line chart — meters consumed per month per fabric for the last 6 months, one line per fabric; (f) Employee debt bar chart — employees with a positive balance owed, sorted descending by amount; employees with zero or negative balance are excluded
- **FR-011**: The Dashboard MUST display an Activity Feed showing the last 20 operations across the entire system in reverse chronological order, covering: cutting sessions created, distributions sent, returns received, QC records created, finition records created, and pieces added to final stock
- **FR-012**: Each activity feed entry MUST show: operation type label in Arabic, model name when applicable, and date; each entry MUST be clickable and navigate to its source record
- **FR-013**: The Dashboard MUST provide a date range filter (default: first to last day of the current calendar month) that scopes all period-based KPIs (FR-004) and time-series charts (monthly production, top tailors, fabric consumption); snapshot KPIs (FR-003) and the pipeline widget (FR-008) are NOT affected by this filter
- **FR-014**: The Dashboard MUST provide a model filter (default: all models, populated from the managed models list) that scopes the monthly production chart and top tailors chart to the selected model; snapshot KPIs and the pipeline widget are NOT affected by this filter
- **FR-015**: When any filter changes, all affected charts and KPIs MUST update without requiring a full page reload

### Key Entities

- **DashboardKpis** (derived): All snapshot and period-scoped KPI values, computed on demand from the underlying production tables — not persisted
- **PipelineStage** (derived): Label and piece count for one of the 6 production stages — computed by querying the appropriate source tables
- **ChartDataPoint** (derived): A (label, value) pair for chart rendering — derived from historical records grouped by time period or category
- **ActivityEntry** (derived): A single recent operation event sourced from cutting sessions, distribution batches, return records, QC records, finition records, or final stock entries; carries: source type, source record ID, model name, and date

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Dashboard loads and displays all KPI cards and the pipeline widget within 3 seconds of navigation, on a dataset spanning 12 months of production activity
- **SC-002**: All KPI and pipeline values exactly match the results of the equivalent direct database queries — zero tolerance for data discrepancy
- **SC-003**: A manager can identify the count of pieces stuck at any pipeline stage and navigate to the corresponding screen in 2 interactions or fewer from the Dashboard
- **SC-004**: Applying the date range or model filter updates all affected charts and KPIs within 2 seconds without a page reload
- **SC-005**: 100% of activity feed entries and pipeline stage buttons navigate to a valid destination — no broken links
- **SC-006**: The Dashboard remains fully functional (no blank screens or errors) when any data category is empty (e.g., no fabric items, no finition records, no activity in the selected date range)

## Assumptions

- "Total debt owed to employees" means the sum of all outstanding balances: total operation costs minus total payments received, across all employees; employees with zero or negative balance are excluded from the debt chart
- "Total purchases this month" refers to the total value of stock inbound transactions (supplier purchases) recorded within the active date range
- The zero-stock KPI card (FR-003b) counts only non-fabric items with available quantity = 0; no configurable threshold is needed
- Snapshot KPIs (FR-003) always reflect the live current state of the database and are never scoped to a date range
- The Activity Feed does not paginate — exactly the last 20 operations are shown; no "load more" control is required
- The model filter applies to charts that have a model dimension; it does not scope KPI cards or the pipeline widget
- Navigation from clickable KPI cards, pipeline stages, and activity entries uses the same routing as existing sidebar navigation
- All authenticated users who can access the sidebar can view the full Dashboard with no additional role restrictions
- The word "custostock" in the feature description is interpreted as "final stock" (المخزون النهائي)
- Fabric stock KPI values show the current available meters per fabric item; if many fabric items exist, they are grouped or displayed in a compact sub-section
- Charts use the most recently available data; the monthly production chart shows the last 12 calendar months relative to today, and the fabric consumption chart shows the last 6 calendar months relative to today
