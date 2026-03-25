# Research: Cutting Parts Size/Color Enhancements

## Decision 1: Parts Association with Models

**Decision**: Parts remain a flat global lookup list. No model-parts junction table is added.

**Rationale**: The user's intent is that the parts *dropdown* comes from the global settings list (not free-text). The accumulation is tracked by (model_name, size_label, color, part_name) in the `cutting_parts` aggregate table — so inventory is model-specific without requiring a DB-level model→parts constraint. Adding a junction table would require changes to the settings UI (model-part management screen) which is out of scope.

**Alternatives considered**: `model_parts` junction table — rejected (scope creep, settings UI changes needed, parts are generic enough to reuse across models).

---

## Decision 2: `cutting_parts` Table Architecture — Aggregate + Log

**Decision**: Split into two tables:
- `cutting_parts` (aggregate): one row per `(model_name, size_label, color, part_name)` with accumulated count. `UNIQUE(model_name, size_label, color, part_name)`. UPSERT on insert.
- `cutting_session_parts` (log): one row per session+part for per-session history detail view.

**Rationale**: The existing `cutting_parts` table uses `session_id` as FK and creates one row per session-part, making it impossible to upsert/accumulate. The aggregate table enables the inventory query to be a simple SELECT without complex aggregation over sessions. The log table preserves session detail history.

**Alternatives considered**: Keep one table with session_id and GROUP BY in queries — rejected (proportional return attribution query becomes complex with per-session rows; UPSERT requires a unique constraint that conflicts with per-session granularity).

---

## Decision 3: Size at Session Level, Color from Fabric

**Decision**: `size_label` is added to `cutting_sessions` (session-level field). Color continues to come from `fabric_color` on the session. Both are propagated to `cutting_parts` aggregate on insert.

**Rationale**: A single cutting session cuts a specific size of a model (you don't cut mixed sizes in one session). Storing size at session level is consistent with how fabric_color is already stored. This keeps the parts entry form simple (no per-row size/color input).

**Alternatives considered**: Per-part-row size — rejected (UX complexity, a session realistically cuts one size at a time).

---

## Decision 4: Distribution Form — Model + Size + Color Selection

**Decision**: The distribution form adds size (from sizes lookup) and color (from colors lookup) dropdowns after model selection. `getAvailablePartsForModel` is extended to accept `sizeLabel` and `color` as filters. Only parts with `availableCount > 0` for the selected combination are shown.

**Rationale**: Parts inventory is now keyed by (model, size, color, part_name). Distribution must target a specific combination to correctly deduct inventory.

**Alternatives considered**: Auto-detect size/color from available parts — rejected (a model may have parts in multiple sizes/colors; the user must explicitly choose which variant they're distributing).

---

## Decision 5: Migration Strategy

**Decision**:
- `cutting_sessions`: `ALTER TABLE ... ADD COLUMN size_label TEXT NOT NULL DEFAULT ''` (safe, idempotent).
- `cutting_parts`: Rename-copy-drop to replace with new aggregate schema + new columns + UNIQUE constraint. Use `legacy_alter_table = ON` during rename to prevent FK cascade.
- `cutting_session_parts`: `CREATE TABLE IF NOT EXISTS` (new table, no migration needed).
- Guard condition: check if `cutting_parts` has `model_name` column — if not, run migration.

**Rationale**: SQLite does not support `ADD COLUMN` with UNIQUE constraints, so rename-copy-drop is required. The DB was cleared during testing so there's no data to lose, but the migration guard handles safe re-runs.

---

## Decision 6: Final Stock Filters — Already Implemented

**Decision**: No changes required to the final stock filtering logic. `FinalStockTable` already has model/size/color filter dropdowns connected to `useFinalStockList` which passes them to `final-stock:getRows`. The backend service needs to be verified to apply these filters.

**Rationale**: Reviewing `useFinalStockList.ts` and `FinalStockTable.tsx` shows filters are already wired. Only verification + potential backend filter fix needed.
