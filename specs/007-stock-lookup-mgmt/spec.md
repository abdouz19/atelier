# Feature Specification: Stock & Suppliers Enhancements

**Feature Branch**: `007-stock-lookup-mgmt`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "Stock & Suppliers Enhancements — managed lookup lists for item types, colors, units, and inline supplier creation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Item Types, Colors & Units in Settings (Priority: P1)

A store manager visits the Settings screen and finds three new dedicated sections: Item Types, Colors, and Units. In each section they can see the full list including predefined entries (marked visually), add new entries, edit user-created entries, and soft-delete user-created entries. Predefined entries (قماش for types, متر for units, and the 8 predefined colors) are visually distinguished and their edit/delete actions are disabled.

**Why this priority**: This is the foundational CRUD for all lookup data. Without these lists, the dropdowns across the app have nothing to show. It also gives administrators control over the data that every user sees when adding stock items.

**Independent Test**: Navigate to Settings, verify the three sections exist with predefined entries marked. Add a new type, color, and unit. Edit them. Soft-delete them — they disappear from the list but data referencing them remains intact.

**Acceptance Scenarios**:

1. **Given** the app launches for the first time, **When** the user opens Settings, **Then** the Colors section shows exactly 8 predefined colors (أبيض، أسود، أحمر، أزرق، أخضر، أصفر، رمادي، بيج) each marked as predefined with edit/delete disabled.
2. **Given** the Types section is open, **When** the user tries to edit or delete "قماش", **Then** those actions are unavailable (button hidden or disabled).
3. **Given** the Units section is open, **When** the user tries to edit or delete "متر", **Then** those actions are unavailable.
4. **Given** a user-created type exists, **When** the user soft-deletes it, **Then** it no longer appears in the types dropdown but existing stock items that referenced it retain their type value.
5. **Given** the user adds a new type/color/unit, **When** they save, **Then** it immediately appears in the managed list and in all relevant dropdowns across the app.

---

### User Story 2 - Inline Add from Dropdowns (Priority: P2)

While creating or editing a stock item (or recording an inbound transaction or cutting session or distribution return), the user encounters a dropdown for type, color, or unit. At the bottom of each dropdown list is an "إضافة نوع" / "إضافة لون" / "إضافة وحدة" option. Clicking it opens a small inline form that saves the new entry immediately and selects it — without leaving the current modal. The color dropdown is converted app-wide: stock item modal, cutting session form, and distribution return form all use the managed Colors list.

**Why this priority**: Without inline add, users are forced to navigate away mid-task to Settings, losing their in-progress form. Inline add dramatically improves task completion rate for new entries discovered during data entry.

**Independent Test**: Open the Add Stock Item modal. Use the type dropdown's inline add to create a new type. Confirm it is selected. Submit the form. Confirm the new type now appears in Settings > Item Types list.

**Acceptance Scenarios**:

1. **Given** the type dropdown is open, **When** the user clicks "إضافة نوع", **Then** a small form appears (name field + save/cancel) and focus moves to the name field.
2. **Given** the inline add form is shown, **When** the user saves a valid name, **Then** the new entry is added to the persistent list, the dropdown closes, and the new entry is pre-selected in the field.
3. **Given** the inline add form is shown, **When** the user cancels, **Then** no entry is created and the dropdown returns to its normal state.
4. **Given** the user adds a color inline from the stock item form, **When** they later open the Distribution Return modal's color dropdown, **Then** the newly added color is also available there (colors are app-wide).
5. **Given** the inline add form is shown, **When** the user submits a duplicate name (case-insensitive), **Then** an error message is shown and no duplicate is created.

---

### User Story 3 - Stock Item Form Uses Managed Dropdowns (Priority: P3)

The Add/Edit Stock Item modal replaces free-text inputs for type, color, and unit with dropdowns sourced from the managed lists. Only active (not soft-deleted) entries appear. The form behavior and validation remain otherwise identical.

**Why this priority**: This is the primary consumer of the managed lists. The dropdowns replace text fields that were previously prone to inconsistent spelling and data quality issues.

**Independent Test**: Open the Add Stock Item modal. Confirm type, color, and unit are now dropdowns (not free-text inputs). Verify only active entries appear. Create a stock item, save it, reopen it, and confirm the saved values display correctly.

**Acceptance Scenarios**:

1. **Given** the Add Stock Item modal is open, **When** the type field is displayed, **Then** it is a dropdown showing only active types (not soft-deleted ones).
2. **Given** a type has been soft-deleted in Settings, **When** the user opens the Add Stock Item modal, **Then** that type does not appear in the dropdown.
3. **Given** an existing stock item uses a soft-deleted color, **When** the user views that stock item, **Then** the color value is still displayed correctly (stored value is preserved).
4. **Given** the user selects a type, color, and unit from dropdowns and submits, **When** the item is saved, **Then** all three values are stored and correctly displayed on re-open.
5. **Given** an existing stock item was created before this feature with a free-text type value (e.g., "بنطلون"), **When** the user opens that item to edit it, **Then** the type dropdown pre-selects "بنطلون" (which was seeded into the lookup list on migration).

---

### User Story 4 - Inbound Transactions Require Supplier, Price & Total (Priority: P4)

When recording an inbound transaction, the Supplier field is now a required dropdown (not optional free text) sourced from the existing suppliers list. Price per unit and total price paid are also required. Total is auto-calculated as quantity × price per unit but remains editable. A new "إضافة مورد" inline option in the supplier dropdown opens a nested modal for full supplier details, saves the supplier, and immediately selects it.

**Why this priority**: Financial accuracy for procurement requires knowing the supplier and cost on every transaction. Making these required eliminates incomplete records. The inline supplier add prevents workflow interruption.

**Independent Test**: Open the Record Inbound Transaction modal. Confirm supplier is a required dropdown. Confirm price per unit and total price are required. Attempt to submit without supplier — should fail validation. Use inline "إضافة مورد" to create a supplier, confirm it is selected, fill all required fields, submit, and confirm the transaction record shows correct supplier and cost.

**Acceptance Scenarios**:

1. **Given** the inbound transaction modal is open, **When** the user tries to submit without selecting a supplier, **Then** a validation error appears and submission is blocked.
2. **Given** the user enters a quantity and price per unit, **When** they move focus away, **Then** the total price field auto-populates with quantity × price per unit.
3. **Given** the total price is auto-calculated, **When** the user manually edits the total price field, **Then** the edited value is saved (the field is editable, not locked).
4. **Given** the supplier dropdown is open, **When** the user clicks "إضافة مورد", **Then** a nested modal opens with all supplier fields; on save the new supplier is created and immediately selected in the transaction form.
5. **Given** the inbound transaction modal is open, **When** the user submits with all required fields filled, **Then** the transaction is saved with supplier, price per unit, and total price recorded.
6. **Given** a price per unit is entered and total is not yet manually edited, **When** the user submits, **Then** the system uses the auto-calculated total (quantity × price per unit).

---

### Edge Cases

- What happens when the user soft-deletes a type/color/unit that is currently selected in an open form? The open form retains the selected value until saved or cancelled; it is not cleared.
- What happens when an inline add is cancelled mid-form? No data is persisted; the dropdown returns to its previous state.
- What happens when a user adds a duplicate type/color/unit name (case-insensitive)? The system rejects it with an error message and does not create a duplicate.
- What happens to existing stock items when their referenced type/color/unit is soft-deleted? The stored text values on existing records are preserved — soft-delete only hides entries from future dropdown selection.
- What happens when the user edits the auto-calculated total and later changes the quantity or price? The total field does NOT auto-recalculate once manually edited; the user must update it manually.
- What happens if a supplier added inline has the same name as an existing supplier? The system warns the user (name similarity) but allows saving, since different legal entities may share a name.
- What happens to existing cutting sessions and distribution batches with free-text color values on migration? Their distinct color values are seeded into the Colors list as user-created entries (same as stock items). The records themselves retain their stored string values for display.

## Requirements *(mandatory)*

### Functional Requirements

**Managed Lookup Lists (Types, Colors, Units)**

- **FR-001**: The system MUST maintain three persistent lookup lists: Item Types, Colors, and Units, each with add, edit, and soft-delete management.
- **FR-002**: Each list MUST include predefined entries seeded on first launch that cannot be edited or deleted: "قماش" (types), "متر" (units), and 8 common colors (أبيض، أسود، أحمر، أزرق، أخضر، أصفر، رمادي، بيج).
- **FR-002a**: On migration, the system MUST automatically seed all distinct existing type, color, and unit string values from existing stock items into the respective managed lists as user-created (non-predefined) entries, so that existing items open in edit mode with their value pre-selected in the dropdown.
- **FR-003**: Predefined entries MUST be visually distinguished from user-created entries in all management lists and dropdowns (e.g., a "predefined" badge or locked icon).
- **FR-004**: Users MUST be able to add new entries to each lookup list from the Settings screen.
- **FR-005**: Users MUST be able to edit the name of user-created entries from the Settings screen; predefined entries MUST have edit disabled.
- **FR-006**: Users MUST be able to soft-delete user-created entries from the Settings screen; soft-deleted entries MUST NOT appear in dropdowns; predefined entries MUST have delete disabled.
- **FR-007**: The Settings screen MUST have dedicated sections for managing Item Types, Colors, and Units, each showing the full list with add/edit/soft-delete actions.
- **FR-008**: Soft-deleting a lookup entry MUST NOT modify or remove the stored name value on any existing records that referenced it.

**Inline Add from Dropdowns**

- **FR-009**: The type dropdown in the stock item form MUST include an "إضافة نوع" option at the bottom of the list.
- **FR-010**: The color dropdown in ALL forms across the app MUST include an "إضافة لون" option at the bottom and MUST be sourced from the managed Colors list. This includes: the stock item add/edit modal, the cutting session form, and the distribution return form.
- **FR-011**: The unit dropdown in the stock item form MUST include an "إضافة وحدة" option at the bottom.
- **FR-012**: Selecting an inline add option MUST present a small form (name field + save/cancel) within or adjacent to the dropdown without closing the parent modal.
- **FR-013**: On saving an inline entry, the system MUST immediately persist it to the relevant lookup list and auto-select it in the current form field.
- **FR-014**: Inline add MUST reject duplicate names (case-insensitive) with a clear error message and prevent creation.

**Stock Item Form**

- **FR-015**: The type, color, and unit fields in the Add/Edit Stock Item modal MUST be dropdowns sourced from the active (non-soft-deleted) entries in each managed list.
- **FR-016**: Soft-deleted entries MUST NOT appear in Add/Edit dropdowns; existing records referencing soft-deleted entries MUST continue to display their stored values correctly in read-only views.

**Inbound Transactions**

- **FR-017**: The Supplier field on every inbound transaction MUST be a required dropdown sourced from the existing suppliers list (not free text).
- **FR-018**: Price per unit MUST be a required field on every inbound transaction.
- **FR-019**: Total price paid MUST be a required field on every inbound transaction, auto-calculated as quantity × price per unit but user-editable.
- **FR-020**: The supplier dropdown in the inbound transaction form MUST include an "إضافة مورد" option that opens a nested modal for full supplier creation; on save the new supplier MUST be immediately selected in the transaction form.
- **FR-021**: Submitting an inbound transaction without a supplier, price per unit, or total price MUST fail validation with a clear error message.

### Key Entities

- **ItemType**: Lookup entry for stock item categories. Attributes: id, name, isPredefined (bool), isActive (soft-delete flag), createdAt.
- **Color**: App-wide color lookup entry. Attributes: id, name, isPredefined (bool), isActive, createdAt.
- **Unit**: Measurement unit lookup entry. Attributes: id, name, isPredefined (bool), isActive, createdAt.
- **StockItem** (existing, modified): type, color, and unit fields continue to store the name string (not a foreign key) — historical display remains intact regardless of lookup list changes.
- **InboundTransaction** (existing, modified): supplier field is now required (references a supplier record by id); pricePerUnit and totalPricePaid are now required fields.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new item type, color, or unit from Settings in under 30 seconds.
- **SC-002**: Users can add a new entry inline from a dropdown without leaving the current modal in under 15 seconds; the entry is immediately available app-wide.
- **SC-003**: 100% of new stock items created after this feature ships have type, color, and unit values selected from the managed lists (no free-text fallback).
- **SC-004**: 100% of new inbound transactions created after this feature ships have a supplier, price per unit, and total price recorded.
- **SC-005**: Soft-deleting a lookup entry does not corrupt any existing record — 100% of existing records retain their displayed values after their referenced entry is soft-deleted.
- **SC-006**: All 8 predefined colors and the predefined type/unit entries are present and correctly protected on first app launch with no manual setup required.

## Clarifications

### Session 2026-03-15

- Q: When this feature ships, what happens to existing stock items' free-text type/color/unit values — specifically when editing an existing item? → A: Auto-seed existing unique values into the managed lists as user-created entries during migration so existing items open in edit mode with their value pre-selected in the dropdown.
- Q: Which forms should have their color field converted to a managed dropdown (with inline add)? → A: All color fields app-wide — stock item add/edit, cutting session form, and distribution return form all become managed dropdowns with the "إضافة لون" inline option.

## Assumptions

- The existing stock item forms currently have type, color, and unit as free-text inputs — this feature converts those three fields to managed dropdowns. On migration, all distinct existing values for these three fields are automatically seeded into the managed lists as user-created entries so existing items remain fully editable without data loss.
- The existing inbound transaction modal has a supplier field that is currently optional free text — this feature makes it a required dropdown referencing the suppliers list.
- The existing suppliers list (from the Suppliers module) is already managed; no new supplier entity or data model is introduced — only the supplier selection UX on the inbound transaction form changes.
- Colors are shared app-wide; the same Color lookup is used in stock items, cutting sessions, and distribution return forms. All three forms convert their color field from free-text to a managed dropdown with inline add. The migration seeds existing unique color values from all three sources (stock items, cutting sessions, distribution batches) into the Colors list.
- Stock items, cutting sessions, and other records store the name string directly (not a foreign key) so historical display is unaffected by future lookup list changes.
- The "إضافة مورد" inline flow collects the same fields as the existing Add Supplier screen.
- When the user manually edits the auto-calculated total, the edited value takes precedence and is not overwritten on subsequent field changes within the same form session.
- Predefined entries are seeded once via a database migration on first launch; re-launching does not duplicate them.
- The "Colors list is managed" sentence in the original description appears to have a truncation ("ot be deleted") — interpreted as: predefined colors cannot be edited or deleted, matching the pattern for types and units.
