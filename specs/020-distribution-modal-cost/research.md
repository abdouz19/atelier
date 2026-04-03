# Research: Distribution Modal Redesign & Cost Calculation

**Feature**: 020-distribution-modal-cost
**Phase**: 0 — Research
**Date**: 2026-04-03

---

## Decision 1: Average Unit Cost Computation

**Decision**: Compute the weighted average unit cost using `cutting_session_parts.unit_cost` joined to `cutting_pieces` through the session, filtered to `status = 'not_distributed'`.

**Rationale**: `cutting_session_parts` is the authoritative source for cost per part per session (added in 018-session-cost-distribution). `cutting_pieces` tracks individual piece status. Joining both via `session_id` + `part_name` + `size_label` lets us query "what is the average unit cost of the not-yet-distributed pieces of this part/model/size/color?".

**Query pattern**:
```sql
SELECT
  csp.part_name,
  COUNT(cp.id)                              AS available_count,
  AVG(COALESCE(csp.unit_cost, 0))           AS avg_unit_cost
FROM cutting_pieces cp
JOIN cutting_sessions cs   ON cs.id = cp.session_id
JOIN cutting_session_parts csp
                           ON csp.session_id = cp.session_id
                          AND csp.part_name  = cp.part_name
                          AND csp.size_label = cp.size_label
WHERE cp.status      = 'not_distributed'
  AND cs.model_name  = ?
  AND cp.size_label  = ?
  AND cp.color       = ?
GROUP BY csp.part_name
ORDER BY csp.part_name
```

**Pieces without unit_cost** (pre-018 sessions): `COALESCE(unit_cost, 0)` defaults to 0, making avg_unit_cost = 0. Per spec FR-010 and edge-case note: row total shows 0; submission still allowed.

**Alternatives considered**: Computing average directly from `cutting_pieces.unit_cost` — rejected because that column is populated at submission time and may be 0 for older sessions. `cutting_session_parts.unit_cost` is the authoritative per-session cost entered by the user.

---

## Decision 2: Schema Migration Strategy

**Decision**: Use the idempotent `try/catch ALTER TABLE` pattern already established in `electron/main.js` for additive changes. For the `distribution_batches` table, a full recreation migration is required to fix two existing CHECK constraints.

**Rationale**: The existing `distribution_batches` table has two CHECK constraints that are too restrictive:
- `sewing_price_per_piece REAL NOT NULL CHECK (sewing_price_per_piece > 0)` — spec allows 0 (free sewing arrangement, FR-006)
- `total_cost REAL NOT NULL CHECK (total_cost > 0)` — with pieces_cost potentially 0, total could be 0

SQLite does not support modifying CHECK constraints without recreating the table. The project has an established precedent for this pattern (013-parts-distribution-fix migration, lines 608–648 in main.js).

**New columns for `distribution_batches`** (020 migration):
- `pieces_cost REAL` — sum of (quantity × avg_unit_cost) across all part rows
- `sewing_cost REAL` — expected_final_quantity × sewing_price_per_piece (= tailor earnings)
- `materials_cost REAL` — sum of batch consumption costs
- `cost_per_final_item REAL` — total_cost ÷ expected_final_quantity

**Column rename** for clarity:
- `expected_pieces_count` → kept as-is for backward compatibility; `expected_final_quantity` is the new spec field name but maps to the same value

**New column for `distribution_batch_parts`**:
- `avg_unit_cost REAL` — unit cost at time of distribution (for future QC/finition traceability)

**Constraint fixes in recreation**:
- `sewing_price_per_piece REAL NOT NULL CHECK (sewing_price_per_piece >= 0)`
- `total_cost REAL NOT NULL CHECK (total_cost >= 0)`

**Alternatives considered**: Skipping constraint fixes and validating at app level — rejected because the constraints exist in production and `INSERT` will fail for 0-sewing-price distributions.

---

## Decision 3: Tailor Earnings Tracking

**Decision**: No new table required. The `distribution_batches.sewing_cost` column (new) serves as the pending earnings record per distribution. The existing balance formula (`total_earned - total_paid`) updates to use `COALESCE(sewing_cost, total_cost)` to stay backward-compatible with pre-020 records.

**Rationale**: Pre-020, `distribution_batches.total_cost` represented the sewing cost (the only cost tracked). Post-020, `sewing_cost` is the true tailor earnings. Existing records have no `sewing_cost` value (NULL after migration). Using `COALESCE(sewing_cost, total_cost)` ensures old records still contribute correctly to the balance.

**Tailor balance formula** (updated):
```sql
total_earned = SUM(COALESCE(sewing_cost, total_cost)) FROM distribution_batches WHERE tailor_id = ?
settled      = SUM(amount) FROM tailor_payments WHERE tailor_id = ?
pending      = total_earned - settled
```

**Affected queries**: `distribution:getKpis`, `distribution:getSummary`, `distribution:getDetailByTailor` — all use `SUM(total_cost)` for earned; must be updated to `COALESCE(sewing_cost, total_cost)`.

**Alternatives considered**: New `tailor_earnings` table with status (pending/settled) — rejected because it duplicates what `distribution_batches` already expresses and requires additional settlement logic. The existing `tailor_payments` already represents settlement.

---

## Decision 4: Cascading Filter IPC Channels

**Decision**: Add four new IPC channels to `electron/main.js` for the cascading selectors. All query `cutting_pieces` joined to `cutting_sessions` filtered on `status = 'not_distributed'`.

**New channels**:
- `distribution:getModelsWithPieces` — distinct `cs.model_name` values that have at least one not_distributed piece
- `distribution:getSizesForModel(modelName)` — distinct `cp.size_label` values for a model with not_distributed pieces
- `distribution:getColorsForModelSize(modelName, sizeLabel)` — distinct `cp.color` values for a model+size with not_distributed pieces
- `distribution:getPartsWithCostForModelSizeColor(modelName, sizeLabel, color)` — part names + available count + avg_unit_cost (using Decision 1 query)

**Rationale**: The existing `distribution:getAvailablePartsForModel` channel (line 2576) uses a different query pattern tracking distributed/returned quantities — it's designed for the return flow, not the cascading create flow. New dedicated channels keep the logic clean and avoid unintended coupling.

**Alternatives considered**: Extending the existing availability query — rejected because it includes complex return tracking logic that doesn't apply during initial distribution.

---

## Decision 5: Piece Status Update on Distribution

**Decision**: On distribution submission, mark cutting_pieces as `distributed` by selecting exactly `quantity` pieces (FIFO by `created_at`) for each part row (matching `part_name`, `size_label`, `color` and joining session for `model_name`), then bulk-updating their status and inserting `distribution_piece_links` rows. All within the existing atomic transaction pattern.

**FIFO rationale**: Oldest pieces distributed first ensures consistent behavior and avoids cherry-picking.

**Query for piece selection**:
```sql
SELECT cp.id FROM cutting_pieces cp
JOIN cutting_sessions cs ON cs.id = cp.session_id
WHERE cp.status = 'not_distributed'
  AND cs.model_name = ?
  AND cp.size_label = ?
  AND cp.color      = ?
  AND cp.part_name  = ?
ORDER BY cp.created_at ASC
LIMIT ?
```

Then: `UPDATE cutting_pieces SET status='distributed', updated_at=? WHERE id IN (...)` and insert into `distribution_piece_links`.

**Alternatives considered**: Updating all matching pieces in one statement without explicit selection — rejected because it could exceed the requested quantity if available count is higher.

---

## Decision 6: Reuse of ConsumedMaterialsEditor

**Decision**: Reuse `ConsumedMaterialsEditor` component as-is (zero changes). It accepts `nonFabricItems`, `value`, `onChange`, `onBatchChange` — the same pattern used in `CuttingStep3Form.tsx`. Load `nonFabricItems` once on modal mount via `ipcClient.cutting.getNonFabricItems()`.

**Rationale**: The component already handles all batch-level material tracking, collapsed state, count badge, and cost accumulation. No distribution-specific behavior needed.

---

## Decision 7: StepIndicator Component

**Decision**: Reuse the existing `StepIndicator` component (already in the codebase from 016-ui-overhaul). Pass 2 labels: `['معلومات التوزيع', 'مراجعة وتأكيد']`.

---

## Decision 8: Distribution Cost Card

**Decision**: Create a new `DistributionCostCard` component (in `frontend/components/distribution/`) that shows 5 lines: pieces cost, sewing cost, materials cost, total cost (amber bold), and per-item cost. Accepts a `frozen` prop (same pattern as `SessionCostCard` in CuttingStep3Form).

**Rationale**: The cutting session's `SessionCostCard` has 4 lines specific to the cutting domain (fabric, employees, materials, total). The distribution card needs different labels and an additional 5th line (per-item cost). A new component avoids coupling the two domains.

---

## Decision 9: Part Given Rows Editor

**Decision**: Create a new `PartGivenRowsEditor` component (in `frontend/components/distribution/`) separate from the cutting `PartRowsEditor`. The distribution version needs:
- Part select filtered to available parts for model+size+color (with available count in muted text)
- Quantity input validated in real time against available count
- Read-only avg unit cost display
- Read-only row total (quantity × avg_unit_cost)

**Rationale**: The cutting `PartRowsEditor` has a different shape (part + size + count, no cost display). Reusing it would require adding conditional cost display props, increasing coupling between unrelated domains.

---

## Key Implementation Notes

1. **sewing_price_per_piece = 0** is valid. The `distribution_batches` table recreation must use `CHECK (sewing_price_per_piece >= 0)`.
2. **total_cost = 0** is possible if all parts have no unit_cost, sewing is free, and no materials. Table recreation uses `CHECK (total_cost >= 0)`.
3. **Backward-compatible earnings**: All queries that read `total_cost` for tailor balance must be updated to `COALESCE(sewing_cost, total_cost)`.
4. **Atomic submission**: The `distribution:distribute` handler wraps all inserts/updates in `db.transaction(...)` — same as existing pattern.
5. **No hard deletes**: Distribution records are immutable after submission (spec FR-029, FR-030). No delete handler to implement.
