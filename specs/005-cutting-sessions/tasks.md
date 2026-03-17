# Tasks: Cutting Session Management

**Input**: Design documents from `/specs/005-cutting-sessions/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ipc-channels.md ✅, quickstart.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory stubs for the new cutting feature

- [X] T001 Create `frontend/features/cutting/` and `frontend/components/cutting/` directories
- [X] T002 Create `frontend/app/(dashboard)/cutting/` page directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schemas, SQLite migrations, preload namespace, and TypeScript types — MUST be complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Create `electron/db/schema/cutting_session.ts` — Drizzle `cutting_sessions` table (id, fabric_item_id FK→stock_items, fabric_color, model_name, meters_used REAL CHECK>0, layers INTEGER CHECK>0, price_per_layer REAL CHECK>0, session_date INTEGER, notes, created_at, updated_at) with type exports
- [X] T004 [P] Create `electron/db/schema/cutting_piece.ts` — Drizzle `cutting_pieces` table (id, session_id FK→cutting_sessions, size_label, status DEFAULT 'not_distributed', created_at, updated_at) with type exports
- [X] T005 [P] Create `electron/db/schema/cutting_consumption_entry.ts` — Drizzle `cutting_consumption_entries` table (id, session_id FK→cutting_sessions, stock_item_id FK→stock_items, color nullable, quantity REAL CHECK>0, created_at, updated_at) with type exports
- [X] T006 Add 3 table migrations to `electron/main.js` `initDB()`: CREATE TABLE IF NOT EXISTS for `cutting_sessions`, `cutting_pieces`, `cutting_consumption_entries` plus 5 indexes (idx_cutting_sessions_date, idx_cutting_sessions_fabric, idx_cutting_pieces_session, idx_cutting_pieces_status, idx_cutting_consumption_session) — append after the employee tables migration block
- [X] T007 [P] Add `cutting` namespace to `electron/preload.js` with 9 channels: getKpis, getAll, getById, getFabrics, getFabricColors, getNonFabricItems, getModelSuggestions, getSizeSuggestions, create
- [X] T008 [P] Create `frontend/features/cutting/cutting.types.ts` — export: `CuttingKpis`, `CuttingSessionSummary`, `CuttingSessionDetail`, `FabricItem`, `FabricColorOption`, `NonFabricItem`, `SizeRow`, `ConsumptionRow`, `CreateCuttingSessionPayload` (all shapes per contracts/ipc-channels.md)
- [X] T009 Add `cutting` namespace to `frontend/lib/ipc-client.ts` with 9 typed methods importing from `@/features/cutting/cutting.types`
- [X] T010 Add `cutting` namespace to `Window.ipcBridge` declaration in `frontend/features/auth/auth.types.ts` (9 methods returning `Promise<unknown>`)

**Checkpoint**: DB schema ready, IPC bridge wired, TypeScript types defined — user story implementation can begin

---

## Phase 3: User Story 1 — View and Track Cutting Sessions (Priority: P1) 🎯 MVP

**Goal**: Sidebar link, KPI cards, sessions table, and read-only session detail view. No creation needed — pre-seeded or future-created sessions are displayed.

**Independent Test**: Navigate to Cutting from the sidebar. Verify 5 KPI cards show zero (empty state). After creating sessions via direct DB insert or Phase 4, verify table rows, KPI totals, and detail view (quickstart Steps 1–4).

### Implementation for User Story 1

- [X] T011 [P] [US1] Add `cutting:getKpis` handler to `electron/main.js` — single SQL query returning `{ totalSessions, totalPieces, piecesNotDistributed, totalMetersConsumed, totalCostPaid }` via COUNT/SUM aggregates on cutting_sessions, cutting_pieces, employee_operations WHERE operation_type='cutting'
- [X] T012 [P] [US1] Add `cutting:getAll` handler to `electron/main.js` — JOIN cutting_sessions + stock_items (fabric name) + GROUP BY for employee names + COUNT cutting_pieces, ORDER BY session_date DESC; return `CuttingSessionSummary[]`
- [X] T013 [P] [US1] Add `cutting:getById` handler to `electron/main.js` — fetch full session with JOIN stock_items for fabric name, GROUP BY size_label for piecesBySize, employee list with earnings from employee_operations WHERE source_module='cutting', consumption entries from cutting_consumption_entries JOIN stock_items; return `CuttingSessionDetail`
- [X] T014 [P] [US1] Create `frontend/hooks/useCuttingList.ts` — `useCallback` + `useEffect` calling `ipcClient.cutting.getKpis()` and `ipcClient.cutting.getAll()`; expose `{ kpis, sessions, loading, error, refetch }`
- [X] T015 [P] [US1] Create `frontend/components/cutting/CuttingKpiCards.tsx` — 5 KPI cards (sessions, pieces produced, not distributed, meters consumed, total cost); Arabic labels; `dir="rtl"`
- [X] T016 [P] [US1] Create `frontend/components/cutting/CuttingSessionRow.tsx` — `<tr>` with 7 columns (date, fabric+color, model, meters, pieces, employees, cost); click handler calls `onRowClick(session.id)`
- [X] T017 [US1] Create `frontend/components/cutting/CuttingSessionTable.tsx` — search/filter by model or fabric name, EmptyState when empty, renders `CuttingSessionRow` list inside `<table dir="rtl">`; uses `CuttingSessionSummary[]` prop
- [X] T018 [P] [US1] Create `frontend/hooks/useCuttingDetail.ts` — takes `id: string`; calls `ipcClient.cutting.getById({ id })`; exposes `{ detail, loading, error }`
- [X] T019 [US1] Create `frontend/components/cutting/CuttingSessionDetail.tsx` — read-only detail: back button, session header (fabric, model, date, meters, layers, price/layer, notes), employees list with earnings, pieces-by-size table, consumed items list; NO edit/delete controls anywhere; `dir="rtl"`; ≤150 lines
- [X] T020 [US1] Create `frontend/app/(dashboard)/cutting/page.tsx` — reads `?id=` query param; when id present renders `CuttingSessionDetail` via `useCuttingDetail`; otherwise renders KPI + table view using `useCuttingList`; includes "New Cutting Session" button (opens modal in Phase 4); Suspense wrapper; `dir="rtl"`
- [X] T021 [US1] Add Scissors icon + cutting link to `frontend/components/layout/Sidebar.tsx` — add `{ href: '/cutting', label: 'القص', icon: Scissors }` entry (import Scissors from lucide-react)

**Checkpoint**: Navigate to Cutting from sidebar. KPIs show zeros, table shows empty state, sidebar link works. US1 fully testable.

---

## Phase 4: User Story 2 — Create a Cutting Session (Priority: P2)

**Goal**: Two-step modal for new cutting sessions. Step 1: fabric+color, model, meters, employees, layers, price, date. Step 2: size rows + optional consumption. Atomic submission.

**Independent Test**: Create a full session (both steps, 2 employees, 2 sizes, 1 consumption entry). Verify fabric stock decreases, consumed item decreases, pieces appear in detail, both employees have earnings on the Employees screen (quickstart Steps 5–15).

### Implementation for User Story 2

- [X] T022 [P] [US2] Add `cutting:getFabrics` handler to `electron/main.js` — SELECT non-archived stock_items WHERE type='قماش'; for each, subquery stock_transactions to get colors with available>0; return `FabricItem[]`
- [X] T023 [P] [US2] Add `cutting:getFabricColors` handler to `electron/main.js` — for a given fabricItemId, query stock_transactions with SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END) GROUP BY color HAVING available>0; return `FabricColorOption[]`
- [X] T024 [P] [US2] Add `cutting:getNonFabricItems` handler to `electron/main.js` — SELECT non-archived stock_items WHERE type≠'قماش'; for each, compute available per color + total available; return `NonFabricItem[]`
- [X] T025 [P] [US2] Add `cutting:getModelSuggestions` handler to `electron/main.js` — SELECT DISTINCT model_name FROM cutting_sessions ORDER BY model_name; return `string[]`
- [X] T026 [P] [US2] Add `cutting:getSizeSuggestions` handler to `electron/main.js` — SELECT DISTINCT size_label FROM cutting_pieces ORDER BY size_label; return `string[]`
- [X] T027 [US2] Add `cutting:create` handler to `electron/main.js` — wrapped in `db.transaction()`: (1) validate fabric availability, (2) validate each consumption entry availability, (3) validate all employees active, (4) INSERT cutting_sessions, (5) INSERT cutting_pieces (loop: one row per piece per size row), (6) INSERT cutting_consumption_entries + stock_transactions (type='consumed', source_module='cutting') for each non-fabric entry, (7) INSERT stock_transactions for fabric deduction, (8) INSERT employee_operations (operation_type='cutting', source_module='cutting') per employee; return new `CuttingSessionSummary`
- [X] T028 [P] [US2] Create `frontend/components/cutting/SizeRowsEditor.tsx` — repeatable rows (size autocomplete input + piece count input); add/remove row buttons; running total displayed below; validates ≥1 row, pieceCount≥1; `dir="rtl"`; ≤150 lines
- [X] T029 [P] [US2] Create `frontend/components/cutting/ConsumptionRowsEditor.tsx` — repeatable rows (non-fabric item selector + conditional color selector + quantity input with available stock shown); add/remove row buttons; validates each quantity≤available; `dir="rtl"`; ≤150 lines
- [X] T030 [US2] Create `frontend/components/cutting/CuttingStep1Form.tsx` — react-hook-form + Zod; fields: fabric selector (searchable, calls cutting:getFabrics), color selector (depends on fabric, calls cutting:getFabricColors), model name (text + datalist from cutting:getModelSuggestions), meters (number, shows available, validates≤available and >0), employee multi-select (calls employees:getAll filtered active), layers (integer >0), price per layer (number >0), live total cost display, date, notes; `onNext(values)` callback; `dir="rtl"`; ≤150 lines
- [X] T031 [US2] Create `frontend/components/cutting/CuttingStep2Form.tsx` — wraps `SizeRowsEditor` + `ConsumptionRowsEditor`; loads suggestions (cutting:getSizeSuggestions, cutting:getNonFabricItems); submit button calls `onSubmit(step2Values)`; back button calls `onBack()`; `dir="rtl"`; ≤150 lines
- [X] T032 [US2] Create `frontend/components/cutting/NewCuttingSessionModal.tsx` — step state (1|2), step1Data state; step indicator header ("الخطوة 1 من 2" / "الخطوة 2 من 2"); renders CuttingStep1Form (step=1) or CuttingStep2Form (step=2); on step2 submit merges step1Data+step2Values and calls `ipcClient.cutting.create()`; on success closes modal + shows Toast + calls onSuccess; `dir="rtl"`; ≤150 lines
- [X] T033 [US2] Wire `NewCuttingSessionModal` into `frontend/app/(dashboard)/cutting/page.tsx` — add `showCreate` state; "New Cutting Session" button sets `showCreate=true`; modal `onSuccess` triggers `refetch()` on useCuttingList

**Checkpoint**: Full end-to-end session creation works. Stock deductions reflected on Stock screen. Employee earnings reflected on Employees screen. All quickstart Steps 5–15 pass.

---

## Phase 5: User Story 3 — Session Immutability (Priority: P3)

**Goal**: Confirm no edit/delete IPC channels, no edit UI anywhere. Cutting sessions are permanently read-only.

**Independent Test**: Open any saved session detail. Confirm zero edit controls. Confirm no delete button on the table row or detail view (quickstart Steps 16–18).

### Implementation for User Story 3

- [X] T034 [US3] Verify `electron/main.js` and `electron/preload.js` cutting namespace contains exactly the 9 declared channels (no `cutting:update` or `cutting:delete`); verify `frontend/features/cutting/cutting.types.ts` has no update/delete payload types
- [X] T035 [US3] Verify `frontend/components/cutting/CuttingSessionDetail.tsx` has no edit button, no delete button, and no inline-editable fields; verify `CuttingSessionTable.tsx` / `CuttingSessionRow.tsx` have no delete action — add read-only comments if any ambiguity exists

**Checkpoint**: All quickstart Steps 16–18 pass. Sessions are permanently read-only by architecture and UI.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: TypeScript correctness, RTL validation, end-to-end walkthrough, component size

- [X] T036 [P] Run `tsc --noEmit` from `frontend/` and fix any TypeScript errors across all new cutting files
- [X] T037 Validate `dir="rtl"` is present on all new cutting UI components and the cutting page
- [ ] T038 Walk through `specs/005-cutting-sessions/quickstart.md` Steps 1–20 end-to-end and verify all assertions pass (including cross-module: stock screen + employees screen)
- [X] T039 [P] Review all new cutting components for 150-line constitution limit; split any that exceed it

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — provides the readable shell; no creation needed
- **US2 (Phase 4)**: Depends on Foundational — can start in parallel with US1 for backend handlers, but frontend components need US1's page.tsx to wire into
- **US3 (Phase 5)**: Depends on US1 + US2 completion — verification only
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Foundational complete → immediately implementable; delivers MVP read-only screen
- **US2 (P2)**: Foundational complete → backend handlers [T022–T027] can run parallel with US1; modal components need US1 page.tsx (T020) to wire into
- **US3 (P3)**: Verification only — T034 can run after T027; T035 can run after T019

### Parallel Opportunities Within US2

```text
Parallel batch A (all independent, different files):
  T022: cutting:getFabrics handler
  T023: cutting:getFabricColors handler
  T024: cutting:getNonFabricItems handler
  T025: cutting:getModelSuggestions handler
  T026: cutting:getSizeSuggestions handler
  T028: SizeRowsEditor.tsx
  T029: ConsumptionRowsEditor.tsx

Sequential after batch A:
  T027: cutting:create handler (depends on all above for validation patterns)
  T030: CuttingStep1Form.tsx (depends on T028 for size pattern reference)
  T031: CuttingStep2Form.tsx (depends on T028, T029)
  T032: NewCuttingSessionModal.tsx (depends on T030, T031)
  T033: Wire modal into page.tsx (depends on T032)
```

---

## Implementation Strategy

### MVP First (US1 only — read-only screen)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T010)
3. Complete Phase 3: US1 (T011–T021)
4. **STOP and VALIDATE**: Sidebar link works, KPI cards show zeros, table shows empty state, detail view renders correctly
5. Demo read-only Cutting screen

### Incremental Delivery

1. Setup + Foundational → DB schema and IPC bridge ready
2. US1 → Read-only Cutting screen visible and working (MVP)
3. US2 → Session creation fully functional; cross-module deductions verified
4. US3 → Immutability confirmed by architecture
5. Polish → TypeScript clean, RTL validated, full quickstart pass

---

## Notes

- All 9 IPC channels go into `electron/main.js` (monolith) and `electron/preload.js` — NOT TypeScript handler files (those are reference-only per CLAUDE.md)
- The `cutting:create` handler uses `db.transaction()` for atomicity — any validation failure rolls back all writes
- Pieces are inserted one row per piece (not one per size): 30 "M" pieces = 30 INSERT statements inside the transaction
- Employee earnings use `employee_operations` table with `operation_type='cutting'` and `source_module='cutting'` so they appear automatically on the Employees detail screen
- Fabric deductions + non-fabric consumption use `stock_transactions` with `type='consumed'` and `source_module='cutting'` — appear automatically in stock history
- `Window.ipcBridge` declaration lives in `frontend/features/auth/auth.types.ts` (not preload) — must be updated there (T010)
- `electron/preload.js` (plain JS) is what Electron actually loads — must be updated (T007) in addition to the TypeScript reference file
