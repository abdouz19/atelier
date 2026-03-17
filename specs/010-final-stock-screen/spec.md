# Feature Specification: Final Stock Screen

**Feature Branch**: `010-final-stock-screen`
**Created**: 2026-03-17
**Status**: Draft
**Input**: User description: "Final Stock screen — KPIs, filterable table, detail history view"

## Clarifications

### Session 2026-03-17

- Q: When `part_name` is null/empty, should all entries with the same model+size+color (regardless of part) be grouped into one row, or is null treated as its own distinct "no part" bucket? → A: Null part is treated as a distinct "no part" bucket — entries with no part group separately from entries with a named part, even when model+size+color match.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Final Stock Overview with KPIs and Filterable Table (Priority: P1)

A warehouse manager opens the Final Stock screen from the sidebar to get an at-a-glance view of what is currently ready in final stock. The screen shows three KPI cards at the top (total pieces, total distinct models, total distinct size+color combinations), then a filterable table listing every model+part+size+color combination. The manager can filter by model, size, or color using dropdown selects to narrow the view. Rows with zero quantity are shown but visually distinguished so the manager knows what has been depleted.

**Why this priority**: This is the core value of the feature — providing immediate visibility into what is ready. Without this, the feature has no value.

**Independent Test**: Navigate to Final Stock in the sidebar. Verify KPI cards display correct totals. Verify table rows match all final stock entries grouped by model+part+size+color. Apply a model filter — only matching rows remain. Apply combined model+size filter — table narrows further. Confirm zero-quantity rows are visible but visually flagged.

**Acceptance Scenarios**:

1. **Given** there are final stock entries across multiple models and sizes, **When** the manager opens the Final Stock screen, **Then** three KPI cards are visible: total pieces in stock, total distinct models, total distinct size+color combinations
2. **Given** the table is loaded, **When** the manager selects a model from the model filter dropdown, **Then** only rows matching that model are shown; other filters are unaffected until changed
3. **Given** the table is loaded, **When** the manager selects model "حجاب", size "S", and color "أبيض", **Then** only the row(s) matching all three criteria are shown
4. **Given** a model+part+size+color combination has a current quantity of 0, **When** the table is loaded, **Then** the row is visible but visually distinguished from rows with positive quantity
5. **Given** filters are applied, **When** the manager clears all filters, **Then** all rows are restored

---

### User Story 2 — Addition History Detail View (Priority: P2)

A manager clicks a row in the Final Stock table to see the full history of how that specific model+part+size+color combination was built up over time. A detail view shows each individual addition: the source record type (finition or custom step), the quantity added, and the date. The manager can click any source entry to navigate to the corresponding finition or custom step record.

**Why this priority**: Traceability is the second key value — knowing where stock came from. Depends on P1 table being in place.

**Independent Test**: Click a row that has 2 or more addition history entries. Verify the detail view shows each entry with: source type, quantity added, and date. Click one source entry — verify navigation goes to the corresponding record.

**Acceptance Scenarios**:

1. **Given** a row is visible in the Final Stock table, **When** the manager clicks it, **Then** a detail view opens showing all addition history entries for that model+part+size+color combination
2. **Given** the detail view is open and shows 3 addition entries, **When** the manager reviews them, **Then** each entry shows: source type label (تشطيب or خطوة مخصصة), quantity added, and date of addition
3. **Given** the detail view shows an addition from a finition record, **When** the manager clicks that entry, **Then** the app navigates to the corresponding finition record
4. **Given** the detail view shows an addition from a custom step record, **When** the manager clicks that entry, **Then** the app navigates to the corresponding finition custom step
5. **Given** a model+part+size+color has only one addition in its history, **When** the detail view opens, **Then** exactly one entry is shown

---

### Edge Cases

- What happens when all filters are set but no rows match? Display an empty state message (لا توجد نتائج) without hiding the filter controls.
- What if the same finition record contributes to final stock twice (via two separate additions)? Each call creates a separate history entry — both are shown, and both are counted in the quantity total.
- What if the filter dropdowns contain no items (empty managed lists)? Dropdowns are shown but empty; no filter is applied and the table shows all rows.
- What happens when the Final Stock screen is opened for the first time with no entries? KPI cards show zero values; the table shows an empty state message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Final Stock screen MUST be accessible from the main sidebar navigation
- **FR-002**: The screen MUST display three KPI cards: (1) total pieces currently in final stock, (2) total count of distinct model names in stock, (3) total count of distinct size+color combinations in stock
- **FR-003**: KPI values MUST be computed from all final stock additions (finition and custom steps marked as ready) and are read-only — never manually editable
- **FR-004**: The screen MUST display a table where each row represents a unique model+part+size+color combination; `part_name` null (no part) is treated as a distinct bucket separate from any named part — entries with model X + no part + size S + color white form a different row from entries with model X + part "الضهر" + size S + color white; each row shows: model name, part name (displayed as "—" when absent), size label, color, current quantity, and last updated date
- **FR-005**: Current quantity per row MUST equal the sum of all quantities added to that exact model+part+size+color combination (where null part and named part are never merged) — it is never manually entered or edited
- **FR-006**: Rows with a current quantity of zero MUST still appear in the table but MUST be visually distinguished (muted style or warning indicator)
- **FR-007**: The table MUST provide three filter controls — model, size, and color — each populated from the same managed lookup lists used throughout the app
- **FR-008**: Filters MUST be combinable: selecting model + size + color simultaneously narrows the table to matching rows only
- **FR-009**: The screen MUST NOT offer any controls to add, subtract, or edit final stock quantities; all mutations come exclusively from the QC & Finition flow
- **FR-010**: Clicking a table row MUST open a detail view for that model+part+size+color combination showing the complete chronological history of additions
- **FR-011**: Each history entry in the detail view MUST display: source type (finition or custom step), quantity added in that addition, and the date of the addition
- **FR-012**: Each history entry in the detail view MUST be clickable and navigate to the source finition record or custom step record
- **FR-013**: Final stock entries MUST never be hard deleted; the screen always reflects the complete accumulated history

### Key Entities

- **FinalStockEntry**: A single addition event — linked to a source record (finition or custom step), carries model name, part name (optional), size label, color, quantity added, and entry date. Immutable once created.
- **FinalStockRow** (derived): A grouped view of all FinalStockEntries sharing the exact same model+part+size+color key — null part and named part are never merged even if all other fields match; shows aggregated current quantity and the most recent entry date.
- **ManagedLookup** (existing): Models, sizes, and colors from the managed lists — populate the filter dropdowns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Final Stock screen loads and displays the correct KPI values and full table within 2 seconds of navigation on a dataset of 500+ entries
- **SC-002**: 100% of final stock additions made through the QC & Finition flow are visible in the Final Stock table and addition history immediately in the same session, without requiring a manual refresh
- **SC-003**: Applying any combination of model, size, and color filters produces only exact matching rows — zero false positives in filter results
- **SC-004**: A manager can identify the source of any given stock quantity and navigate to the source record in 3 interactions or fewer from the Final Stock screen
- **SC-005**: No final stock quantity can be modified through this screen — all displayed values match the sum of addition records, and no edit controls are present

## Assumptions

- "Part" (قطعة) is an optional attribute on final stock entries — entries created before the parts feature was introduced may have a null part; those rows display "—" in the part column and form their own distinct bucket (null part ≠ any named part, even when model+size+color match)
- The detail view opens inline within the same page (e.g., a slide-in panel or row expansion) rather than navigating away from the table
- Filter dropdowns show only active (non-soft-deleted) items from managed lists; rows with a soft-deleted model/size/color name remain visible using the stored name string
- The "last updated date" on a table row is the date of the most recent addition entry for that model+part+size+color combination
- Navigation to source records (finition / custom step) uses the existing finition detail view; exact deep-linking behavior will be refined during planning
- All authenticated users who can access the sidebar can view the Final Stock screen; no additional role restriction beyond app-level authentication
