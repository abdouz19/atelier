# Research: Suppliers & Purchase Tracking

## Decision 1: Supplier name preservation on deleted suppliers

**Decision**: Store a `supplier_name` snapshot column directly on `stock_transactions` at write time (in addition to `supplier_id` FK).

**Rationale**: When a supplier is soft-deleted, historical transactions must still display their name. Joining on a deleted supplier returns the name, but relying purely on a FK means the name disappears if a hard-delete ever occurs. Snapshotting the name at transaction time is the standard pattern for financial/audit records (e.g., invoice line items store vendor name). The cost is minor (TEXT column, ~30 bytes per row).

**Alternatives considered**:
- Join on `suppliers` with `is_deleted` check — works for soft-delete only; fragile long-term.
- Separate audit log table — overkill for this use case.

---

## Decision 2: Extending `stock_transactions` vs. a separate `purchase_details` table

**Decision**: Add nullable columns directly to `stock_transactions`: `supplier_id`, `supplier_name`, `price_per_unit`, `total_price_paid`.

**Rationale**: These fields are present on at most a subset of inbound transactions (those with a supplier). Using nullable columns on the existing table avoids a join for the common case (displaying transaction history) and keeps the data model simple. A separate `purchase_details` table would add a LEFT JOIN to every transaction history query for marginal normalization benefit.

**Alternatives considered**:
- `purchase_details` table with `transaction_id` FK — cleaner normalization, but adds complexity for no practical benefit at this scale.
- Storing price on `stock_items` — explicitly rejected by spec (prices live on transactions).

---

## Decision 3: Supplier selector UI — native `<select>` (per clarification)

**Decision**: Use a native `<select>` element with an empty "-- بدون مورد --" default option, followed by active suppliers sorted by name.

**Rationale**: Confirmed by user clarification (Q1: Option A). Consistent with existing datalist pattern in the codebase. Adequate for the expected supplier count (tens, not thousands).

**Alternatives considered**:
- Searchable combobox — better UX at scale, rejected by user.
- Modal picker — over-engineered for this use case.

---

## Decision 4: `suppliers` navigation — query param pattern

**Decision**: Use `/suppliers?id=xxx` for supplier detail view, same pattern as stock (`/stock?id=xxx`).

**Rationale**: The project established this pattern to work around Next.js `output: 'export'` limitations with dynamic routes (dynamic routes require `generateStaticParams` but IDs are runtime-generated). Query params on a single page work with static export without any workarounds.

**Alternatives considered**:
- `/suppliers/[id]` dynamic route — requires `generateStaticParams`, does not work cleanly with `output: 'export'`.

---

## Decision 5: Edit transaction scope (per clarification)

**Decision**: The edit-transaction form includes supplier, price per unit, and total paid fields. If supplier is changed to none, price fields become optional and are cleared. If supplier is set, price per unit is required.

**Rationale**: Confirmed by user clarification (Q2: Option B). Allows correcting data entry errors after the fact.

**Alternatives considered**:
- Read-only price/supplier on saved transactions — simpler, but rejected by user.

---

## Decision 6: `ALTER TABLE` for adding columns to `stock_transactions`

**Decision**: In `initDB()` in `main.js`, use `ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS` for the four new columns. SQLite supports `ADD COLUMN` but not `IF NOT EXISTS` natively — use a try/catch or check `PRAGMA table_info` before altering.

**Rationale**: The existing `main.js` creates tables via `CREATE TABLE IF NOT EXISTS`. Adding new columns to an existing table (for users upgrading from the stock-only version) requires `ALTER TABLE`. The safe approach is to attempt each `ALTER TABLE` in a separate try/catch block, silently ignoring "duplicate column" errors.

**Alternatives considered**:
- Drop and recreate table — destructive, unacceptable.
- Versioned migration system — overkill for this project's scale; the try/catch pattern is sufficient.

---

## Decision 7: IPC channel strategy — separate `suppliers:*` namespace + extended `stock:*` payloads

**Decision**: Add a new `suppliers:*` IPC namespace for supplier CRUD and detail queries. Extend existing `stock:create`, `stock:addInbound`, and `stock:updateTransaction` payloads with optional `supplierId`, `pricePerUnit`, `totalPricePaid` fields. Do not rename existing channels.

**Rationale**: Extending existing channels preserves backwards compatibility. The supplier CRUD operations belong in their own namespace to stay consistent with the `auth:*`, `user:*`, `stock:*` pattern.

**Alternatives considered**:
- New `stock:createWithSupplier` channel — creates duplication; rejected.
- Single merged channel — makes the contract harder to understand; rejected.
