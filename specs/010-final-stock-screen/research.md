# Research: Final Stock Screen

**Feature**: 010-final-stock-screen | **Phase**: 0 | **Date**: 2026-03-17

## Decision: Schema Migration for part_name

- **Decision**: ADD COLUMN `part_name TEXT` (nullable, no default) to `final_stock_entries`
- **Rationale**: SQLite `ALTER TABLE ... ADD COLUMN` with no NOT NULL constraint and no default is safe and idempotent-wrappable; existing rows receive NULL automatically, which correctly represents the "no part" bucket per the spec
- **Alternatives considered**: (1) Create a new table — rejected, data continuity and simpler queries favor extending existing table; (2) Store null as empty string — rejected, NULL is semantically correct and GROUP BY already treats NULL as a distinct group
- **Implementation**: Added to the existing idempotent migration loop in `electron/main.js` alongside other `ALTER TABLE` statements

## Decision: Filter Options Source

- **Decision**: Use existing `lookups:getModels`, `lookups:getSizes`, `lookups:getColors` IPC channels via `useLookups` hook
- **Rationale**: Spec FR-007 states filters must be populated from "the same managed lookup lists used throughout the app"; reusing existing channels avoids duplication
- **Alternatives considered**: Derive distinct values from `final_stock_entries` — rejected, this would show only currently-stocked values, not all managed items as the spec requires

## Decision: KPI Query

- **Decision**: Single SQL query computing all 3 KPIs at once
```sql
SELECT
  COALESCE(SUM(quantity), 0) AS total_pieces,
  COUNT(DISTINCT model_name) AS total_distinct_models,
  COUNT(DISTINCT size_label || '|' || color) AS total_distinct_size_color_combos
FROM final_stock_entries
```
- **Rationale**: One round-trip, no application-level aggregation needed

## Decision: Grouped Rows Query

- **Decision**: Server-side GROUP BY with null-safe filter bindings
```sql
SELECT model_name, part_name, size_label, color,
       SUM(quantity) AS current_quantity, MAX(entry_date) AS last_updated_date
FROM final_stock_entries
WHERE (? IS NULL OR model_name = ?)
  AND (? IS NULL OR size_label = ?)
  AND (? IS NULL OR color = ?)
GROUP BY model_name, part_name, size_label, color
ORDER BY model_name, part_name, size_label, color
```
- **Rationale**: NULL in GROUP BY creates a separate group — null part_name automatically forms its own bucket without special logic; server-side filtering avoids sending unneeded data

## Decision: History Query (null-safe part_name equality)

- **Decision**: Use SQLite `IS` operator for null-safe equality on `part_name`
```sql
SELECT id, source_type, source_id, quantity, entry_date
FROM final_stock_entries
WHERE model_name = ? AND part_name IS ? AND size_label = ? AND color = ?
ORDER BY entry_date ASC
```
- **Rationale**: `x IS y` in SQLite is equivalent to `(x = y OR (x IS NULL AND y IS NULL))` — correctly matches both null and non-null part_name values with a single bound parameter

## Decision: Navigation from History Entries

- **Decision**: Both `finition` and `finition_step` source types navigate to `/qc?id={sourceId}`
- **Rationale**: The existing QC page handles finition record deep-linking via `?id=` param; both source types originate from records visible in the QC/Finition screen
- **Alternatives considered**: Separate routes per source type — deferred, exact deep-linking to be refined per spec assumption
