# Tasks: Cutting Parts Size/Color Enhancements

**Input**: Design documents from `/specs/014-cutting-parts-size-color/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

---

## Phase 1: Setup

**Purpose**: Shared types, locale strings, and Drizzle reference schemas — no business logic, blocks all stories.

- [X] T001 Add Arabic locale strings for size, color-from-fabric, parts-from-settings, and filter labels to `frontend/public/locales/ar/common.json`
- [X] T002 [P] Create Drizzle reference schema `electron/db/schema/cutting_session_part.ts` with fields: id, session_id, part_name, count, created_at, updated_at
- [X] T003 [P] Update Drizzle reference schema `electron/db/schema/cutting_part.ts` — replace session_id with model_name, size_label, color; add UNIQUE constraint comment

---

## Phase 2: Foundational (DB Migrations — blocks all stories)

**Purpose**: All three DB schema changes must land before any IPC handler or UI work can be tested end-to-end.

**⚠️ CRITICAL**: No user story work can be tested end-to-end until this phase is complete.

- [X] T004 In `electron/main.js` `initializeDatabase()`: add `CREATE TABLE IF NOT EXISTS cutting_session_parts` with fields: id TEXT PK, session_id TEXT NOT NULL REFERENCES cutting_sessions(id), part_name TEXT NOT NULL, count INTEGER NOT NULL CHECK (count > 0), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL; add index `idx_cutting_session_parts_session ON cutting_session_parts(session_id)`
- [X] T005 In `electron/main.js` after `initializeDatabase()`: add idempotent migration to add `size_label TEXT NOT NULL DEFAULT ''` to `cutting_sessions` using try/catch guard (`SELECT size_label FROM cutting_sessions LIMIT 1`)
- [X] T006 In `electron/main.js` after T005 migration: add migration to redesign `cutting_parts` as aggregate table — guard on `SELECT model_name FROM cutting_parts LIMIT 1`; use `legacy_alter_table = ON` + `foreign_keys = OFF`; rename old table to `cutting_parts_old`; CREATE new table with: id TEXT PK, model_name TEXT NOT NULL, size_label TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '', part_name TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, UNIQUE(model_name, size_label, color, part_name); INSERT from old (joining cutting_sessions for model_name and fabric_color); DROP old; CREATE indexes `idx_cutting_parts_model` and `idx_cutting_parts_combo`

**Checkpoint**: DB migrations complete — run app and verify all three schema changes applied.

---

## Phase 3: User Story 1 — Cutting Session with Size, Lookup Parts, Fabric Color (Priority: P1) 🎯 MVP

**Goal**: User creates a cutting session selecting model from lookup, size from lookup, with color auto-set from fabric. Parts are selected from settings lookup. Session and parts saved correctly.

**Independent Test**: Create a session via the new form, then verify the session detail shows size and the parts inventory panel shows the new (model, size, color, part) aggregate rows.

### Implementation for User Story 1

- [X] T007 [US1] In `frontend/features/cutting/cutting.types.ts`: add `sizeLabel: string` to `CreateCuttingSessionPayload`, `CuttingSessionSummary`, and `CuttingSessionDetail`; update `PartsInventoryRow` to add `sizeLabel: string` and `color: string`
- [X] T008 [US1] In `frontend/features/auth/auth.types.ts`: update `ipcBridge.cutting` — add `getAvailableSizesForModel` and `getAvailableColorsForModelSize` channel declarations; update `getAvailablePartsForModel` payload to include `sizeLabel` and `color`
- [X] T009 [US1] In `frontend/lib/ipc-client.ts`: add `getAvailableSizesForModel`, `getAvailableColorsForModelSize` under `cutting`; update `getAvailablePartsForModel` signature to accept `{ modelName, sizeLabel, color }`
- [X] T010 [US1] In `electron/main.js`: update `cutting:create` handler — destructure `sizeLabel` from payload; include `size_label` in `cutting_sessions` INSERT; add INSERT into `cutting_session_parts` per part row; replace `cutting_parts` INSERT with UPSERT: `INSERT INTO cutting_parts (id, model_name, size_label, color, part_name, count, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(model_name, size_label, color, part_name) DO UPDATE SET count = count + excluded.count, updated_at = excluded.updated_at`; use `fabricColor` and `sizeLabel` as aggregate key fields
- [X] T011 [US1] In `electron/main.js`: update `cutting:getById` handler — add `size_label` to the `cutting_sessions` SELECT; change parts query from `cutting_parts WHERE session_id = ?` to `cutting_session_parts WHERE session_id = ?`; add `sizeLabel: s.size_label` to response
- [X] T012 [P] [US1] In `electron/main.js`: update `cutting:getAll` handler — add `cs.size_label` to SELECT; add `sizeLabel: s.size_label` to each mapped result
- [X] T013 [P] [US1] In `electron/main.js`: update `cutting:getPartSuggestions` handler — replace session-join query with `SELECT DISTINCT part_name FROM cutting_parts WHERE model_name = ? ORDER BY part_name`
- [X] T014 [US1] In `electron/main.js`: rewrite `cutting:getPartsInventory` handler — query `cutting_parts` aggregate joined with `distribution_batch_parts` via model/size/color match; return rows with `sizeLabel` and `color` fields; use the subquery pattern from contracts/ipc-channels.md
- [X] T015 [P] [US1] In `electron/main.js`: add `cutting:getAvailableSizesForModel` handler — `SELECT DISTINCT size_label FROM cutting_parts WHERE model_name = ? AND size_label != '' AND count > 0 ORDER BY size_label`
- [X] T016 [P] [US1] In `electron/main.js`: add `cutting:getAvailableColorsForModelSize` handler — `SELECT DISTINCT color FROM cutting_parts WHERE model_name = ? AND size_label = ? AND color != '' AND count > 0 ORDER BY color`
- [X] T017 [P] [US1] In `electron/preload.js`: expose `getAvailableSizesForModel` and `getAvailableColorsForModelSize` on the `cutting` bridge object
- [X] T018 [US1] In `frontend/components/cutting/CuttingStep1Form.tsx`: add Size dropdown using `ipcClient.lookups.getSizes()` loaded in `useEffect`; add `sizeLabel: z.string().min(1, 'المقاس مطلوب')` to Zod schema; include `sizeLabel` in `Step1Values` export; position the size field after the model dropdown
- [X] T019 [US1] In `frontend/components/cutting/NewCuttingSessionModal.tsx`: add `sizeLabel: step1Data.sizeLabel` to the `ipcClient.cutting.create()` call payload
- [X] T020 [US1] In `frontend/components/cutting/PartRowsEditor.tsx`: replace the `<input list>` + datalist approach with a `<select>` populated from `ipcClient.lookups.getParts()` loaded in `useEffect`; keep `modelName` prop but use the full parts list (all active parts from settings); display "اختر الجزء" as default option; part name is the selected value
- [X] T021 [US1] In `frontend/components/cutting/CuttingSessionDetail.tsx`: add display of `sizeLabel` in the session header metadata section (alongside modelName, fabricColor)
- [X] T022 [P] [US1] In `frontend/components/cutting/CuttingSessionRow.tsx` (or `CuttingSessionTable.tsx`): add size label column to the sessions table display

**Checkpoint**: Create a cutting session → verify size appears in detail → verify parts inventory panel shows aggregate row with model/size/color/part.

---

## Phase 4: User Story 2 — Parts Accumulation (Priority: P1)

**Goal**: Two sessions for the same (model, size, color, part) produce one aggregated row in the inventory, not two separate rows.

**Independent Test**: Create two sessions for the same combination; verify the inventory shows one row with the summed count.

*Note: The accumulation logic is fully implemented in T010 (the UPSERT). This phase covers the inventory display that makes it visible.*

### Implementation for User Story 2

- [X] T023 [US2] In `frontend/components/cutting/PartsInventoryPanel.tsx`: update to use new `PartsInventoryRow` shape (with `sizeLabel` and `color`); add `sizeLabel` and `color` columns to the table; add local state filters for model, size, and color (dropdowns); group display by (model, size, color) with a section header per group; filter rows client-side by active filter values; add "لا توجد نتائج" empty state when filters produce no matches
- [X] T024 [US2] In `frontend/hooks/useCuttingPartsInventory.ts`: verify the hook correctly types `PartsInventoryRow` with `sizeLabel` and `color` — update import and return type if needed

**Checkpoint**: Parts inventory panel shows correct grouped aggregates with size and color; applying filters works correctly.

---

## Phase 5: User Story 3 — Parts Inventory Filters (Priority: P2)

**Goal**: The parts inventory panel supports independent filtering by model, size, and color. Depleted rows are visually highlighted.

**Independent Test**: With multiple model+size+color combinations, apply size filter → only matching rows shown.

*Note: Filter UI is implemented as part of T023. This phase ensures the filter dropdowns are populated from the lookups (not hardcoded) and that the zero-available highlighting is correct.*

### Implementation for User Story 3

- [X] T025 [US3] In `frontend/components/cutting/PartsInventoryPanel.tsx`: load filter options from props or via `ipcClient.lookups.getModels()`, `getSizes()`, `getColors()` inside the component using `useEffect`; ensure zero-available rows have red background highlight (already partially done — verify works with new grouped layout)

**Checkpoint**: Filter dropdowns in parts inventory are populated from settings data; zero rows are highlighted red.

---

## Phase 6: User Story 4 — Distribution with Size and Color (Priority: P2)

**Goal**: Distribution form requires model + size + color before showing available parts. Distribution saved with size/color. Parts deducted from correct inventory variant.

**Independent Test**: With parts for "كلاسيك/L/أزرق" and "كلاسيك/M/أحمر", distribute for "كلاسيك/L/أزرق" — verify only matching parts shown and inventory correctly reduced.

### Implementation for User Story 4

- [X] T026 [US4] In `frontend/features/distribution/distribution.types.ts`: add `sizeLabel: string` and `color: string` to `DistributePayload`; update `AvailablePartForModel` to reflect that it's now keyed by the full (model, size, color) combination
- [X] T027 [US4] In `electron/main.js`: update `distribution:getAvailablePartsForModel` handler — accept `{ modelName, sizeLabel, color }` in payload; filter `cutting_parts` by all three fields; keep HAVING available > 0 logic; update the availability subquery to match (model_name, size_label, color) in `distribution_batch_parts` joins
- [X] T028 [US4] In `electron/main.js`: update `distribution:distribute` handler — destructure `sizeLabel` and `color` from payload; store in `distribution_batches` INSERT (`size_label`, `color` columns already exist and are nullable); update availability validation subquery to filter `cutting_parts` by (model_name, size_label, color, part_name)
- [X] T029 [US4] In `frontend/components/distribution/DistributeModal.tsx`: add `sizeLabel` state and `color` state; after model selection trigger `getAvailableSizesForModel({ modelName })` → populate size dropdown; after size selection trigger `getAvailableColorsForModelSize({ modelName, sizeLabel })` → populate color dropdown; only call `getAvailablePartsForModel` once model+size+color are all selected; pass `sizeLabel` and `color` to `distribute` payload; reset size/color/parts when model changes; reset color/parts when size changes

**Checkpoint**: Distribute modal cascades model → size → color → parts; distribution saved with correct size/color; parts inventory shows reduced counts.

---

## Phase 7: User Story 5 — Final Stock Filters (Priority: P2)

**Goal**: Final stock screen filters by size and color correctly. Verify backend applies filters.

**Independent Test**: Apply size filter → only matching rows shown.

*Note: The frontend filter UI (`FinalStockTable`) and hook (`useFinalStockList`) already pass filters to the backend. This phase verifies the backend service applies them and fixes it if not.*

### Implementation for User Story 5

- [X] T030 [US5] Read `electron/features/final-stock/service.js` (or the equivalent inline handler in `electron/main.js` for `final-stock:getRows`) — verify it applies `modelName`, `sizeLabel`, and `color` WHERE clauses; if missing, add the conditional WHERE clause filters

**Checkpoint**: Apply size "L" filter in final stock page → only L rows returned from backend.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, locale completeness, IPC bridge type alignment.

- [X] T031 [P] In `frontend/features/auth/auth.types.ts`: verify `ipcBridge.cutting` fully matches all implemented channels (no missing or stale declarations)
- [X] T032 [P] Verify `frontend/public/locales/ar/common.json` has all new strings referenced in updated components (size label, filter placeholder, empty state messages)
- [ ] T033 Run smoke test Scenario 1–7 from `specs/014-cutting-parts-size-color/quickstart.md` and fix any issues found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T002 and T003 are parallel
- **Phase 2 (Foundational)**: Depends on Phase 1; T004, T005, T006 are sequential (each migration depends on previous)
- **Phase 3 (US1)**: Depends on Phase 2 completion; T007–T009 are parallel (types); T010–T016 backend handlers are partially parallel; T017–T022 frontend are partially parallel
- **Phase 4 (US2)**: Depends on Phase 3 (needs new `PartsInventoryRow` type and aggregate inventory data)
- **Phase 5 (US3)**: Depends on Phase 4 (filter UI builds on the panel from T023)
- **Phase 6 (US4)**: Depends on Phase 3 (needs T015/T016 new IPC channels; T010 UPSERT logic)
- **Phase 7 (US5)**: Independent of Phases 3–6 (separate module); depends only on Phase 2
- **Phase 8 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — foundation of everything
- **US2 (P1)**: After US1 — accumulation logic (T010) is in US1; US2 adds the display
- **US3 (P2)**: After US2 — filter UI sits on top of the panel from US2
- **US4 (P2)**: After US1 — needs new IPC channels from US1 (T015, T016)
- **US5 (P2)**: After Phase 2 only — independent of cutting changes

### Parallel Opportunities Within US1

```
T007, T008, T009 — all type files, run in parallel
T010 (cutting:create), T011 (cutting:getById), T012 (cutting:getAll),
T013 (getPartSuggestions), T014 (getPartsInventory), T015, T016 — all in main.js
  → T010 must come first (defines the UPSERT); T012–T016 can run in parallel after T010
T017 (preload.js) — parallel with frontend work after T008/T009
T018, T019, T020, T021, T022 — frontend components, run in parallel after T007
```

---

## Implementation Strategy

### MVP First (US1 + US2 = working cutting flow)

1. Phase 1: Setup (T001–T003)
2. Phase 2: DB Migrations (T004–T006)
3. Phase 3: US1 backend + frontend (T007–T022)
4. Phase 4: US2 inventory panel update (T023–T024)
5. **STOP and VALIDATE**: Full cutting session flow works end-to-end with accumulation

### Incremental Delivery

1. Setup + Migrations → app boots cleanly
2. US1+US2 → complete cutting flow with size/color/parts from lookup + accumulation
3. US3 → inventory filters
4. US4 → distribution enhanced (can work in parallel with US3)
5. US5 → final stock filters verified
6. Polish → smoke test all scenarios

---

## Notes

- [P] tasks = different files or no dependencies on sibling tasks
- T006 is the most complex migration — use `legacy_alter_table = ON` pattern from 013 fix
- The UPSERT in T010 is the core of the accumulation feature (US2 depends entirely on it)
- T030 may be a no-op if the service already filters correctly
- Commit after each phase checkpoint
