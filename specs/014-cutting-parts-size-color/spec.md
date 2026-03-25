# Feature Specification: Cutting & Distribution Data Model Enhancements

**Feature Branch**: `014-cutting-parts-size-color`
**Created**: 2026-03-22
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cutting Session Uses Lookup Models and Parts, with Size and Fabric Color (Priority: P1)

When a production manager records a cutting session, they select the model from the same centralized list used in settings (not free text), select a size from the sizes lookup, and the color is automatically taken from the chosen fabric item's color. The parts produced are also selected from the same parts list defined in settings for that model. Each part entry records: part name, size, color, and quantity cut.

**Why this priority**: This is the foundation of the entire production chain. Without accurate model/part/size/color data at the cutting stage, all downstream tracking (distribution, QC, final stock) is unreliable.

**Independent Test**: Open the cutting module, create a session, verify that model and parts dropdowns pull from settings, that color is auto-set from fabric selection, that size is required from the sizes lookup, and that the session saves with all attributes correctly.

**Acceptance Scenarios**:

1. **Given** models exist in settings, **When** the user opens the cutting session form, **Then** the model dropdown lists only models defined in settings (no free-text entry)
2. **Given** a fabric item with color "أزرق" is selected, **When** the user proceeds to the parts section, **Then** the color field is pre-filled with "أزرق" and is read-only
3. **Given** a model "كلاسيك" is selected, **When** the user adds parts, **Then** the parts dropdown shows only parts linked to "كلاسيك" from settings
4. **Given** valid parts are entered with quantities, **When** the session is saved, **Then** each part is stored with model name, size, color, part name, and count

---

### User Story 2 - Cutting Parts Accumulate by Model + Size + Color + Part (Priority: P1)

When the same (model, size, color, part) combination is cut across multiple sessions, the inventory counts accumulate rather than creating separate atomic records. A manager viewing the parts inventory panel sees one row per unique (model, size, color, part) combination with the total available count.

**Why this priority**: The business tracks total available parts in inventory, not per-session snapshots. Without accumulation, parts inventory counts are meaningless for production planning.

**Independent Test**: Create two cutting sessions for the same model+size+color+part, verify the parts inventory shows one row with the summed count, not two rows.

**Acceptance Scenarios**:

1. **Given** 50 units of "كلاسيك / L / أزرق / ظهر" exist from a previous session, **When** a new session produces 30 more of the same combination, **Then** the inventory shows 80 available
2. **Given** "كلاسيك / L / أزرق / ظهر" and "كلاسيك / M / أزرق / ظهر" both exist, **When** viewing inventory, **Then** they appear as separate rows (different size)
3. **Given** "كلاسيك / L / أزرق / ظهر" and "كلاسيك / L / أحمر / ظهر" both exist, **When** viewing inventory, **Then** they appear as separate rows (different color)

---

### User Story 3 - Parts Inventory Filtered by Model, Size, and Color (Priority: P2)

The parts inventory panel supports independent filtering by model, size, and color. The manager can quickly identify which (model, size, color, part) combinations are low or depleted and know what to cut next.

**Why this priority**: Without filtering, a large inventory table is unusable in practice. Managers need to plan production based on which variants are depleted.

**Independent Test**: With multiple model+size+color combinations in inventory, apply a size filter and verify only rows matching that size are displayed.

**Acceptance Scenarios**:

1. **Given** parts for models "كلاسيك" and "كاجوال" exist, **When** filtering by model "كلاسيك", **Then** only rows for "كلاسيك" are shown
2. **Given** parts in sizes S, M, L exist, **When** filtering by size "L", **Then** only L rows are shown
3. **Given** a part has 0 available (fully distributed), **When** viewing inventory, **Then** that row is visually highlighted as depleted

---

### User Story 4 - Distribution Requires Size and Color, Draws from Correct Inventory (Priority: P2)

When distributing parts to a tailor, the manager selects model, size, and color. The system shows only parts available for that exact (model, size, color) combination. The distribution record stores model, size, color, parts breakdown, and expected piece count. Returns remain linked to the same batch with size and color visible.

**Why this priority**: Distribution must draw down the correct inventory variant. Mixing size/color variants leads to incorrect counts and fulfillment errors.

**Independent Test**: With parts for "كلاسيك / L / أزرق" and "كلاسيك / M / أحمر" in inventory, create a distribution for "كلاسيك / L / أزرق" and verify only that combination's parts are shown, available counts are correct, and inventory is correctly reduced after saving.

**Acceptance Scenarios**:

1. **Given** parts exist for "كلاسيك" in multiple sizes and colors, **When** the user selects "كلاسيك + L + أزرق" in the distribution form, **Then** only parts for that exact combination are shown with correct available counts
2. **Given** a distribution is saved, **When** viewing its detail, **Then** size and color are displayed alongside model name and parts breakdown
3. **Given** the return modal is opened, **When** a batch is selected, **Then** the batch's size and color are shown in the selection context

---

### User Story 5 - Final Stock Filtered by Size and Color (Priority: P2)

The final stock screen displays completed garments with independent filters for size and color, giving managers and sales a clear view of finished inventory per variant.

**Why this priority**: Final stock is the product the business sells. Sales and managers need to quickly locate specific size/color combinations to fulfill orders.

**Independent Test**: Add final stock entries with different sizes and colors, apply size filter, verify only matching entries are shown.

**Acceptance Scenarios**:

1. **Given** final stock has entries for sizes S, M, L, **When** the user filters by size "M", **Then** only M entries are shown
2. **Given** final stock has entries in "أزرق" and "أحمر", **When** the user filters by color "أحمر", **Then** only "أحمر" entries are shown
3. **Given** both size and color filters are active simultaneously, **When** viewing the list, **Then** only entries matching both filters are shown

---

### Edge Cases

- What if a fabric item has no color defined? → The cutting session form requires a fabric color; the user must select a fabric that has color stock available.
- What if the user tries to distribute more parts than available for a specific size+color? → The system blocks the submission and shows an error with the available count.
- What if no parts are defined in settings for the selected model? → The parts section shows an empty state prompting the user to define parts for that model in settings first.
- What if a model or part name in settings changes after cutting records exist? → Existing records retain the original name; new records use the updated name.
- What happens to legacy cutting sessions without a size recorded? → They remain visible in history with size shown as blank and do not contribute to the new accumulation inventory.
- What if filters are applied and no records match? → An empty state message is shown; no error is thrown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The model field in the cutting session form MUST use the centralized models list from settings (same source as the settings/lookups module)
- **FR-002**: The parts field in the cutting session form MUST use the centralized parts list from settings, showing only parts associated with the selected model
- **FR-003**: The cutting session form MUST include a size field populated from the sizes lookup; size is set at the session level and applies to all parts in that session
- **FR-004**: The color for all produced parts MUST be automatically derived from the selected fabric item's color and MUST be read-only (not manually editable)
- **FR-005**: Each produced part entry MUST be stored with: model name, size, color, part name, and quantity
- **FR-006**: When a cutting session produces a (model, size, color, part name) combination that already exists in inventory, the system MUST add the new quantity to the existing total
- **FR-007**: The parts inventory panel MUST display one row per unique (model, size, color, part name) combination showing total produced, total distributed, and available count
- **FR-008**: The parts inventory panel MUST support independent filtering by model, size, and color
- **FR-009**: The distribution form MUST require selection of model, size, and color before displaying available parts
- **FR-010**: The available parts shown in the distribution form MUST be filtered to the selected (model, size, color) combination only
- **FR-011**: Distribution records MUST store size and color alongside model name and parts breakdown
- **FR-012**: The final stock screen MUST support filtering by size and color
- **FR-013**: Batch detail views (distribution and return) MUST display the size and color of the batch

### Key Entities

- **Parts Inventory Record**: Cumulative available count for a (model, size, color, part name) combination; accumulates across all cutting sessions
- **Cutting Session Part Log**: Per-session record of what was cut (session reference, part name, count) for audit/history purposes
- **Distribution Batch**: Updated to include size and color; represents parts given to a tailor for a specific model variant
- **Final Stock Entry**: Existing entity; size and color must be exposed as filterable attributes in the list view

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A manager can record a cutting session with model, size, fabric-color, and parts in under 3 minutes
- **SC-002**: After two sessions producing the same (model, size, color, part), the inventory shows exactly one row with the correct sum — verified in 100% of test cases
- **SC-003**: The parts inventory panel applies any filter (model, size, or color) and shows only matching rows — verified in 100% of filter test cases
- **SC-004**: Distribution correctly deducts from the matching (model, size, color, part) inventory only — no cross-contamination between variants — verified in 100% of test cases
- **SC-005**: Final stock filter by size or color reduces displayed rows to matching entries only — verified in 100% of test cases
- **SC-006**: All existing cutting sessions and distributions remain visible and their counts are unaffected after the migration

## Assumptions

- Parts in settings are linked to specific models (each part belongs to a model); the cutting form shows only parts for the selected model
- A cutting session has one size that applies to all parts in that session (size is session-level, not per-part)
- A cutting session uses one primary fabric item whose color applies to all produced parts in that session
- The sizes and colors dropdowns in cutting and distribution use the same lookup lists managed in settings
- Legacy data (sessions and distributions created before this feature) is preserved with blank size/color and does not interfere with new accumulation records
- The parts lookup in settings already supports associating parts with specific models (or this association will be added as part of implementation)
