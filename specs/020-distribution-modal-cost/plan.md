# Implementation Plan: Distribution Modal Redesign & Cost Calculation

**Branch**: `020-distribution-modal-cost` | **Date**: 2026-04-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-distribution-modal-cost/spec.md`

---

## Summary

Redesign the existing `DistributeModal.tsx` into a 2-step stepper with full cost tracking. Step 1 captures all distribution data (cascading selectors, sewing cost inputs, parts given with avg unit cost, consumed materials, live cost card). Step 2 is a read-only review before submission. On submission, cutting pieces are atomically marked as distributed, all six cost fields are stored on the distribution record, and sewing earnings are recorded as pending against the tailor.

---

## Technical Context

**Language/Version**: TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process)
**Primary Dependencies**: Next.js 16 App Router (static export), Electron 41, better-sqlite3, react-hook-form + Zod 4, Tailwind CSS 4, Lucide React
**Storage**: SQLite via better-sqlite3 plain prepared statements in `electron/main.js`; Drizzle ORM schemas in `electron/db/schema/` are reference-only (not executed at runtime)
**Testing**: Manual verification via `quickstart.md`; no automated test framework
**Target Platform**: Desktop (macOS, Electron)
**Project Type**: Desktop application
**Performance Goals**: Cost card updates within 200ms of any input change (SC-002); no DB queries on each keystroke — costs computed in-component from already-loaded data
**Constraints**: RTL (Arabic), dir="rtl" enforced; all monetary values stored with 2 decimal precision; no hard deletes; immutable after submission
**Scale/Scope**: Single-user desktop app; distribution records are expected to number in the hundreds

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Core Data Flow (Page → Hook → IPC → Handler → Service → DB) | PASS | New IPC channels follow Page→Hook→ipcClient→main.js handler pattern |
| Component & Page Discipline (max 150 lines, named exports, no inline styles) | PASS | DistributeStep1Form will likely exceed 150 lines — justified as a form orchestrator (same exception rationale as CuttingStep2Form at 223 lines) |
| Type Safety (strict mode, no `any`) | PASS | All new types defined in distribution.types.ts |
| RTL & Localization First (dir="rtl", no hardcoded strings) | ⚠ NOTE | Arabic strings are currently hardcoded in JSX across the codebase (established pattern) — consistent with existing code |
| UI/UX Consistency (skeleton loaders, error states, loading buttons) | PASS | Modal shows loading state on submit; selectors show disabled state while loading |
| Forms (react-hook-form + Zod + visible labels + toast on success) | PASS | Step 1 uses Zod validation; submit shows loading; success closes modal |

**Complexity Tracking**:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| DistributeStep1Form >150 lines | Multi-section form with 4 cascading selectors, 2 sewing inputs, parts editor, date, consumed materials, and cost card | Splitting into sub-components would require excessive prop drilling across tightly coupled form state |

---

## Project Structure

### Documentation (this feature)

```text
specs/020-distribution-modal-cost/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ipc-distribution.md
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (this feature)

```text
electron/main.js
  ├── Migration 020: distribution_batches table recreation (fix CHECK constraints + add 4 cost columns)
  ├── Migration 020: ALTER TABLE distribution_batch_parts ADD COLUMN avg_unit_cost
  ├── NEW: distribution:getModelsWithPieces handler
  ├── NEW: distribution:getSizesForModel handler
  ├── NEW: distribution:getColorsForModelSize handler
  ├── NEW: distribution:getPartsWithCostForModelSizeColor handler
  └── UPDATED: distribution:distribute handler (new cost fields + piece status update)

frontend/
  lib/ipc-client.ts
    └── UPDATED: add 4 new distribution channels + update distribute() type signature

  features/distribution/distribution.types.ts
    └── UPDATED: add AvailablePartWithCost, DistributeStep1Values, DistributeStep2Values,
                 updated DistributePayload with new cost fields

  components/distribution/
    ├── DistributeModal.tsx             ← REWRITE: 2-step stepper orchestrator
    ├── DistributeStep1Form.tsx         ← NEW: all step 1 inputs
    ├── DistributeStep2Review.tsx       ← NEW: read-only review + confirm
    ├── DistributionCostCard.tsx        ← NEW: 5-line cost summary (shared between steps)
    └── PartGivenRowsEditor.tsx         ← NEW: repeatable part rows with cost display
```

---

## Phase 0: Research ✅

See [research.md](./research.md) for all decisions. Key findings:

1. **Average unit cost**: Computed via `AVG(COALESCE(csp.unit_cost, 0))` from `cutting_session_parts` joined to `cutting_pieces`, filtered to `status = 'not_distributed'`
2. **Schema migration**: Table recreation required for `distribution_batches` (fix `>0` → `>=0` on sewing_price and total_cost CHECK constraints) + 4 new cost columns
3. **Tailor earnings**: No new table — `distribution_batches.sewing_cost` is the earnings record; balance queries updated to use `COALESCE(sewing_cost, total_cost)` for backward compatibility
4. **Cascading filters**: 4 new IPC channels querying `cutting_pieces` + `cutting_sessions` directly
5. **Piece status update**: FIFO selection (ORDER BY created_at ASC, LIMIT qty) + UPDATE + INSERT distribution_piece_links in one transaction
6. **Reuse**: `ConsumedMaterialsEditor` unchanged; `StepIndicator` reused; new `DistributionCostCard` (5 lines, different from cutting's 4-line card)

---

## Phase 1: Design ✅

See [data-model.md](./data-model.md) for entity definitions and migration plan.
See [contracts/ipc-distribution.md](./contracts/ipc-distribution.md) for IPC contracts.
See [quickstart.md](./quickstart.md) for manual verification scenarios.

---

## Implementation Notes for Tasks Phase

### Backend (electron/main.js)

**Migration 020** (added to the sequential migration block):
```js
// 020: distribution_batches — fix CHECK constraints + add cost columns
try { db.prepare('SELECT pieces_cost FROM distribution_batches LIMIT 1').get() }
catch (_) {
  db.pragma('foreign_keys = OFF')
  try {
    db.exec(`ALTER TABLE distribution_batches RENAME TO distribution_batches_old`)
    db.exec(`CREATE TABLE distribution_batches (
      id TEXT PRIMARY KEY,
      tailor_id TEXT NOT NULL REFERENCES tailors(id),
      model_name TEXT NOT NULL,
      size_label TEXT,
      color TEXT,
      part_name TEXT,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      expected_pieces_count INTEGER NOT NULL DEFAULT 0,
      sewing_price_per_piece REAL NOT NULL CHECK (sewing_price_per_piece >= 0),
      total_cost REAL NOT NULL CHECK (total_cost >= 0),
      pieces_cost REAL,
      sewing_cost REAL,
      materials_cost REAL,
      cost_per_final_item REAL,
      distribution_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`)
    db.exec(`INSERT INTO distribution_batches SELECT
      id, tailor_id, model_name, size_label, color, part_name,
      quantity, expected_pieces_count, sewing_price_per_piece, total_cost,
      NULL, NULL, NULL, NULL, distribution_date, created_at, updated_at
      FROM distribution_batches_old`)
    db.exec(`DROP TABLE distribution_batches_old`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_distribution_batches_tailor ON distribution_batches(tailor_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_distribution_batches_date ON distribution_batches(distribution_date)`)
  } finally { db.pragma('foreign_keys = ON') }
}

// 020: avg_unit_cost on distribution_batch_parts
try { db.prepare('SELECT avg_unit_cost FROM distribution_batch_parts LIMIT 1').get() }
catch (_) { db.exec(`ALTER TABLE distribution_batch_parts ADD COLUMN avg_unit_cost REAL`) }
```

**New cascading filter handlers** (4 new `ipcMain.handle` calls):

```js
// distribution:getModelsWithPieces
ipcMain.handle('distribution:getModelsWithPieces', () => {
  const rows = db.prepare(`
    SELECT DISTINCT cs.model_name
    FROM cutting_pieces cp
    JOIN cutting_sessions cs ON cs.id = cp.session_id
    WHERE cp.status = 'not_distributed'
    ORDER BY cs.model_name
  `).all()
  return { success: true, data: rows.map(r => r.model_name) }
})

// distribution:getSizesForModel
ipcMain.handle('distribution:getSizesForModel', (_, { modelName }) => {
  const rows = db.prepare(`
    SELECT DISTINCT cp.size_label
    FROM cutting_pieces cp
    JOIN cutting_sessions cs ON cs.id = cp.session_id
    WHERE cp.status = 'not_distributed' AND cs.model_name = ?
    ORDER BY cp.size_label
  `).all(modelName)
  return { success: true, data: rows.map(r => r.size_label) }
})

// distribution:getColorsForModelSize
ipcMain.handle('distribution:getColorsForModelSize', (_, { modelName, sizeLabel }) => {
  const rows = db.prepare(`
    SELECT DISTINCT cp.color
    FROM cutting_pieces cp
    JOIN cutting_sessions cs ON cs.id = cp.session_id
    WHERE cp.status = 'not_distributed' AND cs.model_name = ? AND cp.size_label = ?
    ORDER BY cp.color
  `).all(modelName, sizeLabel)
  return { success: true, data: rows.map(r => r.color) }
})

// distribution:getPartsWithCostForModelSizeColor
ipcMain.handle('distribution:getPartsWithCostForModelSizeColor', (_, { modelName, sizeLabel, color }) => {
  const rows = db.prepare(`
    SELECT
      csp.part_name,
      COUNT(cp.id) AS available_count,
      AVG(COALESCE(csp.unit_cost, 0)) AS avg_unit_cost
    FROM cutting_pieces cp
    JOIN cutting_sessions cs ON cs.id = cp.session_id
    JOIN cutting_session_parts csp
      ON csp.session_id = cp.session_id
      AND csp.part_name = cp.part_name
      AND csp.size_label = cp.size_label
    WHERE cp.status = 'not_distributed'
      AND cs.model_name = ?
      AND cp.size_label = ?
      AND cp.color = ?
    GROUP BY csp.part_name
    ORDER BY csp.part_name
  `).all(modelName, sizeLabel, color)
  return { success: true, data: rows.map(r => ({
    partName: r.part_name,
    availableCount: r.available_count,
    avgUnitCost: Math.round(r.avg_unit_cost * 100) / 100
  })) }
})
```

**Updated `distribution:distribute` handler** — must also update `distribution:getKpis`, `distribution:getSummary`, and `distribution:getDetailByTailor` queries to use `COALESCE(sewing_cost, total_cost)` for earnings balance.

### Frontend

**`DistributeModal.tsx`** — orchestrator:
- `step: 1 | 2`
- `step1Data: Step1Values | null`
- Loads `nonFabricItems` once on mount
- Computes display values in step 2 from step1Data
- `handleNext1(values: Step1Values)` → sets step1Data, advances to step 2
- `handleSubmit2()` → builds payload, calls `ipcClient.distribution.distribute()`, handles success/error
- Renders `StepIndicator` with labels `['معلومات التوزيع', 'مراجعة وتأكيد']`

**`DistributeStep1Form.tsx`** — step 1 (all inputs):
- Cascading selectors: tailor → model → size → color (each loads data on parent selection change; clears children on change)
- Sewing inputs + live sewing cost line
- `PartGivenRowsEditor` (receives availableParts from `getPartsWithCostForModelSizeColor`)
- Date picker (defaults today)
- `ConsumedMaterialsEditor` (collapsed, count badge)
- `DistributionCostCard` (pinned above footer, live)
- Next disabled until: tailorId, modelName, sizeLabel, color, expectedQty≥1, sewingPrice entered, ≥1 valid part row, date

**`DistributeStep2Review.tsx`** — step 2 (read-only):
- Info grid: tailor name, model, size, color, date
- Parts table: part | quantity | avg unit cost | row total
- Expected final items + sewing price line
- Consumed materials (collapsed, expandable) — only if any
- `DistributionCostCard` with `frozen` prop
- توزيع button (primary) + السابق button

**`DistributionCostCard.tsx`** — shared cost display:
- 5 lines: pieces cost, sewing cost, materials cost, total (amber bold), per-item cost
- `frozen` prop: removes amber when shown in step 2
- Pure display component — no state

**`PartGivenRowsEditor.tsx`** — repeatable part rows:
- Each row: part select (with available count in muted text) | quantity input | read-only avg unit cost + row total | remove button
- إضافة جزء button
- Total pieces cost footer line
- Real-time quantity validation against `availableCount`
- Part deduplication: a part selected in one row cannot be selected again in another

**`distribution.types.ts`** additions:
```typescript
export interface AvailablePartWithCost {
  partName: string;
  availableCount: number;
  avgUnitCost: number;
}

export interface PartGivenRow {
  partName: string;
  quantity: number;
  avgUnitCost: number;
  availableCount: number;
}

export interface Step1Values {
  tailorId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  expectedFinalQuantity: number;
  sewingPricePerPiece: number;
  distributionDate: string;          // ISO date string YYYY-MM-DD
  partRows: PartGivenRow[];
  consumptionRows: ConsumptionRow[];
  materialBatchConsumptions: MaterialBatchConsumption[];
  consumedMaterialsCost: number;
  // Derived costs (computed in modal before passing to step 2)
  piecesCost: number;
  sewingCost: number;
  totalCost: number;
  costPerFinalItem: number;
}
```

**`ipc-client.ts`** additions:
```typescript
distribution: {
  // ... existing channels ...
  getModelsWithPieces: () => ipcClient.invoke('distribution:getModelsWithPieces'),
  getSizesForModel: (p: { modelName: string }) => ipcClient.invoke('distribution:getSizesForModel', p),
  getColorsForModelSize: (p: { modelName: string; sizeLabel: string }) => ipcClient.invoke('distribution:getColorsForModelSize', p),
  getPartsWithCostForModelSizeColor: (p: { modelName: string; sizeLabel: string; color: string }) =>
    ipcClient.invoke('distribution:getPartsWithCostForModelSizeColor', p),
  // distribute: updated type signature (same channel name)
}
```
