# Feature Specification: Stock Management

**Feature Branch**: `002-stock-management`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "Stock management screen with searchable/filterable table, item detail view with color variants and transaction history, add/edit stock items, computed quantities, soft delete"

## Clarifications

### Session 2026-03-14

- Q: What does the item-level "color" field represent — a single descriptive attribute or the basis for variant-level quantity tracking? → A: Color is a free-text label (not a color picker). An item can have multiple color variants when inbound transactions are recorded with different colors. Each color variant's quantity is computed independently from its own transactions. If no color is used, the item has one default (uncolored) variant.
- Q: When recording an incoming quantity, is the transaction date always today or can the user set a custom date? → A: Date defaults to today but the user can change it to any past date.
- Q: Can soft-deleted items be restored? → A: Yes — users can view and restore archived items via a separate "Archived Items" view (archive action, not hard delete).
- Q: Must stock item names be unique? → A: No hard uniqueness — if a duplicate name is detected, show a warning but allow saving.
- Q: Can inbound transactions be edited after creation? → A: Yes — users can edit the quantity and date of any inbound transaction they created.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Search Stock Items (Priority: P1)

A user opens the stock screen from the main sidebar and sees all active (non-archived) material items in a table. They can type in a search box to filter by name, and use a type filter to narrow down to a specific category (e.g., قماش, خيط). Each row shows the item name, type, total quantity with its unit, color indicator (if the item has a single color variant), image thumbnail (if uploaded), and a short description. If an item has multiple color variants, the total quantity across all variants is shown with a small badge indicating the number of variants. Items with zero or negative quantity are highlighted in red.

**Why this priority**: This is the primary entry point to all stock operations. It gives the most immediate operational value — users need to know what they have at a glance.

**Independent Test**: Can be fully tested by seeding stock items with varied types and quantities, opening the stock screen, searching by name, filtering by type, and confirming the correct results and visual flags appear.

**Acceptance Scenarios**:

1. **Given** the stock screen is open and items exist, **When** the user types part of an item name in the search box, **Then** only matching items are shown.
2. **Given** items of multiple types exist, **When** the user selects a specific type from the filter, **Then** only items of that type are displayed.
3. **Given** an item has one color variant with zero or negative quantity, **When** it appears in the table, **Then** its quantity is shown in red.
4. **Given** an item has multiple color variants, **When** it appears in the table, **Then** the total quantity is displayed with a badge showing the number of variants.
5. **Given** an item was archived, **When** the user views the main stock list, **Then** the item does not appear.

---

### User Story 2 - Add a New Stock Item (Priority: P2)

A user registers a new material by clicking "Add Item", which opens a modal. They fill in the name, type (free text with suggestions from existing types), unit (free text with suggestions), initial quantity, and optionally a color, an image, a description, and notes. On save, the item appears in the list and the initial quantity is recorded as the first inbound transaction with that color (if provided).

**Why this priority**: Creating items is the prerequisite for all other stock operations.

**Independent Test**: Can be fully tested by opening the add-item modal, filling all required fields, submitting, and verifying the new item appears in the stock list with an initial inbound transaction recorded.

**Acceptance Scenarios**:

1. **Given** the add-item modal is open, **When** the user submits without a name, **Then** validation prevents submission and highlights the missing field.
2. **Given** the user provides all required fields, **When** they submit, **Then** the item is created and the initial quantity is stored as an inbound transaction dated today.
3. **Given** the user provides a color, **When** the item is saved, **Then** that color becomes the first variant in the detail view.
4. **Given** the user types a partial type or unit, **When** suggestions appear from existing values, **Then** selecting one fills the field automatically.
5. **Given** a name matches an existing item, **When** the user enters it, **Then** a non-blocking warning is shown but submission is still allowed.

---

### User Story 3 - Record Incoming Stock (Priority: P3)

A user triggers "Add Incoming Quantity" from either the table row or the item detail view. A small modal asks for quantity, color (optional, pre-filled with the existing color if only one variant exists), date (defaults to today, can be backdated), and optional notes. On save, an inbound transaction is recorded and the relevant variant's quantity updates.

**Why this priority**: This is the core flow for keeping quantities accurate over time.

**Independent Test**: Can be tested by adding an incoming quantity to an existing item and verifying the total (and variant-level) quantity increases correctly with the new transaction in the history.

**Acceptance Scenarios**:

1. **Given** an item with one existing color variant, **When** the user opens the add-incoming modal, **Then** the color field is pre-filled with the existing variant's color.
2. **Given** the user enters a quantity and saves, **Then** the item's computed total increases accordingly and the transaction appears in the history with the correct date.
3. **Given** the user sets a past date on the transaction, **When** saved, **Then** the transaction is recorded with the user-specified date (not today).
4. **Given** the quantity field is zero or empty, **When** the user tries to submit, **Then** validation prevents submission.

---

### User Story 4 - View Item Detail with Variants and History (Priority: P4)

A user clicks a table row to open the item detail view (full page or large side panel). The top section shows all item attributes (name, type, unit, description, notes). Below that, color variants are shown as cards — each with its color label and independently computed quantity. If no color was ever assigned, one default variant is shown. Below the variants is the full chronological transaction history: every inbound addition and every consumption from other modules (cutting, distribution, QC, finition), each with its date, quantity, color, and source. Consumed transactions are read-only.

**Why this priority**: Provides full traceability. Lower priority than browsing/adding because the list already exposes total quantity.

**Independent Test**: Can be tested by opening an item with multiple inbound transactions (in different colors) and consumed transactions, and verifying variant quantities, history order, and read-only state of consumed entries.

**Acceptance Scenarios**:

1. **Given** an item has inbound transactions in two different colors, **When** the detail view is opened, **Then** two variant cards are shown, each with their independently computed quantity.
2. **Given** an item has no color on any transaction, **When** the detail view is opened, **Then** one default variant card shows the total quantity.
3. **Given** consumed transactions from other modules exist, **When** they appear in the history, **Then** they have no edit or delete controls.
4. **Given** the variant card quantities are summed, **Then** the total matches the grand total shown in the list view.

---

### User Story 5 - Edit Item Metadata (Priority: P5)

A user edits an item's name, type, unit, color (item-level label), image, description, or notes from the detail view. Quantity is not editable directly — it is always computed from transactions.

**Why this priority**: Metadata corrections are infrequent and non-critical to operational flow.

**Independent Test**: Can be tested by editing an item's name, saving, and confirming the new name appears in the list and detail view without any change to the quantity.

**Acceptance Scenarios**:

1. **Given** an item exists, **When** the user edits its name and saves, **Then** the new name appears in the stock list immediately.
2. **Given** the edit form is open, **Then** no quantity input field is present.
3. **Given** the user replaces the item's image, **When** saved, **Then** the new thumbnail appears in the list.

---

### User Story 6 - Archive and Restore Items (Priority: P6)

A user archives a stock item they no longer use. The item disappears from the main stock list. Via a dedicated "Archived Items" view, the user can see all archived items and restore any of them back to the active list.

**Why this priority**: Data safety — items must never be hard-deleted. This is the least frequent action.

**Independent Test**: Can be tested by archiving an item, confirming it disappears from the main list, navigating to the Archived Items view, restoring it, and confirming it reappears.

**Acceptance Scenarios**:

1. **Given** an item is active, **When** the user triggers the archive action and confirms, **Then** the item disappears from the main stock list.
2. **Given** an item is archived, **When** the user opens the Archived Items view, **Then** the item appears there.
3. **Given** the user clicks "Restore" on an archived item, **When** confirmed, **Then** the item reappears in the main stock list with all its data and transaction history intact.

---

### Edge Cases

- What happens when an item's computed quantity goes below zero? → Visually flagged in red; the negative value is displayed as-is for traceability.
- What happens when a user searches with a string that matches no items? → An empty state is shown with a prompt to clear the filter or add a new item.
- What happens when an inbound transaction is edited and the new quantity reduces the total to zero or below? → The item is immediately flagged in red.
- How does the system handle an image upload that is too large or in an unsupported format? → Validation rejects the file before submission with a clear error message.
- What happens when the user restores an archived item that had consumed transactions recorded while archived? → All transactions are preserved and visible in the history upon restore.
- What happens if a user edits an inbound transaction quantity to zero or a negative number? → Validation prevents submission; inbound quantities must be positive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display all active (non-archived) stock items in a searchable, filterable table showing: name, type, quantity with unit, color indicator (single variant) or variant count badge (multiple variants), image thumbnail if set, and short description.
- **FR-002**: The system MUST allow real-time name search and type filtering on the stock list.
- **FR-003**: The system MUST visually flag (red) any item or variant whose computed quantity is zero or below.
- **FR-004**: The system MUST provide an "Add Item" modal collecting: name (required), type (required, free text with suggestions), unit (required, free text with suggestions), initial quantity (required, positive), color (optional), image (optional), description (optional), notes (optional).
- **FR-005**: The system MUST record the initial quantity as an inbound transaction dated at creation time when a new item is saved.
- **FR-006**: The system MUST provide an "Add Incoming Quantity" action accessible from both the table row and the item detail view, collecting: quantity (required, positive), color (optional, pre-filled if item has one variant), date (required, defaults to today, can be any past date), notes (optional).
- **FR-007**: The system MUST compute each item's total quantity as: sum of all inbound transactions minus sum of all consumed transactions for that item.
- **FR-008**: When transactions carry a color label, the system MUST compute each color variant's quantity independently using only transactions of that color.
- **FR-009**: The system MUST provide an item detail view showing: item attributes, variant cards (one per color, or one default if uncolored) each with computed quantity, and a full chronological transaction history with date, type, quantity, color, and source per entry.
- **FR-010**: Consumed transactions from other modules (cutting, distribution, QC, finition) MUST be read-only in the detail view.
- **FR-011**: Inbound transactions MUST be editable (quantity and date) after creation. Editing MUST immediately reflect in the item's computed quantity.
- **FR-012**: The system MUST provide an "Edit" action for item metadata (name, type, unit, color, image, description, notes) — quantity is excluded.
- **FR-013**: The system MUST support soft-archiving of items: archived items are hidden from the main list but data is preserved.
- **FR-014**: The system MUST provide an "Archived Items" view where users can see and restore archived items.
- **FR-015**: The system MUST show a non-blocking warning when a new item's name matches an existing active item.
- **FR-016**: The system MUST show type and unit autocomplete suggestions from existing values when adding or editing items.
- **FR-017**: All forms MUST validate inputs and show field-level errors before submission.
- **FR-018**: The stock list MUST display an empty state when no items match the current search/filter.

### Key Entities

- **Stock Item**: A physical material in the workshop. Has name, type, unit, optional item-level color label, optional image, optional description, optional notes, archive flag. Quantity is computed, never stored directly.
- **Inbound Transaction**: A quantity addition. Has reference to stock item, date (user-specified), quantity (positive), optional color label, optional notes. Editable after creation.
- **Consumed Transaction**: A quantity reduction created by other modules (cutting, distribution, QC, finition). Has reference to stock item, date, quantity, optional color, source module identifier. Read-only in this feature.
- **Color Variant** *(derived)*: Computed by grouping all transactions for an item by their color label. Each variant's quantity = sum of its inbound transactions minus sum of its consumed transactions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate any stock item by name or type within 10 seconds of opening the stock screen.
- **SC-002**: Users can add a new stock item with all required fields in under 2 minutes.
- **SC-003**: Users can record an incoming quantity in under 60 seconds.
- **SC-004**: Computed quantities in the list and detail view are always consistent with the underlying transaction records — zero discrepancy.
- **SC-005**: Items and variants at zero or below are visually distinguishable from healthy stock without any user action.
- **SC-006**: No stock data is permanently lost — archived items and their full transaction history are fully recoverable.
- **SC-007**: All forms reject invalid input before submission.

## Assumptions

- All authenticated users have equal access to all stock operations. Role-based restrictions belong in spec 001.
- Color is a free-text label (e.g., "أحمر", "أزرق فاتح") — no predefined palette.
- Images are stored locally on the device.
- Type and unit autocomplete suggestions are derived from existing item values — no separate management screen needed.
- An item's initial quantity is the first inbound transaction; no separate "starting balance" concept.
- Transactions from other modules carry a source identifier; this feature reads but never writes consumed transactions.

## Dependencies

- **Spec 001 - User Authentication**: Users must be authenticated to access the stock screen.
- **Cutting / Distribution / QC / Finition specs** (future): These modules write consumed transactions referencing stock item IDs. The transaction schema must be compatible with what those modules expect to write.
