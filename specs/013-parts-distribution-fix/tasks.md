# Tasks: Parts Model Correction & Inventory KPIs

**Input**: Design documents from `/specs/013-parts-distribution-fix/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ipc-channels.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US4)
- No tests unless explicitly requested — none requested in this spec.

---

## Phase 1: Setup (Drizzle Reference Schemas)

**Purpose**: Create Drizzle reference schema files for the two new tables. These are reference-only (not executed at runtime) but must exist per project convention.

- [X] T001 [P] Create Drizzle reference schema `electron/db/schema/cutting_part.ts` — table `cutting_parts` with fields: id, session_id (FK → cutting_sessions), part_name, count, created_at, updated_at
- [X] T002 [P] Create Drizzle reference schema `electron/db/schema/distribution_batch_part.ts` — table `distribution_batch_parts` with fields: id, batch_id (FK → distribution_batches), part_name, quantity, created_at, updated_at
- [X] T003 Add all new Arabic localization strings to `frontend/public/locales/ar/common.json` — keys: `cutting.parts`, `cutting.partName`, `cutting.partCount`, `cutting.partsInventory`, `cutting.availableCount`, `cutting.addPart`, `cutting.noPartsAvailable`, `distribution.expectedPieces`, `distribution.partsGiven`, `distribution.partName`, `distribution.quantity`

---

## Phase 2: Foundational — Database Migration

**Purpose**: Apply all schema changes to `electron/main.js` `initializeDatabase()`. This phase BLOCKS all user story work — the new tables must exist before any IPC handler or frontend work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add `cutting_parts` table creation SQL to `electron/main.js` `initializeDatabase()` — columns: id TEXT PK, session_id TEXT NOT NULL REFERENCES cutting_sessions(id), part_name TEXT NOT NULL, count INTEGER NOT NULL CHECK(count > 0), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL; plus two indexes (session_id, part_name). See `data-model.md` for exact SQL.
- [X] T005 [P] Add `distribution_batch_parts` table creation SQL to `electron/main.js` `initializeDatabase()` — columns: id TEXT PK, batch_id TEXT NOT NULL REFERENCES distribution_batches(id), part_name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL; plus one index (batch_id). See `data-model.md` for exact SQL.
- [X] T006 Migrate `distribution_batches` table in `electron/main.js` `initializeDatabase()` using rename-copy-drop pattern inside a transaction — adds `expected_pieces_count INTEGER NOT NULL DEFAULT 0`, makes `size_label` and `color` nullable (remove NOT NULL constraints). Guard with `IF NOT EXISTS` on the new table. Preserve all existing rows. See `data-model.md` for exact migration SQL.
- [X] T007 Update the Electron preload bridge (in `electron/main.js` or `electron/preload/`) to expose new channel names: add `getPartSuggestions`, `getPartsInventory` under cutting; add `getAvailablePartsForModel` under distribution; remove `getSizeSuggestions` from both cutting and distribution; remove `getAvailablePieces` from distribution.

**Checkpoint**: `cutting_parts`, `distribution_batch_parts` tables exist in DB; `distribution_batches` has `expected_pieces_count` column and nullable `size_label`/`color`; preload bridge updated. App still launches without errors.

---

## Phase 3: User Story 1 — View Parts Inventory KPIs (Priority: P1) 🎯 MVP

**Goal**: A parts inventory panel appears in the cutting section showing available count per model + part name, grouped by model. Immediate value without changing any data-entry flows.

**Independent Test**: With an existing cutting session having parts rows (created after Phase 2 + Phase 4), verify the panel shows each (model, part_name) row with correct available count. With no cutting_parts data, verify an empty state message appears.

- [X] T008 Add `cutting:getPartsInventory` IPC handler in `electron/main.js` — query `cutting_parts` joined to `cutting_sessions` and `distribution_batch_parts` joined to `distribution_batches`; return array of `{ modelName, partName, totalProduced, totalDistributed, availableCount }` sorted by modelName then partName; availableCount = totalProduced − totalDistributed. See `contracts/ipc-channels.md` for full response shape.
- [X] T009 [P] Add `PartsInventoryRow` type to `frontend/features/cutting/cutting.types.ts` — `{ modelName: string; partName: string; totalProduced: number; totalDistributed: number; availableCount: number }`
- [X] T010 Add `cutting.getPartsInventory` method to the cutting namespace in `frontend/lib/ipc-client.ts` — `getPartsInventory: () => getBridge().cutting.getPartsInventory()`
- [X] T011 Create `useCuttingPartsInventory` hook in `frontend/hooks/useCuttingPartsInventory.ts` — calls `ipcClient.cutting.getPartsInventory()`, manages loading/error/data state, returns `{ rows, isLoading, error, refetch }`
- [X] T012 [P] [US1] Create `PartsInventoryPanel` component in `frontend/components/cutting/PartsInventoryPanel.tsx` — accepts `rows: PartsInventoryRow[]`, `isLoading: boolean`, `error: string | null`; renders rows grouped by modelName with part_name and availableCount columns; shows skeleton on loading, `EmptyState` when no rows, `ErrorAlert` on error; highlights rows where availableCount === 0 in a distinct visual style; max 150 lines, named export, RTL layout, no hardcoded strings
- [X] T013 [US1] Mount `PartsInventoryPanel` in `frontend/app/(dashboard)/cutting/page.tsx` — call `useCuttingPartsInventory()` and pass props to `PartsInventoryPanel`; place panel below KPI cards and above session table

**Checkpoint**: Navigate to /cutting. Parts inventory panel renders (empty state if no cutting_parts data yet). KPI cards and session table still function. No regressions.

---

## Phase 4: User Story 2 — Cutting Session Produces Named Parts (Priority: P2)

**Goal**: Step 2 of the cutting modal now captures named parts (part_name + count) instead of size rows. Submitted sessions store rows in `cutting_parts`. Session detail view shows the parts breakdown. KPIs update accordingly.

**Independent Test**: Create a new cutting session with 3 part rows (ظهر: 50, ذراع يمين: 90, ذراع يسار: 40). Verify: (a) session appears in list, (b) session detail shows the 3 parts, (c) parts inventory panel now shows these parts under the correct model with correct available counts.

- [X] T014 Replace `cutting:getSizeSuggestions` with `cutting:getPartSuggestions` handler in `electron/main.js` — accepts `{ modelName: string }`, queries `SELECT DISTINCT cp.part_name FROM cutting_parts cp JOIN cutting_sessions cs ON cs.id = cp.session_id WHERE cs.model_name = ? ORDER BY cp.part_name`, returns `string[]`; also remove the old `getSizeSuggestions` handler registration
- [X] T015 Update `cutting:create` IPC handler in `electron/main.js` — replace the loop that inserts individual rows into `cutting_pieces` (one per piece) with a loop that inserts one row per part entry into `cutting_parts` (id, session_id, part_name, count, created_at, updated_at); validate that `parts` array has ≥ 1 item and each count ≥ 1; all inserts remain inside the existing transaction; see `contracts/ipc-channels.md` for updated request shape
- [X] T016 Update `cutting:getById` IPC handler in `electron/main.js` — replace the query that builds `piecesBySize` from `cutting_pieces` with a query that builds `parts` from `cutting_parts` (SELECT part_name, count FROM cutting_parts WHERE session_id = ? ORDER BY part_name); update the returned object shape; see `contracts/ipc-channels.md` for updated response shape
- [X] T017 Update `cutting:getKpis` IPC handler in `electron/main.js` — replace `totalPieces` (count of cutting_pieces rows) with `totalPartsProduced` (SUM of cutting_parts.count) and add `totalPartsAvailable` (totalPartsProduced minus total distributed from distribution_batch_parts); see `contracts/ipc-channels.md` for updated response shape
- [X] T018 [P] Update types in `frontend/features/cutting/cutting.types.ts` — rename/replace `SizeRow`/`PieceRow` with `PartRow { partName: string; count: number }`; update `CreateCuttingSessionPayload.parts` (was `sizes`); update `CuttingSessionDetail` type to use `parts: PartRow[]` instead of `piecesBySize`; update `CuttingKpis` type for new field names
- [X] T019 Update cutting namespace in `frontend/lib/ipc-client.ts` — replace `getSizeSuggestions` with `getPartSuggestions: (payload: { modelName: string }) => ...`; update `create` to use updated `CreateCuttingSessionPayload`; update `getById` return type to use `parts[]`; update `getKpis` return type
- [X] T020 Update `useCuttingDetail` hook in `frontend/hooks/useCuttingDetail.ts` — update type references from `piecesBySize` to `parts[]` following the updated `CuttingSessionDetail` type
- [X] T021 [P] Update `useCuttingList` hook in `frontend/hooks/useCuttingList.ts` — update `CuttingKpis` type references to use `totalPartsProduced`/`totalPartsAvailable` field names
- [X] T022 [P] [US2] Create `PartRowsEditor` component in `frontend/components/cutting/PartRowsEditor.tsx` — renders a list of `{ partName, count }` rows with add/remove controls; `partName` uses a combobox with autocomplete from `getPartSuggestions(modelName)`; `count` is a numeric input ≥ 1; follows same pattern as existing `ConsumptionRowsEditor`; max 150 lines, named export, RTL, no hardcoded strings
- [X] T023 [US2] Update `CuttingStep2Form` in `frontend/components/cutting/CuttingStep2Form.tsx` — replace `SizeRowsEditor` (or `PartSizeRowsEditor`) usage with `PartRowsEditor`; pass `modelName` prop for autocomplete scoping; update Zod schema validation: `parts` array min length 1, each item `partName: z.string().min(1)` and `count: z.number().int().min(1)`
- [X] T024 [US2] Update `CuttingSessionDetail` in `frontend/components/cutting/CuttingSessionDetail.tsx` — replace the size-based pieces breakdown section with a parts breakdown table: columns "اسم الجزء" (partName) and "العدد" (count), populated from `session.parts[]`; show `EmptyState` if parts array is empty (legacy sessions)
- [X] T025 [P] [US2] Update `CuttingKpiCards` in `frontend/components/cutting/CuttingKpiCards.tsx` — update displayed fields from `totalPieces`/`piecesNotDistributed` to `totalPartsProduced`/`totalPartsAvailable`; update Arabic label strings to use new localization keys

**Checkpoint**: Create a new cutting session. Verify step 2 shows part name + count rows with autocomplete. Submit — session appears in list. Click session — detail shows parts breakdown. Parts inventory panel shows the new parts. Old sessions (with piecesBySize) gracefully show empty parts section.

---

## Phase 5: User Story 3 — Distribute Pieces with Parts Breakdown (Priority: P3)

**Goal**: The Distribute modal records an expected final piece count and a parts breakdown (one or more part rows). Distribution deducts parts from the available inventory. History views show both the expected count and parts breakdown per batch.

**Independent Test**: With cutting_parts data available, open Distribute → select model → see available parts with counts → enter expectedPiecesCount=50 and parts breakdown → submit. Verify: inventory decreases, batch history shows expected count + parts, tailor balance updates.

- [X] T026 Add `distribution:getAvailablePartsForModel` IPC handler in `electron/main.js` — accepts `{ modelName: string }`, runs the parts inventory derived query filtered to the given model, returns `Array<{ partName: string; availableCount: number }>` with only rows where availableCount > 0; remove `distribution:getAvailablePieces` handler (or leave as deprecated stub returning empty)
- [X] T027 Update `distribution:distribute` IPC handler in `electron/main.js` — updated request shape: `{ tailorId, modelName, expectedPiecesCount, sewingPricePerPiece, distributionDate, parts: [{partName, quantity}] }`; validate: each part quantity ≤ available count; compute `total_quantity = Σ(parts[].quantity)`, `total_cost = expectedPiecesCount × sewingPricePerPiece`; insert `distribution_batches` with `expected_pieces_count = expectedPiecesCount`, `quantity = total_quantity`, `size_label = NULL`, `color = NULL`; insert one `distribution_batch_parts` row per part; do NOT insert `distribution_piece_links`; see `contracts/ipc-channels.md` for full spec
- [X] T028 Update `distribution:getBatchesForTailor` IPC handler in `electron/main.js` — add a sub-query joining `distribution_batch_parts` to fetch parts per batch; include `expectedPiecesCount`, `parts[]`, and `quantityRemaining = quantity - Σ(return_records.quantity_returned)` in each returned batch object; see `contracts/ipc-channels.md` for updated response shape
- [X] T029 Update `distribution:getDetailByTailor` IPC handler in `electron/main.js` — add parts breakdown from `distribution_batch_parts` to each batch in the response; include `expectedPiecesCount`; see `contracts/ipc-channels.md` for updated response shape
- [X] T030 [P] Update `frontend/features/distribution/distribution.types.ts` — add `expectedPiecesCount: number` and `parts: Array<{ partName: string; quantity: number }>` to `DistributePayload`; add `parts[]` and `expectedPiecesCount` to `DistributionBatchRow` and `DistributionBatchOption`; remove `sizeLabel`/`color` from `DistributePayload` (they are no longer user inputs)
- [X] T031 Update distribution namespace in `frontend/lib/ipc-client.ts` — add `getAvailablePartsForModel: (payload: { modelName: string }) => ...`; remove `getAvailablePieces` and `getSizeSuggestions`; update `distribute` signature to use new `DistributePayload`; update `getBatchesForTailor` and `getDetailByTailor` return types to include `parts[]`
- [X] T032 [P] Update `useDistributionDetail` hook in `frontend/hooks/useDistributionDetail.ts` — update type references to include `parts[]` and `expectedPiecesCount` per batch
- [X] T033 [US3] Update `DistributeModal` in `frontend/components/distribution/DistributeModal.tsx` — replace the old `AvailabilityTableSelector` (model+size+color+quantity flow) with: (1) model selector using `getModelSuggestions`, (2) `expectedPiecesCount` numeric input ≥ 1, (3) sewing price input, (4) parts breakdown section — a dynamic list of rows each with a part name (populated from `getAvailablePartsForModel`, showing available count) and quantity input (validated ≤ available). At least one parts row required. Update Zod validation schema accordingly. RTL layout, no hardcoded strings.
- [X] T034 [US3] Update `DistributionTailorDetail` in `frontend/components/distribution/DistributionTailorDetail.tsx` — for each batch row, show `expectedPiecesCount` and an expandable or inline parts breakdown table (`partName`, `quantity` columns) populated from `batch.parts[]`; gracefully handle legacy batches where `parts[]` is empty (show a "-" or "legacy" indicator)
- [X] T035 [P] [US3] Update `AvailabilityTableSelector` in `frontend/components/distribution/AvailabilityTableSelector.tsx` — repurpose or replace to show parts available for a selected model (calls `getAvailablePartsForModel`), rendering rows with partName and availableCount; used as a reference panel inside DistributeModal rather than a row-click selector

**Checkpoint**: Open Distribute modal. Select model — parts panel shows available counts. Enter expected count + parts breakdown. Submit — batch appears in tailor history with expected count + parts breakdown. Parts inventory panel decreases accordingly. Legacy batches still render in distribution history.

---

## Phase 6: User Story 4 — Return Parts Increase Inventory (Priority: P4)

**Goal**: Returns are recorded as flat quantity against a batch. The parts inventory available counts update to reflect that fewer parts are outstanding. The Return modal shows the batch's parts context so the user knows what they distributed.

**Independent Test**: After distributing a batch of expectedPiecesCount=50, record a return of 20. Verify batch shows remaining=30. Verify parts inventory available counts increase proportionally. Record second return of 30. Verify batch shows fully returned.

- [X] T036 Update `distribution:return` IPC handler in `electron/main.js` — add validation that `quantity_returned ≤ batch.quantity − Σ(existing return_records.quantity_returned)` (i.e., cannot over-return); the existing logic of inserting into `return_records` and `return_consumption_entries` is unchanged structurally; remove any logic that marks individual `cutting_pieces` IDs as "returned" (not applicable for new batches); for legacy batches (with `distribution_piece_links`), retain the old piece-status update logic conditionally
- [X] T037 Update `cutting:getPartsInventory` IPC handler in `electron/main.js` (refinement of T008) — adjust the available count formula to account for returns: for each batch, `net_distributed_per_part = dbp.quantity × (1 − batch_return_ratio)` where `batch_return_ratio = Σ(rr.quantity_returned) / db.quantity`; this ensures returned parts proportionally flow back to per-part available counts; update the query accordingly
- [X] T038 [US4] Update `ReturnModal` in `frontend/components/distribution/ReturnModal.tsx` — when a batch is selected, display its parts breakdown (from `batch.parts[]`) as read-only context so the user can see what was originally distributed; the return quantity input remains a single flat number ≤ `batch.quantityRemaining`; no structural changes to the return submission flow
- [X] T039 [US4] Verify `PartsInventoryPanel` reflects correct counts after a return — manual integration check: create session with parts, distribute, return partial quantity, confirm KPI panel counts increase by the proportional returned amounts; if the T037 query is incorrect, fix the formula in `cutting:getPartsInventory`

**Checkpoint**: Full lifecycle test — cut → distribute → partial return → verify inventory counts at each step. Full return → verify batch shows as fully returned and inventory fully restored.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T040 Verify legacy cutting sessions (pre-013, with data in `cutting_pieces`) display correctly — open any old session detail in `CuttingSessionDetail`; confirm graceful empty state for `parts[]` section with no errors; confirm old KPI data (from `cutting_pieces`) is still accessible if needed
- [X] T041 [P] Verify legacy distribution batches (pre-013, with `size_label`/`color` set and `distribution_piece_links` data) display correctly in `DistributionTailorDetail` — confirm parts breakdown shows gracefully empty or "legacy" for old batches; confirm returns still work on old batches
- [X] T042 [P] Remove or stub any remaining references to deprecated IPC channels (`cutting:getSizeSuggestions`, `distribution:getAvailablePieces`, `distribution:getSizeSuggestions`) from the frontend to avoid TypeScript type errors
- [X] T043 Run full smoke test checklist from `quickstart.md` — create new cutting session with 3+ parts, verify parts inventory KPI, distribute to tailor with parts breakdown, record partial return, verify all screens reflect correct state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately. T001, T002, T003 are all parallel.
- **Phase 2 (Foundation)**: Depends on Phase 1 completion. T004–T007 must complete before any user story work.
  - T004, T005 are parallel (different tables)
  - T006 depends on T004 completing (the old table must exist before migration runs)
  - T007 can run after T004–T006 draft is known (doesn't depend on DB changes)
- **Phase 3 (US1)**: Depends on Phase 2. T008–T013 in sequence within the phase.
- **Phase 4 (US2)**: Depends on Phase 2. Can run in parallel with Phase 3 (different files).
- **Phase 5 (US3)**: Depends on Phase 2. Can start after Phase 4 is complete (uses distribution_batch_parts and parts inventory query from Phase 4).
- **Phase 6 (US4)**: Depends on Phase 5. T036–T039 build on the distribute flow.
- **Phase 7 (Polish)**: Depends on all user story phases completing.

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 foundation. No dependency on US2/US3/US4.
- **US2 (P2)**: Depends only on Phase 2. Can run in parallel with US1.
- **US3 (P3)**: Depends on US2 (needs `cutting_parts` data and parts inventory query to exist).
- **US4 (P4)**: Depends on US3 (needs distribution_batch_parts and `getBatchesForTailor` parts to exist).

### Parallel Opportunities Within Each Phase

**Phase 2**: T004 ‖ T005, then T006, then T007
**Phase 3 + Phase 4**: Can run concurrently (different files entirely)
**Within Phase 4**: T018 ‖ T021 ‖ T022 ‖ T025 (different files, no shared state)
**Within Phase 5**: T030 ‖ T032 ‖ T035 (different files)
**Phase 7**: T040 ‖ T041 ‖ T042

---

## Parallel Example: Phase 3 + Phase 4

```
# After Phase 2 completes, launch Phase 3 and Phase 4 in parallel:

[Thread A — US1 Parts Inventory KPI]
T008 → T009 → T010 → T011 → T012 → T013

[Thread B — US2 Cutting Parts Model]
T014 → T015 → T016 → T017 (backend, sequential)
T018 ‖ T021 ‖ T022 ‖ T025 (frontend types+components, parallel)
→ T019 → T020 → T023 → T024 (frontend IPC + forms, sequential)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundation (T004–T007) — **CRITICAL**
3. Complete Phase 3: US1 (T008–T013)
4. **STOP AND VALIDATE**: Parts inventory panel visible in /cutting with empty state. No regressions on existing cutting/distribution flows.

### Incremental Delivery

1. Phase 1 + Phase 2 → DB ready, preload updated
2. Phase 3 (US1) → Parts inventory KPI panel visible (read-only value from day 1)
3. Phase 4 (US2) → Cutting sessions now produce named parts; KPI panel populates
4. Phase 5 (US3) → Distribution flow corrected with parts breakdown
5. Phase 6 (US4) → Returns update inventory correctly
6. Phase 7 → Legacy compatibility confirmed, smoke tests pass

---

## Notes

- [P] = task can run in parallel with other [P] tasks in the same phase (different files, no unresolved dependencies)
- Legacy data compatibility is critical — old sessions and batches must remain fully viewable
- The Drizzle schema files (T001, T002) are reference-only; the actual DB tables are created by the SQL in `electron/main.js` (T004–T006)
- For T006 (distribution_batches migration): the rename-copy-drop must be wrapped in `BEGIN`/`COMMIT` and guarded by checking if the migration already ran (e.g., check column existence before proceeding)
- For T015 (`cutting:create` update): the old per-piece `cutting_pieces` insert logic must be retained for debugging/legacy compatibility or clearly removed — do not silently break old session creation path if it is still exercised by the app
- T039 is a verification task that may require looping back to fix T037's query — mark T037 complete only after T039 confirms correct counts
