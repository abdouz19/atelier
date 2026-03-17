# Research: Stock & Suppliers Enhancements

## Decision 1: Lookup List Storage — Name String vs Foreign Key

**Decision**: Store the name string (TEXT) on existing tables rather than a foreign key (INTEGER/TEXT FK) to the lookup tables.

**Rationale**: `stock_items.type`, `stock_items.color`, `stock_items.unit`, `cutting_sessions.fabric_color`, and `distribution_batches.color` are existing columns that already contain free-text values. Adding a FK would require a nullable migration (breaking for NOT NULL columns), force schema changes on three tables, and break historical display when a lookup entry is soft-deleted. Storing the name string is the established pattern in this codebase (e.g., `cutting_sessions.fabric_color` is TEXT). Soft-delete on the lookup entry only gates future dropdown selection — it never corrupts stored values.

**Alternatives considered**:
- FK reference + JOIN for display: Rejected because it requires schema migration on existing tables, creates cascading display breakage on soft-delete, and contradicts the existing project pattern.
- Separate canonical name + alias columns: Over-engineered for this single-user desktop app.

---

## Decision 2: Inline Add UI — Custom Dropdown vs Native `<select>`

**Decision**: Build a reusable `ManagedDropdown` custom component using Tailwind-styled `<div>` + click-outside handler + inline mini-form. Do NOT use native `<select>`.

**Rationale**: Native `<select>` cannot render an "إضافة X" option that spawns a form inline without closing the dropdown — the browser enforces this. The existing codebase already uses custom `<div>`-based UI for complex interactions (e.g., `ConsumptionRowsEditor`, batch selection in `ReturnModal`). A single reusable `ManagedDropdown` component accepts `items`, `value`, `onChange`, `onAddNew` props and handles the open/close, keyboard, and inline-add lifecycle. This keeps all three dropdowns (type, color, unit) consistent.

**Alternatives considered**:
- `<datalist>` with `<input>`: Used currently for type/unit in AddItemModal. Cannot add "إضافة X" as a selectable action item. Rejected.
- shadcn/ui Combobox: Constitution lists shadcn/ui in the stack, but existing components do not use it — mixing in shadcn Combobox for one feature while others use plain HTML creates inconsistency. Build custom for now to stay consistent with existing components.

---

## Decision 3: Migration Strategy for Existing Free-Text Data

**Decision**: During the DB migration that creates the three lookup tables, execute seed queries that collect `DISTINCT` existing values from `stock_items.type`, `stock_items.unit`, `stock_items.color`, `cutting_sessions.fabric_color`, and `distribution_batches.color`, then insert them as user-created (is_predefined=0, is_active=1) entries using `INSERT OR IGNORE` (conflict on LOWER(name)).

**Rationale**: The clarification confirmed Option A — existing items must open in edit mode with their value pre-selected. This requires every existing string to exist in the lookup table. Using `DISTINCT` + `INSERT OR IGNORE` is idempotent (safe to run multiple times) and handles duplicates across sources (e.g., "أبيض" may exist in both stock_items and cutting_sessions — only one entry is created). Predefined colors that already exist as free-text are not duplicated (INSERT OR IGNORE handles it).

**Alternatives considered**:
- Manual migration by user: Rejected — would require user action and may leave unmapped values.
- FK nullable with NULL for old records: Rejected (see Decision 1).

---

## Decision 4: Cutting Session `fabricColor` — Constraint Preservation

**Decision**: The cutting session `fabricColor` field retains its stock-availability constraint (`cutting:getFabricColors` returns colors that have actual available stock for the selected fabric). The managed Colors dropdown is added as the source for the "إضافة لون" inline option only — the selectable options in the dropdown remain those with available stock. New behavior: `CuttingStep1Form` fetches BOTH `lookups:getColors` and `cutting:getFabricColors({fabricItemId})`; the dropdown shows ONLY the intersection (active Colors entries that also have available stock for the fabric). "إضافة لون" adds to the Colors lookup but the new color only becomes selectable in the cutting dropdown once stock exists for it.

**Rationale**: The business rule that you cannot cut with a color you have no fabric for is non-negotiable. Removing the stock-availability constraint would allow users to select colors with zero fabric, resulting in invalid session data. The managed Colors list adds consistency and discoverability but cannot override inventory reality.

**Alternatives considered**:
- Replace `getFabricColors` entirely with `lookups:getColors`: Rejected — bypasses stock validation.
- Show all managed Colors, block submission if no stock: Added complexity with poor UX (user sees colors they can't use). Rejected.

---

## Decision 5: `lookups` IPC Namespace — Channel Count

**Decision**: 12 channels in the `lookups` namespace:
- **Reads** (3): `lookups:getTypes`, `lookups:getColors`, `lookups:getUnits` — each returns all active (non-soft-deleted) entries including predefined, with `isPredefined` flag for UI gating.
- **Creates** (3): `lookups:createType`, `lookups:createColor`, `lookups:createUnit` — rejects duplicate names (case-insensitive LOWER comparison).
- **Updates** (3): `lookups:updateType`, `lookups:updateColor`, `lookups:updateUnit` — rejects if `is_predefined=1`.
- **Soft-deletes** (3): `lookups:deleteType`, `lookups:deleteColor`, `lookups:deleteUnit` — rejects if `is_predefined=1`; sets `is_active=0`.

**Rationale**: Settings management needs both read + write. Inline add only needs create + read. A single GET per list (returning all active entries) suffices for both settings display and dropdown population — the Settings UI renders the full list with management actions based on `isPredefined`.

**Alternatives considered**:
- Separate `getAll` (for settings, includes soft-deleted) vs `getActive` (for dropdowns): Over-engineered — settings never shows deleted items; a single `getActive` (is_active=1) list serves both purposes.

---

## Decision 6: `stock:addInbound` — Required Fields Change

**Decision**: The `stock:addInbound` IPC handler is modified to enforce `supplierId`, `pricePerUnit`, and `totalPricePaid` as required. The backend validates these and returns `{ success: false, error: '...' }` if missing. Frontend Zod schema for `AddInboundModal` is updated to make these required.

**Rationale**: The spec (FR-017 through FR-021) requires 100% of new inbound transactions to have supplier and cost. Enforcing at both frontend (Zod) and backend (IPC handler) follows the existing pattern (e.g., `cutting:create` validates all required fields before inserting).

**Alternatives considered**:
- Frontend-only validation: Rejected — IPC handlers must be defensive regardless of caller.

---

## Decision 7: `DistributeModal` Color Field

**Decision**: The `DistributeModal.color` field (currently a free-text `<input>`) is changed to use `ManagedDropdown` sourced from `lookups:getColors`. This is fetched by the existing `useDistributeForm` hook.

**Rationale**: The distribution batch color is a key field for matching pieces to fabric. Using the managed Colors list ensures consistency with stock items and cutting sessions. The `distribution:getAvailablePieces` handler already filters by `fabric_color` (via cutting_sessions) — the managed Colors list ensures the values match.

---

## Decision 8: Supplier Inline Add — Nested Modal Pattern

**Decision**: "إضافة مورد" in the supplier dropdown opens a full nested modal (not an inline mini-form) because suppliers have multiple required fields (name, phone, address, products_sold, notes). The existing `NewSupplierModal` (or equivalent) is reused. The `AddInboundModal` manages a `showNestedSupplierModal` boolean state to conditionally render it.

**Rationale**: The spec says "opens a small nested modal collecting all supplier fields." The existing supplier creation form has 5 fields — an inline name-only form would be insufficient. Reusing the existing supplier creation flow avoids duplicating validation logic.

**Alternatives considered**:
- Name-only inline form with optional fields later: Rejects the spec requirement to collect "all supplier fields."
