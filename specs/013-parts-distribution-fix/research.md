# Research: Parts Model Correction & Inventory KPIs

**Branch**: `013-parts-distribution-fix` | **Date**: 2026-03-21

---

## 1. Existing Schema State

### Decision: Keep `cutting_pieces` as legacy; introduce `cutting_parts` as the new aggregate table

**Rationale**: `cutting_pieces` stores one row per physical piece (e.g., 50 individual rows for 50 backs). The new model needs one aggregate row per part type per session (e.g., one row: "Back, count=50"). These are fundamentally incompatible row semantics. Creating a new `cutting_parts` table avoids altering live data and allows old sessions to remain readable while new sessions use the correct model.

**Alternatives considered**:
- Repurpose `cutting_pieces` by adding a `count` column and making `size_label` nullable — rejected because it creates ambiguity between old rows (count=1, size_label set) and new rows (count=N, size_label null), complicating every query.
- In-place migration of all existing rows — rejected because the spec explicitly excludes existing data migration from scope.

---

## 2. Distribution Batch Structure

### Decision: Add `distribution_batch_parts` child table; patch `distribution_batches` to relax legacy constraints

**Rationale**: The current `distribution_batches` table is scoped to one row per (model, size, color) combination with `size_label NOT NULL` and `color NOT NULL`. The new model batches by (tailor, model, expected_pieces_count) with a child `distribution_batch_parts` table holding the per-part quantities. Two changes are needed:
1. Add `expected_pieces_count INTEGER` to `distribution_batches`.
2. Make `size_label` and `color` nullable so new batches can be inserted without these legacy fields.

**SQLite migration strategy**: SQLite does not support `ALTER TABLE ... ALTER COLUMN` to remove NOT NULL. The `initializeDatabase()` function in `electron/main.js` will recreate `distribution_batches` using the rename-copy-drop pattern inside an explicit transaction. Existing batch rows are preserved; old `distribution_piece_links` rows remain valid.

**Alternatives considered**:
- Insert empty strings for `size_label`/`color` in new distributions — rejected as dirty hack that makes queries confusing.
- New `distribution_batches_v2` table — rejected as it duplicates the tailor FK, indexes, and all downstream joins.

---

## 3. Parts Inventory Computation

### Decision: Per-part availability = Σ(cutting_parts.count) − Σ(distribution_batch_parts.quantity), grouped by model_name + part_name; returns restore a flat count at the batch level only

**Rationale**: Returns are recorded as a flat quantity against a batch (no per-part breakdown). It is therefore mathematically impossible to restore per-part inventory precisely after a return. The cleanest correct formula is:

```
available(model, part_name) =
  SUM(cp.count  FROM cutting_parts cp
      JOIN cutting_sessions cs ON cs.id = cp.session_id
      WHERE cs.model_name = model AND cp.part_name = part_name)
  −
  SUM(dbp.quantity FROM distribution_batch_parts dbp
      JOIN distribution_batches db ON db.id = dbp.batch_id
      WHERE db.model_name = model AND dbp.part_name = part_name)
```

Returns reduce the batch's `quantity_remaining` (computed as `quantity − Σ return_records.quantity_returned`) but are not mapped to individual part types.

**Implication on SC-002**: The spec formula "available = produced − distributed + total returned" applies at the model level for the overall count. Per-part KPI shows `produced − distributed`; the system does not attempt to re-attribute returned parts to specific part types.

**Alternatives considered**:
- Proportional return attribution (returned quantity split by original batch part ratios) — rejected as overly complex and misleading when batch part quantities are unequal.
- Require per-part breakdown on return — this was the Q1:A option, rejected by user in favour of flat quantity.

---

## 4. `distribution_piece_links` Table

### Decision: Retain as legacy; not used for new distributions

**Rationale**: The existing table links individual `cutting_pieces` IDs to old batches. New distributions link to `cutting_parts` via `distribution_batch_parts`. The legacy table is kept so existing batch detail views remain correct. No FK relationships are broken.

---

## 5. `cutting:getSizeSuggestions` IPC Channel

### Decision: Replaced by `cutting:getPartSuggestions(modelName)` — scoped to model

**Rationale**: The new cutting step 2 uses part names, not size labels. Autocomplete must be scoped to the current session's model name to return relevant suggestions. The old `getSizeSuggestions` queried `cutting_pieces.size_label` globally; the new channel queries `cutting_parts.part_name WHERE session.model_name = ?`.

---

## 6. Distribution Availability Query

### Decision: Replace `distribution:getAvailablePieces` with `distribution:getAvailablePartsForModel(modelName)` returning per-part available counts

**Rationale**: The old handler accepted (modelName, sizeLabel, color) and returned a single count. The new distribute modal selects a model first, then sees all available parts for that model. A single query returning all (part_name, available_count) rows for the model is more efficient and fits the new UI pattern.

---

## 7. Pieces Module (Feature 012)

### Decision: `pieces:getAvailability` remains functional but targets `cutting_pieces` (legacy data); parts inventory is separate via `cutting:getPartsInventory`

**Rationale**: Feature 012 built a pieces availability screen that reads from `cutting_pieces`. This screen still works for old data. The new parts inventory KPI is served by a separate `cutting:getPartsInventory` handler reading from `cutting_parts`. The two are additive — no removal of the 012 pieces screen is required.

---

## 8. IPC Channels — Net Change Summary

| Channel | Action | Notes |
|---------|--------|-------|
| `cutting:getSizeSuggestions` | Replace | Replaced by `cutting:getPartSuggestions` |
| `cutting:getPartSuggestions` | New | Returns distinct part names for a given model |
| `cutting:getPartsInventory` | New | Returns (model_name, part_name, available_count) rows |
| `cutting:create` | Update | Inserts `cutting_parts` rows instead of per-piece `cutting_pieces` rows |
| `cutting:getById` | Update | Returns parts breakdown from `cutting_parts` instead of size breakdown from `cutting_pieces` |
| `cutting:getKpis` | Update | Remove "total pieces" KPI (no longer meaningful); add parts-based totals if needed |
| `distribution:getAvailablePieces` | Replace | Replaced by `distribution:getAvailablePartsForModel` |
| `distribution:getAvailablePartsForModel` | New | Returns (part_name, available_count) for a model |
| `distribution:distribute` | Update | Creates `distribution_batch_parts` rows; adds expected_pieces_count |
| `distribution:getBatchesForTailor` | Update | Includes parts breakdown per batch |
| `distribution:getDetailByTailor` | Update | Includes parts breakdown in batch history |
| `distribution:getSizeSuggestions` | Remove | No longer needed |
| `distribution:getModelSuggestions` | Retain | Still useful for selecting model in distribute modal |
