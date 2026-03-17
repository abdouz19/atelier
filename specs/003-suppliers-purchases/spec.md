# Feature Specification: Suppliers & Purchase Tracking

**Feature Branch**: `003-suppliers-purchases`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "Suppliers & Purchase Tracking"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Manage Supplier Directory (Priority: P1)

A user needs to maintain a list of suppliers the business buys from. They open the Suppliers screen from the main sidebar, see a table of all active suppliers with their contact details and notes, and can add a new supplier, edit an existing one, or soft-delete one they no longer work with.

**Why this priority**: Without suppliers in the system, no purchase tracking is possible. This is the foundational dataset for the entire feature.

**Independent Test**: Create two suppliers ("قماش للجميع", phone 0501112233) and ("بيت الخيوط", phone 0559998877). Verify both appear in the table with their details. Edit the first supplier's phone number. Verify the update reflects in the table. Soft-delete the second supplier. Verify it disappears from the active list.

**Acceptance Scenarios**:

1. **Given** the suppliers list is empty, **When** the user adds a supplier with name, phone, address, products, and notes, **Then** the new supplier appears in the table with all entered details.
2. **Given** a supplier exists, **When** the user edits its phone number and saves, **Then** the updated phone number appears in the table immediately.
3. **Given** a supplier exists, **When** the user soft-deletes it, **Then** it disappears from the active suppliers table and is no longer selectable when recording purchases.
4. **Given** the user tries to add a supplier without a name, **When** they submit, **Then** the form shows a validation error and does not save.

---

### User Story 2 — View Supplier Purchase History (Priority: P2)

A user wants to see the full history of purchases made from a specific supplier. Clicking a supplier in the table opens a detail view showing the supplier's contact information and a chronological list of every inbound stock transaction linked to them, with the total amount spent across all transactions displayed as a summary.

**Why this priority**: Purchase history per supplier is the primary analytical value of this feature — it lets the business know how much they spend with each supplier and what they buy.

**Independent Test**: Link two inbound transactions to "قماش للجميع" (100 meters at 10 SAR, 50 meters at 12 SAR). Open the supplier detail view. Verify both transactions appear. Verify the total spent shows 1600 SAR. Verify each row shows item name, quantity, price per unit, total paid, and date.

**Acceptance Scenarios**:

1. **Given** a supplier has purchase transactions, **When** the user opens their detail view, **Then** all linked transactions appear in chronological order with item name, quantity, price per unit, total paid, and date.
2. **Given** a supplier has multiple transactions, **When** the detail view is open, **Then** a summary line shows the aggregate total amount spent across all transactions.
3. **Given** a supplier has no transactions yet, **When** the user opens their detail view, **Then** an empty state message is shown with no total.

---

### User Story 3 — Record Purchase Price on Incoming Stock (Priority: P3)

When a user adds incoming quantity to an existing stock item, they can optionally select a supplier and enter a price per unit. The total price paid auto-calculates as quantity × price per unit but remains editable. If no supplier is selected, price fields are optional. This purchase data is stored on the inbound transaction record.

**Why this priority**: This is the core data-capture step that makes supplier tracking useful. Without it, purchase history cannot be built.

**Independent Test**: Open "قماش أبيض" (quantity 50). Add incoming: quantity=30, supplier="قماش للجميع", price per unit=15 SAR. Verify total auto-fills as 450 SAR. Change total to 400 SAR manually. Save. Verify the transaction appears in the item's history with supplier name, price per unit 15, total paid 400, and date. Verify it appears in the supplier's purchase history.

**Acceptance Scenarios**:

1. **Given** the add-inbound form is open, **When** the user selects a supplier and enters price per unit, **Then** total price auto-calculates as quantity × price per unit.
2. **Given** the total price has been auto-calculated, **When** the user manually changes it, **Then** the override value is saved (not re-calculated).
3. **Given** no supplier is selected, **When** the user leaves price fields blank and saves, **Then** the transaction is saved without price data.
4. **Given** a supplier is selected, **When** the user leaves price per unit blank and tries to save, **Then** a validation error is shown (price required when supplier is selected).
5. **Given** an inbound transaction with supplier and price data is saved, **When** the user views the stock item detail, **Then** the transaction row shows supplier name, price per unit, total paid, and date.
6. **Given** a saved inbound transaction has supplier and price data, **When** the user edits it, **Then** the edit form pre-fills supplier, price per unit, and total paid; the user can change any of these fields subject to the same validation rules.

---

### User Story 4 — Link Supplier When Creating a New Stock Item (Priority: P4)

When creating a new stock item, the user can optionally choose a supplier for the initial inbound transaction (the initial quantity). If selected, they must also provide price per unit and total price for that first purchase.

**Why this priority**: Allows complete purchase tracking from the very first unit entered, but is lower priority than recording ongoing purchases.

**Independent Test**: Add new item: name="خيط أسود", type="خيط", unit="بكرة", quantity=100, supplier="بيت الخيوط", price per unit=5 SAR. Verify item is created. Verify the initial inbound transaction in the item's history shows supplier "بيت الخيوط", price 5 SAR/unit, total 500 SAR. Verify the transaction also appears in "بيت الخيوط" purchase history.

**Acceptance Scenarios**:

1. **Given** the add-item form is open and a supplier is selected with a valid price, **When** the user submits, **Then** the initial inbound transaction is recorded with supplier and price data.
2. **Given** no supplier is selected in the add-item form, **When** the user submits, **Then** the initial inbound transaction is created without price data (as before).

---

### Edge Cases

- What if a supplier is soft-deleted but has existing purchase transactions? The transactions remain intact and still visible in the stock item history and supplier history. The deleted supplier's name is still shown on historical transactions (read-only).
- What if the user changes the quantity after the total price has been manually overridden? The total price is not recalculated; the user must update it manually.
- What if two suppliers have the same name? The system allows it (no uniqueness constraint on name) but shows phone number in the selector to disambiguate.
- What if an inbound transaction is edited (quantity or date updated) — does the total price recalculate? No. Price fields are independent of quantity edits; the user must update them manually if desired.
- When editing an inbound transaction, the user can also change the supplier and price fields (price per unit, total paid). The same validation rules apply: price is required if a supplier is selected, optional if none.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a dedicated Suppliers screen accessible from the main sidebar navigation.
- **FR-002**: Suppliers screen MUST show a table with columns: name, phone number, address, products sold, notes.
- **FR-003**: Users MUST be able to add a new supplier via a modal form with fields: name (required), phone number, address, products sold (free text), notes.
- **FR-004**: Users MUST be able to edit any supplier's details from the suppliers table.
- **FR-005**: Users MUST be able to soft-delete a supplier; soft-deleted suppliers disappear from the active list and from supplier selection dropdowns.
- **FR-006**: Clicking a supplier MUST open a detail view showing supplier information and all linked inbound transactions.
- **FR-007**: The supplier detail view MUST show a summary of total amount spent across all linked transactions.
- **FR-008**: Each transaction in the supplier detail view MUST show: stock item name, quantity, price per unit, total paid, date.
- **FR-009**: The add-inbound-stock form MUST include an optional supplier selector — a native dropdown (`<select>`) listing all active suppliers by name, with an empty "no supplier" option as default.
- **FR-010**: When a supplier is selected on an inbound transaction, price per unit MUST be required and total price MUST be shown (auto-calculated as quantity × price per unit, but user-editable).
- **FR-011**: When no supplier is selected on an inbound transaction, price fields MUST be optional (can be left blank).
- **FR-012**: Supplier name, price per unit, and total price paid MUST be stored on the inbound transaction record, not on the stock item.
- **FR-013**: The stock item detail transaction history MUST display supplier name, price per unit, and total paid for each inbound transaction that has this data.
- **FR-014**: The add-new-stock-item form MUST include an optional supplier selector (same native dropdown as FR-009) with conditional price fields (same rules as FR-010/FR-011).
- **FR-015**: Soft-deleted suppliers MUST remain visible on historical transactions (name displayed as read-only reference).
- **FR-016**: The edit-inbound-transaction form MUST include supplier, price per unit, and total paid fields, subject to the same validation rules as FR-010/FR-011 (price required if supplier selected, optional otherwise).

### Key Entities

- **Supplier**: Represents a business or individual the atelier purchases goods from. Attributes: name, phone number, address, products sold (free text), notes, active/deleted status, creation date.
- **Inbound Transaction (extended)**: An existing entity (stock transaction of type "inbound") extended with: supplier reference (optional), price per unit (optional), total price paid (optional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new supplier and see it available for selection in under 60 seconds.
- **SC-002**: Users can record an incoming stock purchase with supplier and price in under 90 seconds.
- **SC-003**: The supplier detail view loads with full purchase history and correct total in under 2 seconds.
- **SC-004**: 100% of inbound transactions with a supplier selection correctly appear in both the stock item history and the supplier purchase history.
- **SC-005**: Total spent calculation in supplier detail view is always accurate (matches sum of individual transaction totals).

## Clarifications

### Session 2026-03-14

- Q: What is the interaction model for selecting a supplier in forms? → A: Native `<select>` dropdown listing all active suppliers; no search/autocomplete needed.
- Q: When editing an existing inbound transaction, can the user change supplier and price fields? → A: Yes — the edit form includes supplier, price per unit, and total paid; same validation rules as the add form.

## Assumptions

- Only one user role exists (admin); all users can manage suppliers and view purchase history.
- Supplier phone number format is not validated (free text field) to accommodate various formats.
- "Products sold" is a free-text description, not linked to the actual stock items catalog.
- The supplier selector in forms uses the supplier's name as the display label; phone number is shown as a secondary identifier when names are identical.
- Currency is SAR (Saudi Riyal); no multi-currency support needed at this stage.
- Deleted suppliers are never hard-deleted; their historical data remains queryable.
- Price fields accept decimal values (e.g., 12.50 SAR per unit).

## Dependencies

- **Stock Management (002)**: This feature extends the inbound transaction form and transaction history display. The `stock_transactions` table must already exist with the `type='inbound'` concept established.
- **Sidebar Navigation**: A nav item must be added for the Suppliers screen alongside the existing Dashboard, Stock, and Settings items.
