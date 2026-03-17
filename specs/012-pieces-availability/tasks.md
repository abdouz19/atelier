# Tasks: Distribution & Dashboard Pieces Availability Enhancement

**Feature**: 012-pieces-availability | **Branch**: `012-pieces-availability`
**Input**: Design documents from `specs/012-pieces-availability/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema migrations and shared type foundations that every user story depends on

- [X] T001 Add idempotent migration `ALTER TABLE distribution_batches ADD COLUMN part_name TEXT` in `electron/main.js` (inside the existing migration loop)
- [X] T002 Add idempotent migration `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)` in `electron/main.js`
- [X] T003 [P] Create `electron/features/pieces/queries.js` — stub file with exports placeholder (filled in per story)
- [X] T004 [P] Create `electron/features/pieces/service.js` — stub file requiring queries
- [X] T005 [P] Create `frontend/features/pieces/pieces.types.ts` — `PiecesAvailabilityRow`, `CriticalCombination` interfaces
- [X] T006 [P] Add `AvailabilityCombination` type and `partName?: string | null` to `DistributePayload` in `frontend/features/distribution/distribution.types.ts`
- [X] T007 [P] Add `zeroStockCombosCount`, `lowStockCombosCount` to `DashboardSnapshotKpis`; add `criticalCombinations: CriticalCombination[]` to `DashboardSnapshotData`; add `monthlyDistributed` array to `DashboardChartData` in `frontend/features/dashboard/dashboard.types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend IPC infrastructure and frontend bridge — required before any UI work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Implement `getAvailabilityForModel(db, modelName)` SQL in `electron/features/pieces/queries.js` — GROUP BY (part_name, size_label, fabric_color) for a model with not_distributed SUM
- [X] T009 Implement `getAvailability(db, filters)` SQL in `electron/features/pieces/queries.js` — full 4-column count breakdown (total, not_distributed, in_distribution, returned) with optional filters
- [X] T010 [P] Implement `getLowStockThreshold(db)` and `setLowStockThreshold(db, threshold)` in `electron/features/pieces/queries.js` — reads/writes `app_settings` table with INSERT OR IGNORE default of 5
- [X] T011 Wire service methods in `electron/features/pieces/service.js` — `getAvailabilityForModel`, `getAvailability`, `getLowStockThreshold`, `setLowStockThreshold`
- [X] T012 Add `require('./features/pieces/service')` in `electron/main.js` and register 4 IPC handlers: `distribution:getAvailabilityForModel`, `pieces:getAvailability`, `pieces:getLowStockThreshold`, `pieces:setLowStockThreshold`
- [X] T013 Update `distribution:distribute` handler in `electron/main.js` to extract `partName` from payload and insert it into `distribution_batches.part_name`
- [X] T014 Add `pieces` namespace to `electron/preload.js` — `getAvailability`, `getLowStockThreshold`, `setLowStockThreshold`; add `getAvailabilityForModel` under `distribution` namespace in preload
- [X] T015 [P] Add `pieces` namespace to `Window.ipcBridge` in `frontend/features/auth/auth.types.ts`
- [X] T016 Add `pieces` section to `frontend/lib/ipc-client.ts` (getAvailability, getLowStockThreshold, setLowStockThreshold); add `distribution.getAvailabilityForModel` to existing distribution section

**Checkpoint**: Backend is complete and IPC bridge is wired — all user story UI can now be built

---

## Phase 3: User Story 1 — Smart Distribution Modal with Availability Table (Priority: P1) 🎯 MVP

**Goal**: Replace size/color dropdowns in the Distribute modal with a grouped availability table; user selects a (part+size+color) row and gets a quantity input bounded by available count

**Independent Test**: Open Distribute modal, select a model → availability table appears with correct counts; zero-count rows disabled; selecting a row reveals quantity input with correct max; submit creates batch with correct part+size+color

- [X] T017 [US1] Create `frontend/components/distribution/AvailabilityTableSelector.tsx` — renders (part, size, color, available count) rows; disabled state for zero-count; selected row highlight; emits selected combination
- [X] T018 [US1] Modify `frontend/hooks/useDistributeForm.ts` — add `selectedCombination` state; fetch availability table via `ipcClient.distribution.getAvailabilityForModel(modelName)` when model changes; replace `getAvailablePieces` call with table data; expose `availabilityCombinations`, `selectedCombination`, `selectCombination`
- [X] T019 [US1] Modify `frontend/components/distribution/DistributeModal.tsx` — after model selection, render `AvailabilityTableSelector` instead of sizeLabel/color dropdowns; show quantity input only after row selected; pass `partName` in submit payload

**Checkpoint**: US1 complete — distribution modal uses availability table end-to-end

---

## Phase 4: User Story 2 — Pieces Availability Screen (Priority: P2)

**Goal**: New "توافر القطع" tab in the Distribution screen showing all combinations with flagging, filters, threshold input, and re-cut action

**Independent Test**: Navigate to Distribution screen → click availability tab → table shows all combinations with correct counts; red rows for zero, amber for ≤ threshold; threshold input saves and immediately reclassifies rows; "قطع مرة أخرى" opens cutting flow with model+color pre-filled

- [X] T020 [US2] Create `frontend/hooks/usePiecesAvailability.ts` — useSearchParams for model/part/size/color filters; on mount fetch `pieces:getAvailability({})` and `pieces:getLowStockThreshold()` in parallel; `threshold` state; `setThreshold` calls IPC and updates local state; `classify(row)` returns 'zero'|'low'|'ok'; `onRecut(row)` pushes to `/cutting?modelName=...&color=...`
- [X] T021 [US2] Create `frontend/components/distribution/PiecesAvailabilityTable.tsx` — 4 filter dropdowns (model, part, size, color) + threshold numeric input + save button; table with 8 columns (model, part, size, color, produced, not-distributed, in-distribution, returned); red/amber row classes; "قطع مرة أخرى" button on flagged rows only; empty state
- [X] T022 [US2] Create `frontend/components/distribution/PiecesAvailabilityTab.tsx` — wraps `usePiecesAvailability` and `useLookups`; renders `PiecesAvailabilityTable`; loading skeleton; error alert
- [X] T023 [US2] Modify `frontend/app/(dashboard)/distribution/page.tsx` — add tab switcher ("التوزيع" | "توافر القطع") using `?tab=` URL param; render `PiecesAvailabilityTab` when `tab=availability`, existing content when default

**Checkpoint**: US2 complete — Pieces Availability tab is fully functional within Distribution screen

---

## Phase 5: User Story 3 — Dashboard Pieces Availability KPIs and Widget (Priority: P3)

**Goal**: Two new KPI cards on Dashboard (zero-stock combos, low-stock combos), a top-10 critical combinations widget, and a second bar series (distributed per month) on the monthly production chart

**Independent Test**: Dashboard loads → two new KPI cards show correct counts; summary widget shows ≤10 rows sorted by ascending not-distributed; clicking a widget row navigates to availability tab; monthly production chart has two bar series with legend

- [X] T024 [US3] Add `getZeroAndLowStockCounts(db, threshold)` and `getCriticalCombinations(db)` SQL functions to `electron/features/pieces/queries.js` — zero count via HAVING = 0, low count via HAVING BETWEEN 1 AND threshold, top-10 via ORDER BY not_distributed ASC LIMIT 10
- [X] T025 [US3] Add `getMonthlyDistributed(db, { twelveMonthsAgo, modelName })` SQL to `electron/features/dashboard/queries.js` — SUM(quantity) FROM distribution_batches grouped by month with model filter
- [X] T026 [US3] Update `getSnapshotData(db)` in `electron/features/dashboard/service.js` — call `piecesService.getZeroAndLowStockCounts(db, threshold)` and `piecesService.getCriticalCombinations(db)`; include in response
- [X] T027 [US3] Update `getChartData(db, params)` in `electron/features/dashboard/queries.js` — add `monthlyDistributed` array to returned object using the new `getMonthlyDistributed` query
- [X] T028 [US3] Create `frontend/components/dashboard/PiecesAvailabilityWidget.tsx` — compact table with ≤10 rows; columns: model, part, size, color, not-distributed; each row clickable → `router.push('/distribution?tab=availability')`; empty state; max 150 lines
- [X] T029 [US3] Modify `frontend/components/dashboard/DashboardKpiCards.tsx` — add "تركيبات بدون مخزون" KPI card (zeroStockCombosCount, clickable → distribution?tab=availability) and "تركيبات بمخزون منخفض" card (lowStockCombosCount, same link)
- [X] T030 [US3] Modify `frontend/components/dashboard/MonthlyProductionChart.tsx` — add second `<Bar dataKey="distributed">` with distinct color; merge `monthlyProduction` and `monthlyDistributed` on month key client-side filling 0 gaps; add `<Legend />` component
- [X] T031 [US3] Modify `frontend/app/(dashboard)/dashboard/page.tsx` — add `<PiecesAvailabilityWidget criticalCombinations={chartData?.criticalCombinations} />` section after pipeline widget

**Checkpoint**: US3 complete — Dashboard has new KPIs, widget, and two-series production chart

---

## Phase 6: User Story 4 — Low-Stock Threshold Configuration (Priority: P4)

**Goal**: Threshold input is inline in the Pieces Availability screen (already wired in US2); this phase ensures the IPC persistence is correct and the dashboard KPI reflects the stored threshold

**Independent Test**: Set threshold to 10 in Pieces Availability tab → save → navigate away and back → threshold is 10 → Dashboard low-stock KPI reflects the new threshold on next load

*Note: The UI for threshold (inline input in PiecesAvailabilityTable) is already implemented in T021 (US2). This phase only validates the end-to-end persistence and dashboard integration.*

- [X] T032 [US4] Verify `electron/main.js` handler `pieces:setLowStockThreshold` uses INSERT OR REPLACE and validates threshold >= 0; update `dashboard:getSnapshotData` handler to read threshold from `app_settings` before calling `getSnapshotData`

**Checkpoint**: US4 complete — threshold persists across sessions and Dashboard KPI reflects it

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T033 [P] Run TypeScript check `npx tsc --noEmit` in `frontend/` — fix any type errors
- [X] T034 [P] Verify `.gitignore` exists and covers `node_modules/`, `dist/`, `.env*` — add missing patterns if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately; T003–T007 fully parallel
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user story phases; T008–T010 parallel within phase; T011 depends on T008–T010; T012–T013 depend on T011; T014 depends on T012; T015–T016 depend on T014
- **Phase 3 (US1)**: Depends on Phase 2 — T017 parallel with T018; T019 depends on T017+T018
- **Phase 4 (US2)**: Depends on Phase 2 — T020 before T021–T022; T023 depends on T022
- **Phase 5 (US3)**: Depends on Phase 2 — T024–T025 parallel; T026 depends on T024; T027 depends on T025; T028–T031 parallel (different files)
- **Phase 6 (US4)**: Depends on Phase 2 + US2 complete (threshold IPC already wired in T012)
- **Phase 7 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 only — fully independent
- **US2 (P2)**: After Phase 2 only — independent; tab switcher added to distribution page
- **US3 (P3)**: After Phase 2 only — independent; reads from piecesService (T024–T027) which must be done before dashboard components
- **US4 (P4)**: After Phase 2 + US2 — threshold UI is in US2; this phase validates persistence

### Parallel Opportunities Within US3

```
T024 (pieces zero/low SQL) and T025 (dashboard distributed SQL) — parallel (different files)
T028 (PiecesAvailabilityWidget) and T029 (DashboardKpiCards) and T030 (MonthlyProductionChart) — parallel (different files)
T026 depends on T024; T027 depends on T025; T031 depends on T028
```

---

## Implementation Strategy

### MVP First (US1 Only — 7 tasks after Phase 1+2)

1. Complete Phase 1: Setup (T001–T007)
2. Complete Phase 2: Foundational (T008–T016)
3. Complete Phase 3: US1 (T017–T019)
4. **STOP and VALIDATE**: Open Distribute modal, confirm availability table replaces dropdowns, complete a distribution end-to-end

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. Phase 3 (US1) → Smart distribution modal ✓ Demo-ready
3. Phase 4 (US2) → Pieces Availability tab ✓ Demo-ready
4. Phase 5 (US3) → Dashboard KPIs + widget + chart ✓ Demo-ready
5. Phase 6 (US4) → Threshold persistence verified ✓ Complete

---

## Notes

- [P] = different files, no cross-task dependency — safe to parallelize
- Each story delivers independent, testable value
- The distribution modal change (US1) is non-destructive — the existing `sizeLabel`/`color` fields remain in `DistributePayload` and are still sent (now populated from the selected combination)
- `part_name` on `distribution_batches` is nullable — zero risk to existing data
- `app_settings` is created idempotent (CREATE TABLE IF NOT EXISTS) — safe on existing database
