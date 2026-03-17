# Research: Stock Management

**Branch**: `002-stock-management` | **Date**: 2026-03-14

## Decision Log

---

### 1. Color Variant Model

**Decision**: Color variants are derived — not stored as separate entities. They are computed by grouping `stock_transactions` rows by their `color` column for a given `stock_item_id`.

**Rationale**: Storing variants as separate rows would require coordinating a separate variants table with transactions, adding schema complexity and insert overhead. Since quantities are always recomputed on read, grouping by color in a single query is simpler, cheaper, and naturally handles the "no color = one default variant" case (rows with `color IS NULL` form the uncolored variant).

**Alternatives considered**:
- Separate `stock_variants` table with its own rows: rejected — adds a join and a management surface for data that is fully derivable from transactions.
- Storing a `variants` JSON blob on the item: rejected — not queryable and violates normalized design.

---

### 2. Quantity Computation Strategy

**Decision**: Quantities are computed on the service layer by summing `stock_transactions` grouped by `(stock_item_id, color)`. The SQLite query uses `SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END)` per group.

**Rationale**: SQLite is fast enough for this aggregation at the expected scale (≤50k rows). Computing in the service layer means the renderer always sees fresh data; there is no risk of stale cached quantities diverging from reality.

**Alternatives considered**:
- Storing `current_quantity` as a column on `stock_items` and updating it on every transaction write: rejected — creates dual-write complexity and risk of quantity drift if any write path is missed.
- Materialized views: not available in SQLite in a useful form; overkill for this scale.

---

### 3. Image Storage

**Decision**: Images are stored as files in Electron's `app.getPath('userData')/stock-images/` directory. The `stock_items.image_path` column stores the filename only (not the full path). The frontend receives the full resolved path via IPC.

**Rationale**: Storing binary blobs in SQLite degrades performance for larger files and complicates backup/restore. File-based storage is standard practice for Electron desktop apps. Using filename-only in the DB keeps paths portable if the userData directory moves.

**Alternatives considered**:
- Storing base64 in SQLite: rejected — performance degradation, large DB file size.
- Storing absolute paths: rejected — breaks if userData directory changes across OS users or versions.

---

### 4. Inbound Transaction Editability

**Decision**: Inbound transactions can have their `quantity` and `transaction_date` updated. No other fields are editable. Consumed transactions (created by other modules) are immutable from this feature.

**Rationale**: The user explicitly requested this (clarification Q5). Since quantity is computed on read, editing an inbound transaction immediately changes the visible total — no migration or recalculation job needed.

**Alternatives considered**:
- Corrective entry pattern (add a negative inbound to offset): rejected by user — adds noise to transaction history.
- Editing all fields including color: rejected — changing color retroactively would reclassify historical stock, which is confusing and could hide errors.

---

### 5. IPC Channel Granularity

**Decision**: One IPC handler file (`stock.handler.ts`) with 10 typed channels covering all stock operations. Channels use the `stock:` namespace prefix following the established `auth:` and `user:` conventions.

**Rationale**: The existing codebase uses one handler file per domain. Keeping stock as one domain matches the architecture and avoids proliferating handler files.

**Alternatives considered**:
- Separate handler files per sub-resource (items, transactions): rejected — over-engineering for a single cohesive domain.

---

### 6. Autocomplete for Type and Unit

**Decision**: The service exposes two read-only queries — `getDistinctTypes()` and `getDistinctUnits()` — that return sorted lists of unique values from existing items. The frontend renders these as a datalist or combobox over the free-text input.

**Rationale**: No separate management screen is needed (per spec). The suggestions are purely advisory; the user can always type a new value.

**Alternatives considered**:
- Hardcoded suggestion lists: rejected — the app is domain-specific and users will create their own terminology over time.
- Separate `types` and `units` reference tables: rejected — over-engineering; distinct queries on the items table are sufficient.

---

### 7. Soft Archive Pattern

**Decision**: `stock_items` has an `is_archived` integer column (0 = active, 1 = archived). All list queries add `WHERE is_archived = 0`. A dedicated `stock:archive` channel sets `is_archived = 1`; `stock:restore` sets it back to 0.

**Rationale**: Industry-standard soft-delete pattern. Simple boolean flag is easy to query and index. Data and all transactions are preserved, satisfying the recovery requirement.

**Alternatives considered**:
- `deleted_at` timestamp: equivalent, but the binary flag is cleaner when no deletion date reporting is needed.
- Separate `archived_items` table: rejected — unnecessary data movement and FK complexity.

---

### 8. Transaction Date vs. Created-At

**Decision**: `stock_transactions` has two date fields: `transaction_date` (user-specified, the actual date of the stock event) and `created_at` (auto-set, the row creation timestamp). History is ordered by `transaction_date DESC, created_at DESC`.

**Rationale**: Users can backdate transactions (clarification Q2). The `created_at` is an audit field; `transaction_date` is the business date. Ordering by business date ensures the history reflects real-world chronology.

**Alternatives considered**:
- Single date field: rejected — loses the audit trail of when data was entered vs. when the event occurred.
