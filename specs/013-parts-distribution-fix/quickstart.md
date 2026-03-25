# Quickstart: Parts Model Correction & Inventory KPIs

**Branch**: `013-parts-distribution-fix` | **Date**: 2026-03-21

## What This Feature Changes

This feature corrects the data model for cutting and distribution:

- **Cutting step 2** now records **named parts** (e.g., "ظهر", "ذراع يمين") with a count, not generic size rows.
- **Parts inventory KPI** shows available count per model + part name in the cutting section.
- **Distribution** records an expected final piece count plus a per-part breakdown of what was given.
- **Returns** remain a flat quantity against a batch (no change to the return flow structure).

## Database Changes Required

Two new tables and one modified table. The migration runs in `electron/main.js` `initializeDatabase()`:

1. **`CREATE TABLE cutting_parts`** — new aggregate parts table
2. **`CREATE TABLE distribution_batch_parts`** — parts breakdown per distribution batch
3. **`distribution_batches` recreation** — adds `expected_pieces_count`, makes `size_label`/`color` nullable

See `data-model.md` for the exact SQL.

## Files to Create

```
electron/db/schema/cutting_part.ts                     # Drizzle reference schema
electron/db/schema/distribution_batch_part.ts          # Drizzle reference schema
frontend/components/cutting/PartsInventoryPanel.tsx    # New KPI panel component
frontend/components/cutting/PartRowsEditor.tsx         # Replaces SizeRowsEditor in step 2
frontend/hooks/useCuttingPartsInventory.ts             # Hook for parts inventory KPI
```

## Files to Modify

### Backend (`electron/main.js`)

| What | Where |
|------|-------|
| `initializeDatabase()` | Add `cutting_parts` table, `distribution_batch_parts` table, migrate `distribution_batches` |
| `cutting:create` handler | Insert into `cutting_parts` instead of per-piece `cutting_pieces` |
| `cutting:getById` handler | Return `parts` from `cutting_parts` instead of size breakdown from `cutting_pieces` |
| `cutting:getKpis` handler | Update totals to use `cutting_parts.count` |
| `cutting:getSizeSuggestions` handler | Replace with `cutting:getPartSuggestions(modelName)` |
| New `cutting:getPartsInventory` handler | Compute available per (model_name, part_name) |
| `distribution:distribute` handler | Create `distribution_batch_parts` rows; store `expected_pieces_count` |
| `distribution:getBatchesForTailor` handler | Include parts breakdown per batch |
| `distribution:getDetailByTailor` handler | Include parts breakdown per batch |
| `distribution:getAvailablePieces` handler | Replace with `distribution:getAvailablePartsForModel(modelName)` |

### Frontend Types

| File | Change |
|------|--------|
| `frontend/features/cutting/cutting.types.ts` | Replace `PieceRow`/`SizeRow` with `PartRow { partName, count }`; update `CreateCuttingSessionPayload` |
| `frontend/features/distribution/distribution.types.ts` | Update `DistributePayload` with `expectedPiecesCount` + `parts[]`; update batch detail types |

### Frontend IPC Client

| File | Change |
|------|--------|
| `frontend/lib/ipc-client.ts` | Remove `getSizeSuggestions`; add `getPartSuggestions`, `getPartsInventory`; update `create`, `getById`; add `getAvailablePartsForModel`; update `distribute`, `getBatchesForTailor`, `getDetailByTailor` |

### Frontend Hooks

| File | Change |
|------|--------|
| `frontend/hooks/useCuttingList.ts` | Update KPI type usage |
| `frontend/hooks/useCuttingDetail.ts` | Update to use `parts` instead of `piecesBySize` |

### Frontend Components

| File | Change |
|------|--------|
| `frontend/components/cutting/CuttingStep2Form.tsx` | Use `PartRowsEditor` instead of `SizeRowsEditor` |
| `frontend/components/cutting/CuttingSessionDetail.tsx` | Render parts breakdown (from `parts[]`) |
| `frontend/components/cutting/CuttingKpiCards.tsx` | Update labels/fields for parts-based totals |
| `frontend/app/(dashboard)/cutting/page.tsx` | Mount `PartsInventoryPanel` |
| `frontend/components/distribution/DistributeModal.tsx` | Add `expectedPiecesCount` field; replace availability table selector with parts breakdown rows |
| `frontend/components/distribution/DistributionTailorDetail.tsx` | Render parts breakdown per batch |
| `frontend/components/distribution/AvailabilityTableSelector.tsx` | Rework to show parts by model |

### Localisation

All new Arabic strings go in `frontend/public/locales/ar/common.json`. New keys needed:
- `cutting.parts` — "الأجزاء"
- `cutting.partName` — "اسم الجزء"
- `cutting.partCount` — "العدد"
- `cutting.partsInventory` — "مخزون الأجزاء"
- `cutting.availableCount` — "المتاح"
- `distribution.expectedPieces` — "القطع المتوقعة"
- `distribution.partsGiven` — "الأجزاء المعطاة"

## Run & Test

```bash
npm run dev:electron   # Start Electron + Next.js dev server
```

**Smoke test checklist**:
1. Create a cutting session with 3 part rows (e.g., ظهر×50, ذراع يمين×90, ذراع يسار×40). Verify session detail shows parts correctly.
2. Open cutting section → parts inventory panel shows "JacketModel — ظهر: 50" etc.
3. Open distribute modal → select model → parts panel shows available counts from step 2.
4. Complete distribution with expected=50, parts: ظهر×50, ذراع يمين×50, ذراع يسار×50. Verify inventory decreases.
5. Record a return of 20 against that batch. Verify batch remaining = 30.
6. Verify old cutting sessions (pre-013) still display correctly (legacy `cutting_pieces` data).
