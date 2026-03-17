# Feature Specification: Distribution & Dashboard Pieces Availability Enhancement

**Feature Branch**: `012-pieces-availability`
**Created**: 2026-03-17
**Status**: Draft
**Input**: User description: "Distribution & Dashboard Pieces Availability Enhancement"

## Clarifications

### Session 2026-03-17

- Q: Where is the low-stock threshold setting accessible — within the Distribution/Pieces Availability screen itself, or in a separate app-level Settings screen? → A: Inline within the Pieces Availability screen — a small numeric input in the filter bar area, saved immediately on change; no new Settings screen required

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Smart Distribution Modal with Availability Table (Priority: P1)

A manager opens the Distribute modal to assign pieces to a tailor. Instead of manually selecting size and color from separate dropdowns (which gives no indication of how many pieces are actually available), the modal now shows a table of all valid part+size+color combinations for the chosen model, with the exact count of not-distributed pieces for each. The manager selects a row, and a quantity field appears pre-validated against the available count for that exact combination.

**Why this priority**: The distribution flow is a core daily operation. The current design forces the manager to guess which sizes and colors have pieces ready — the new table makes that information immediately visible and eliminates invalid selections (e.g., trying to distribute a size/color with no ready pieces). This is the highest-value change and improves data integrity by preventing over-distribution.

**Independent Test**: Open the Distribute modal for a model that has pieces in multiple part+size+color combinations. Verify the availability table renders with correct not-distributed counts. Select a row, enter a quantity, and complete a distribution. Verify the batch is created with the correct combination.

**Acceptance Scenarios**:

1. **Given** the manager opens the Distribute modal and selects a model, **When** the model is selected, **Then** the size and color dropdowns are replaced by an availability table listing all part+size+color combinations for that model, each with its current not-distributed piece count
2. **Given** the availability table is visible, **When** a combination has zero not-distributed pieces, **Then** the row is shown but visually disabled and cannot be selected
3. **Given** the availability table is visible, **When** the manager clicks a row with available pieces, **Then** a quantity field appears showing the available count as a maximum, and the quantity input is constrained to values between 1 and that maximum
4. **Given** the manager has selected a combination and entered a valid quantity, **When** the distribution is submitted, **Then** a distribution batch is created for the correct model, part, size, and color combination
5. **Given** the manager selects a model with no available not-distributed pieces in any combination, **When** the availability table renders, **Then** all rows appear disabled and a message indicates no pieces are ready for distribution

---

### User Story 2 — Pieces Availability Screen (Priority: P2)

A manager wants a comprehensive view of the entire piece inventory broken down by model, part, size, and color. A dedicated Pieces Availability screen shows every distinct combination with counts at each production stage: total produced, in distribution, returned, in QC, in finition, in final stock, and not distributed. This screen is accessible as a tab or section within the Distribution screen. Flagging by color (red for zero, amber for low) makes critical combinations immediately visible. A "قطع مرة أخرى" action on flagged rows allows the manager to trigger a new cutting session for that model and color directly from this view.

**Why this priority**: The availability screen gives the manager a full inventory picture that goes beyond the distribution modal. It enables proactive restocking decisions before pieces run out. The "re-cut" shortcut directly connects the inventory view to the production flow.

**Independent Test**: With data spanning multiple models, parts, sizes, and colors, open the Pieces Availability screen. Verify all combinations appear with correct stage counts. Apply a model filter — verify the list narrows. Verify that a combination with zero not-distributed pieces is flagged red and that clicking the "قطع مرة أخرى" button opens the cutting session modal with model and color pre-filled.

**Acceptance Scenarios**:

1. **Given** the manager opens the Pieces Availability screen, **When** the screen loads, **Then** all distinct model+part+size+color combinations are shown in a table with 7 count columns: total produced, distributed, returned, in QC, in finition, in final stock, not distributed
2. **Given** the availability table is visible, **When** the manager applies a model filter, **Then** only rows for that model are shown; applying part, size, or color filters narrows results further; clearing filters restores all rows
3. **Given** a combination has a not-distributed count of zero, **When** the screen renders, **Then** the row is highlighted in red to indicate a stockout
4. **Given** a combination has a not-distributed count greater than zero but below the configured low-stock threshold, **When** the screen renders, **Then** the row is highlighted in amber to indicate low stock
5. **Given** a row is flagged red or amber, **When** the manager clicks the "قطع مرة أخرى" button on that row, **Then** the cutting session creation modal opens with the model and color fields pre-filled
6. **Given** a combination has a not-distributed count above the low-stock threshold, **When** the screen renders, **Then** the row has no flag color and the "قطع مرة أخرى" button is not shown

---

### User Story 3 — Dashboard Pieces Availability KPIs and Widget (Priority: P3)

A manager opens the Dashboard and can immediately see how many piece combinations are at critical (zero) or low stock levels — without navigating away. Two new KPI cards summarize these counts. A compact summary widget lists the top 10 most critical combinations by not-distributed count, each row clickable to navigate to the full Pieces Availability screen. The monthly production bar chart gains a second data series showing pieces distributed per month, making the production-to-distribution gap visible over time.

**Why this priority**: The dashboard additions extend existing KPIs with pieces inventory signals. They rely on the Pieces Availability data defined in P2 and depend on the dashboard infrastructure from the existing analytics feature. They add real-time operational awareness without requiring the manager to navigate to the availability screen.

**Independent Test**: With at least 3 combinations at zero not-distributed and 2 at low levels, verify the two new KPI cards show correct counts. Verify the summary widget shows the top 10 critical rows. Click a row — verify navigation to the Pieces Availability screen. Verify the monthly production chart shows two bars per month (produced vs distributed).

**Acceptance Scenarios**:

1. **Given** the Dashboard is loaded, **When** the manager views the KPI cards, **Then** a "Zero Stock Combinations" card shows the count of distinct model+part+size+color combinations where not-distributed pieces = 0, and a "Low Stock Combinations" card shows the count where not-distributed pieces are below the configured threshold
2. **Given** the Dashboard is loaded, **When** the manager views the pieces availability summary widget, **Then** a compact table shows at most 10 rows representing the combinations with the lowest (or zero) not-distributed counts, sorted ascending by not-distributed count, showing model, part, size, color, and not-distributed quantity
3. **Given** the pieces availability summary widget is visible, **When** the manager clicks a row, **Then** the app navigates to the Pieces Availability screen
4. **Given** the monthly production bar chart is visible, **When** the manager views it, **Then** each month shows two bars: pieces that reached final stock (existing series) and pieces distributed (new series), with a legend distinguishing the two
5. **Given** there are no combinations at zero or low stock, **When** the Dashboard loads, **Then** both new KPI cards show 0 and the widget shows an empty state message

---

### User Story 4 — Low-Stock Threshold Configuration (Priority: P4)

A manager can define a numeric threshold for "low stock" that determines when piece combinations are flagged amber in the Pieces Availability screen and counted in the low-stock KPI card. This threshold is stored as a persistent setting accessible from the app's settings area. The default is 5 pieces.

**Why this priority**: Without a configurable threshold, the amber flagging and low-stock KPI would be meaningless or require hardcoded values. This setting is the foundation for the amber alerting in P2 and P3.

**Independent Test**: Navigate to the settings area, set the low-stock threshold to 10. Return to the Pieces Availability screen — verify combinations with 1–10 not-distributed pieces are now flagged amber. Change the threshold to 3 — verify only combinations with 1–3 not-distributed pieces are flagged amber.

**Acceptance Scenarios**:

1. **Given** the manager opens the settings area, **When** they view the pieces availability settings, **Then** a numeric input labeled with its purpose (low-stock threshold) is visible with the currently saved value
2. **Given** the manager changes the low-stock threshold and saves, **When** the Pieces Availability screen is next viewed, **Then** amber flagging applies to combinations whose not-distributed count is greater than 0 and less than or equal to the new threshold
3. **Given** the threshold has never been set, **When** the Pieces Availability screen loads for the first time, **Then** the default threshold of 5 is applied
4. **Given** the manager sets the threshold to 0, **When** the Pieces Availability screen loads, **Then** no amber rows are shown (only red rows for zero-stock combinations)

---

### Edge Cases

- What happens when a model has pieces in some part+size+color combinations but not others? The availability table shows all combinations that have ever been produced, including those with zero remaining; zero-quantity rows are disabled.
- What happens when the availability table for a model has more than 50 combinations? The table scrolls within the modal; no pagination is required.
- What if the manager selects a combination and the not-distributed count drops to zero between the table load and the distribution submit? The submission is rejected with an error message indicating no pieces remain for that combination.
- What if there are no pieces at all in the system (empty database)? The availability table shows an empty state; the Pieces Availability screen shows an empty state; the dashboard KPI cards show 0.
- What if a piece has a null or empty part name? It appears in the availability table grouped under a blank part label and is treated as a valid distinct combination.
- What if the low-stock threshold is set higher than the total produced for a combination? That combination appears amber (not red) if its not-distributed count is between 1 and threshold.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Distribution modal MUST replace the separate size and color selector fields with an availability table once a model is selected; the table shows all distinct part+size+color combinations for that model and their current not-distributed piece count
- **FR-002**: In the availability table, rows where the not-distributed count is zero MUST be visually disabled and non-selectable
- **FR-003**: Selecting a row in the availability table MUST reveal a quantity input field; the input MUST enforce a maximum equal to the not-distributed count for that combination and a minimum of 1
- **FR-004**: Completing a distribution from the modal MUST create a batch associated with the exact model, part, size, and color from the selected row
- **FR-005**: The app MUST provide a Pieces Availability screen accessible as a tab or section within the Distribution screen
- **FR-006**: The Pieces Availability screen MUST display all distinct model+part+size+color combinations with the following columns: total produced, total distributed, total returned, total in QC, total in finition, total in final stock, and total not distributed
- **FR-007**: The Pieces Availability screen MUST support independent filter controls for model, part, size, and color; filters must be combinable
- **FR-008**: Rows in the Pieces Availability screen where not-distributed count equals zero MUST be visually highlighted in red
- **FR-009**: Rows in the Pieces Availability screen where not-distributed count is greater than zero and less than or equal to the configured low-stock threshold MUST be visually highlighted in amber
- **FR-010**: Flagged rows (red or amber) in the Pieces Availability screen MUST display a "قطع مرة أخرى" action that opens the cutting session creation modal with model and color pre-filled
- **FR-011**: The Dashboard MUST display a "Zero Stock Combinations" KPI card showing the count of distinct model+part+size+color combinations where not-distributed pieces = 0
- **FR-012**: The Dashboard MUST display a "Low Stock Combinations" KPI card showing the count of distinct model+part+size+color combinations where not-distributed pieces are between 1 and the configured low-stock threshold (inclusive)
- **FR-013**: The Dashboard MUST display a pieces availability summary widget showing at most 10 combinations with the lowest not-distributed counts (zero first, then ascending), including model, part, size, color, and not-distributed quantity columns
- **FR-014**: Each row in the dashboard summary widget MUST be clickable and navigate to the Pieces Availability screen
- **FR-015**: The monthly production bar chart on the Dashboard MUST display a second data series showing total pieces distributed per calendar month alongside the existing final-stock series
- **FR-016**: The app MUST provide a setting allowing the manager to configure the low-stock threshold as a positive integer; the default value is 5; the setting MUST persist across sessions
- **FR-017**: The low-stock threshold setting MUST be presented as a numeric input inline within the Pieces Availability screen (adjacent to the filter controls); changes MUST take effect immediately without requiring navigation to a separate settings page; no new Settings screen is introduced by this feature

### Key Entities

- **PiecesCombination** (derived): A distinct grouping of model + part + size + color, with aggregate counts at each production stage — not persisted, computed from existing piece records on demand
- **LowStockThreshold** (setting): A single numeric value configured by the manager; applied globally to amber-flag combinations; persisted in app settings storage
- **DistributionBatch** (existing, extended): Gains explicit association with part name when created from the new availability-table selection flow

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A manager can open the Distribute modal, select a combination from the availability table, enter a quantity, and complete a distribution in 4 interactions or fewer — replacing the current multi-field workflow
- **SC-002**: The availability table in the Distribute modal loads within 2 seconds after the manager selects a model, displaying correct not-distributed counts
- **SC-003**: The Pieces Availability screen loads all combinations within 3 seconds on a dataset of 500+ distinct combinations
- **SC-004**: 100% of distribution submissions via the new modal correctly record the part, size, and color from the selected availability row — zero mismatches between selected combination and stored batch
- **SC-005**: The low-stock threshold setting takes effect immediately on the Pieces Availability screen after saving — no refresh required
- **SC-006**: The dashboard pieces availability widget and both new KPI cards reflect accurate counts within 3 seconds of page load

## Assumptions

- The "part" dimension in the availability table comes from the `part_name` field on cutting pieces (may be null for pieces cut before Feature 009 introduced parts); null part is treated as a distinct valid bucket labeled with a dash or blank
- The low-stock threshold is a single global value (not per-model or per-part); setting it to 0 disables amber flagging entirely
- The "قطع مرة أخرى" action pre-fills model and color only (as stated); the manager selects part and size in the cutting session modal as usual
- The Pieces Availability screen is read-only; no editing of piece records occurs here
- The monthly production chart's new "distributed" series counts pieces that entered a distribution batch in that calendar month (not returned pieces), sourced from `distribution_batches` or `distribution_piece_links`
- The dashboard summary widget always shows the 10 most critical combinations based on ascending not-distributed count, with zero-stock combinations ranked first; ties broken alphabetically by model name
- If the threshold setting UI is placed within the Distribution/Pieces Availability screen rather than a global settings page, it appears as a small inline control adjacent to the filter bar
