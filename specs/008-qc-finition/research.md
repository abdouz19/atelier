# Research: Quality Control & Finition

## Existing Schema Analysis

### return_records (feature 006 — source for QC input)
```
id, batch_id → distribution_batches(id), quantity_returned, return_date, created_at, updated_at
```
- `quantity_returned` is the total pieces available for QC per return event
- Unreviewed quantity = `quantity_returned` − SUM of `qc_records.quantity_reviewed` WHERE `return_id = return_records.id`

### distribution_batches (carries model/size/color/tailor)
```
id, tailor_id → tailors(id), model_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date
```
- QC modal display row: JOIN return_records → distribution_batches → tailors to get tailor name, model, size, color

### cutting_pieces
```
id, session_id, size_label, status ('not_distributed'|'distributed'|...)
```
- Not directly queried by QC; context comes through distribution_batches

### employees
```
id, name, role, status ('active'|'inactive'), ...
```
- QC and finition employee selectors filter on `status = 'active'`

### Consumption entry pattern (established in features 005/006)
```
{module}_consumption_entries: id, {source}_id, stock_item_id, color, quantity, created_at, updated_at
```
- Reused verbatim for qc_consumption_entries, finition_consumption_entries, finition_step_consumption_entries

## Decision Log

### D1: Grade storage — columns vs. child rows
- **Decision**: Four grade columns directly on `qc_records` (qty_damaged, qty_acceptable, qty_good, qty_very_good)
- **Rationale**: Grades are fixed and known (four values); a child table adds a join with no benefit. All other grade-like data in the app uses columns (e.g., distribution_batches columns).
- **Alternative rejected**: Separate `qc_grade_entries` child table — unnecessary normalization for a fixed enum set.

### D2: Custom step ordering
- **Decision**: `step_order INTEGER NOT NULL` on `finition_steps`, auto-incremented at insert time based on MAX(step_order) + 1 for the finition_id.
- **Rationale**: Needed for correct display order in the finition table; gap-free sequence since steps are never deleted.

### D3: Readiness state on finition_records and finition_steps
- **Decision**: `is_ready INTEGER NOT NULL DEFAULT 0` (0 = not yet ready / pending decision, 1 = ready). A finition record OR step with `is_ready = 0` that has no subsequent step is "pending readiness prompt."
- **Rationale**: Separates "not yet prompted" from "answered no" — both are `is_ready = 0` at the record level; what matters is whether a final_stock_entry exists linked to this record.

### D4: Final stock as append-only log
- **Decision**: `final_stock_entries` append-only; totals computed by SUM at query time. Confirmed by user (clarification Q1).
- **Rationale**: Preserves full audit trail; consistent with all other record types in the app.

### D5: Consumption entries — separate tables per module
- **Decision**: Three separate consumption tables: `qc_consumption_entries`, `finition_consumption_entries`, `finition_step_consumption_entries`.
- **Rationale**: Consistent with the pattern already used (cutting_consumption_entries, return_consumption_entries). Each has a typed foreign key to its parent, enabling clean cascading and queries.

### D6: IPC namespace split — `qc` and `finition`
- **Decision**: Two IPC handler files — `qc.handler.js` and `finition.handler.js`.
- **Rationale**: Respects constitution "one file per domain." QC and finition are distinct enough domains (different tables, different workflows) to warrant separation.

## Integration Notes

- QC reads from `return_records` + `distribution_batches` + `tailors` — all read-only from QC's perspective.
- Finition reads from `qc_records` — read-only from finition's perspective.
- Final stock entries do NOT write back to any existing table; they are a new append-only log.
- Stock consumption deductions follow the existing `stock:addInbound` / consumed transaction pattern — insert a `stock_transactions` row with `type = 'consumed'` for each consumption entry at record creation time.
