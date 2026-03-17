# Tasks: Stock & Suppliers Enhancements

**Input**: Design documents from `/specs/007-stock-lookup-mgmt/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ipc-channels.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story — each story is independently testable and deliverable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in every task description

---

## Phase 1: Setup

**Purpose**: Validate clean baseline before making changes

- [X] T001 Verify clean baseline: run `node --check electron/main.js` and `npx tsc --noEmit` in `frontend/` — both must pass before any modifications begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema, IPC handlers, shared types, hook, and ManagedDropdown component — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend — SQLite Schema & IPC (electron/main.js → preload.js)

- [X] T002 Add `item_types`, `colors`, `units` table DDL + indexes to the DB migration block in `electron/main.js` (after the `return_consumption_entries` block): `CREATE TABLE IF NOT EXISTS item_types (id TEXT PK, name TEXT NOT NULL, is_predefined INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, UNIQUE(LOWER(name)))` and corresponding tables for `colors` and `units`; add `CREATE INDEX IF NOT EXISTS idx_item_types_active`, `idx_colors_active`, `idx_units_active`
- [X] T003 Add idempotent predefined seed statements to the migration block in `electron/main.js` (after T002): `INSERT OR IGNORE INTO item_types` for `قماش` (is_predefined=1); `INSERT OR IGNORE INTO units` for `متر` (is_predefined=1); `INSERT OR IGNORE INTO colors` for 8 colors — أبيض، أسود، أحمر، أزرق، أخضر، أصفر، رمادي، بيج — each with is_predefined=1; use `crypto.randomUUID()` for ids and `Date.now()` for timestamps
- [X] T004 Add existing-data migration seeds to `electron/main.js` migration block (after T003): `INSERT OR IGNORE INTO item_types ... SELECT DISTINCT type FROM stock_items WHERE type IS NOT NULL AND type != ''`; `INSERT OR IGNORE INTO units ... SELECT DISTINCT unit FROM stock_items WHERE unit IS NOT NULL AND unit != ''`; `INSERT OR IGNORE INTO colors ... SELECT color_val FROM (SELECT color AS color_val FROM stock_items WHERE color IS NOT NULL AND color != '' UNION SELECT fabric_color FROM cutting_sessions WHERE fabric_color IS NOT NULL AND fabric_color != '' UNION SELECT color FROM distribution_batches WHERE color IS NOT NULL AND color != '')` — all as is_predefined=0, is_active=1, using `hex(randomblob(16))` for ids and `unixepoch()*1000` for timestamps
- [X] T005 Add all 12 `lookups` IPC handlers to `electron/main.js` (after T004): `lookups:getTypes`, `lookups:getColors`, `lookups:getUnits` (SELECT WHERE is_active=1 ORDER BY is_predefined DESC, name ASC); `lookups:createType`, `lookups:createColor`, `lookups:createUnit` (trim name, check duplicate via LOWER(name), INSERT, return new row); `lookups:updateType`, `lookups:updateColor`, `lookups:updateUnit` (check is_predefined=0, check name uniqueness, UPDATE, return updated row); `lookups:deleteType`, `lookups:deleteColor`, `lookups:deleteUnit` (check is_predefined=0, SET is_active=0, return null); all following `{ success: true, data } | { success: false, error }` envelope
- [X] T006 Remove legacy `ipcMain.handle('stock:getTypes', ...)` and `ipcMain.handle('stock:getUnits', ...)` handlers from `electron/main.js` (after T005)
- [X] T007 Add `lookups` namespace to `electron/preload.js` — expose 12 channels via `contextBridge`: `lookups: { getTypes: () => ipcRenderer.invoke('lookups:getTypes'), getColors: () => ipcRenderer.invoke('lookups:getColors'), getUnits: () => ipcRenderer.invoke('lookups:getUnits'), createType: (p) => ipcRenderer.invoke('lookups:createType', p), createColor: (p) => ipcRenderer.invoke('lookups:createColor', p), createUnit: (p) => ipcRenderer.invoke('lookups:createUnit', p), updateType: (p) => ipcRenderer.invoke('lookups:updateType', p), updateColor: (p) => ipcRenderer.invoke('lookups:updateColor', p), updateUnit: (p) => ipcRenderer.invoke('lookups:updateUnit', p), deleteType: (p) => ipcRenderer.invoke('lookups:deleteType', p), deleteColor: (p) => ipcRenderer.invoke('lookups:deleteColor', p), deleteUnit: (p) => ipcRenderer.invoke('lookups:deleteUnit', p) }` (after T006)

### Frontend — Types, IPC Client, Hook, Shared Component

- [X] T008 [P] Create `frontend/features/lookups/lookups.types.ts` — export `interface LookupEntry { id: string; name: string; isPredefined: boolean; isActive: boolean; createdAt: number; }`, `type ItemType = LookupEntry`, `type Color = LookupEntry`, `type Unit = LookupEntry`, `interface CreateLookupPayload { name: string; }`, `interface UpdateLookupPayload { id: string; name: string; }`, `interface DeleteLookupPayload { id: string; }` per contracts/ipc-channels.md
- [X] T009 [P] Create Drizzle reference schemas (reference-only, not executed at runtime): `electron/db/schema/item_type.ts`, `electron/db/schema/color.ts`, `electron/db/schema/unit.ts` — each exporting a `pgTable`/`sqliteTable` definition mirroring the columns in data-model.md (id, name, is_predefined, is_active, created_at, updated_at)
- [X] T010 Update `frontend/features/auth/auth.types.ts` — add `lookups` namespace to the `Window['ipcBridge']` type declaration; import types from `../lookups/lookups.types`; type each method with correct payload and return types mirroring the IPC contracts (depends on T008)
- [X] T011 Update `frontend/lib/ipc-client.ts` — add `lookups` namespace with 12 typed wrapper methods (getTypes, getColors, getUnits, createType, createColor, createUnit, updateType, updateColor, updateUnit, deleteType, deleteColor, deleteUnit); remove `stock.getTypes()` and `stock.getUnits()` methods (depends on T008, T010)
- [X] T012 Create `frontend/hooks/useLookups.ts` — export `function useLookups(): { types: ItemType[]; colors: Color[]; units: Unit[]; loading: boolean; error: string | null; refetch: () => void }`; fetch all three lists in parallel via `Promise.all([ipcClient.lookups.getTypes(), ipcClient.lookups.getColors(), ipcClient.lookups.getUnits()])`; single `refetch()` invalidates all three; return empty arrays on error (depends on T011)
- [X] T013 Create `frontend/components/shared/ManagedDropdown.tsx` — reusable controlled dropdown (≤150 lines, `dir="rtl"`); props: `value: string`, `onChange: (v: string) => void`, `items: LookupEntry[]`, `placeholder?: string`, `addLabel: string`, `onAddNew: (name: string) => Promise<{ success: boolean; error?: string; data?: LookupEntry }>`, `disabled?: boolean`, `error?: string`; renders a styled `<button>` showing current value or placeholder; on click opens absolute `<div>` dropdown listing items; last item is the `addLabel` row; clicking `addLabel` shows inline mini-form (`<input>` + save/cancel); on save calls `onAddNew`, on success selects new entry and closes; on error shows error under input; click-outside via `useEffect` + `mousedown` on `document`; all text Arabic (depends on T008)

**Checkpoint**: Run `node --check electron/main.js` and `npx tsc --noEmit` in `frontend/` — must pass cleanly before proceeding

---

## Phase 3: User Story 1 — Manage Item Types, Colors & Units in Settings (Priority: P1) 🎯 MVP

**Goal**: Store manager can view and manage three lookup lists from Settings; predefined entries are visually distinguished and protected from edit/delete.

**Independent Test**: Launch app → navigate to Settings → verify three sections (أنواع الأصناف, الألوان, الوحدات) with predefined entries (قماش, متر, 8 colors) each showing predefined badge with edit/delete disabled. Add "صوف", edit it to "حرير", soft-delete it — it disappears from the list.

- [X] T014 [US1] Create `frontend/components/settings/LookupSection.tsx` — props: `title: string`, `items: LookupEntry[]`, `loading: boolean`, `addLabel: string`, `onAdd: (name: string) => Promise<void>`, `onEdit: (id: string, name: string) => Promise<void>`, `onDelete: (id: string) => Promise<void>`; renders: section heading, skeleton loader when `loading`, `EmptyState` when no user-created entries, list of rows each showing name + predefined badge (if `isPredefined`) + edit button (disabled if `isPredefined`) + delete button (disabled if `isPredefined`); inline edit mode per row (click edit → input pre-filled with current name + save/cancel); `ConfirmDialog` on delete; add-entry form at top (name input + save); all `dir="rtl"`, ≤150 lines (depends on T012, T013)
- [X] T015 [US1] Modify `frontend/app/(dashboard)/settings/page.tsx` — import `useLookups` and `LookupSection`; call `useLookups()` to get `{ types, colors, units, loading, refetch }`; render three `<LookupSection>` instances with: title and addLabel in Arabic (أنواع الأصناف/إضافة نوع, الألوان/إضافة لون, الوحدات/إضافة وحدة), items from hook, `onAdd` → `ipcClient.lookups.createType/createColor/createUnit` then `refetch()`, `onEdit` → `ipcClient.lookups.updateType/updateColor/updateUnit` then `refetch()`, `onDelete` → `ipcClient.lookups.deleteType/deleteColor/deleteUnit` then `refetch()`; show error toast if any mutation returns `success: false` (depends on T014)

**Checkpoint**: Settings page shows three lookup sections with predefined entries protected, add/edit/soft-delete working for user-created entries

---

## Phase 4: User Story 2 — Inline Add from Dropdowns (Priority: P2)

**Goal**: Color field in cutting session form, distribute modal, and return consumption editor are all converted to ManagedDropdown with "إضافة لون" inline capability; adding a color in one form makes it available app-wide.

**Independent Test**: Open cutting session form → select a fabric → click لون القماش dropdown → verify "إضافة لون" at bottom → add "زيتي" → confirm selected. Open DistributeModal → confirm "زيتي" appears in color dropdown. Open ReturnConsumptionEditor → confirm "زيتي" appears.

- [X] T016 [P] [US2] Modify `frontend/components/cutting/CuttingStep1Form.tsx` — replace `fabricColor` free-text `<input>` with `<ManagedDropdown>`; fetch `lookups:getColors` via `ipcClient.lookups.getColors()` and `cutting:getFabricColors({fabricItemId})` in parallel when `fabricItemId` changes; compute `intersectedColors = managedColors.filter(c => fabricColors.some(f => f.color === c.name))`; pass `intersectedColors` as `items` to `ManagedDropdown`; wire `onAddNew` → `ipcClient.lookups.createColor(name)` then re-fetch colors; `addLabel="إضافة لون"`; `dir="rtl"` (depends on T012, T011)
- [X] T017 [P] [US2] Modify `frontend/components/distribution/DistributeModal.tsx` — replace free-text color `<input>` with `<ManagedDropdown>`; add `ipcClient.lookups.getColors()` call to the existing data-fetching in `useDistributeForm` hook (or locally if hook is not easily modified); pass active colors as `items`; wire `onAddNew` → `ipcClient.lookups.createColor(name)` then re-fetch colors list; `addLabel="إضافة لون"`; `dir="rtl"` (depends on T012, T011)
- [X] T018 [P] [US2] Modify `frontend/components/distribution/ReturnConsumptionEditor.tsx` — replace color dropdown/input with `<ManagedDropdown>`; fetch active colors via `ipcClient.lookups.getColors()` (local `useEffect` or from parent props); wire `onAddNew` → `ipcClient.lookups.createColor(name)` then re-fetch; `addLabel="إضافة لون"`; `dir="rtl"` (depends on T012, T011)

**Checkpoint**: All three forms (cutting, distribute, return) show ManagedDropdown for color with inline add; adding a color in one form persists and appears in all others

---

## Phase 5: User Story 3 — Stock Item Form Uses Managed Dropdowns (Priority: P3)

**Goal**: Add/Edit Stock Item modal replaces free-text type, color, unit inputs with ManagedDropdown components sourced from active lookup entries; inline add works for all three fields.

**Independent Test**: Open Add Stock Item modal — type, color, unit are dropdowns (not free-text inputs). Verify only active entries shown. Create item with managed values, reopen → values display correctly. Find an existing pre-feature item, open edit — type/color/unit pre-selects the migration-seeded value.

- [X] T019 [US3] Modify `frontend/components/stock/AddItemModal.tsx` — call `useLookups()` to get `{ types, colors, units, refetch }`; replace type `<datalist>/<input>` with `<ManagedDropdown value={...} onChange={field.onChange} items={types} addLabel="إضافة نوع" onAddNew={async (name) => { const r = await ipcClient.lookups.createType({name}); if (r.success) refetch(); return r; }}/>`; replace unit field similarly with `units` and `addLabel="إضافة وحدة"`; replace color field with `colors` and `addLabel="إضافة لون"`; update react-hook-form `Controller` wrappers to match ManagedDropdown controlled pattern; ensure `dir="rtl"`, ≤150 lines (split into sub-components if needed) (depends on T012, T011)

**Checkpoint**: Stock item add/edit form shows all three fields as managed dropdowns; existing items open with their seeded values pre-selected

---

## Phase 6: User Story 4 — Inbound Transactions Require Supplier, Price & Total (Priority: P4)

**Goal**: Every inbound transaction requires supplier (dropdown with inline add), price per unit, and total price (auto-calculated but editable); backend enforces these constraints.

**Independent Test**: Open Record Inbound Transaction modal → submit without supplier → validation error "المورد مطلوب". Use "إضافة مورد" to create a supplier → confirm selected. Enter quantity=50, pricePerUnit=20 → totalPricePaid auto-fills 1000. Submit → transaction saved with correct supplier and pricing.

- [X] T020 [US4] Modify `frontend/components/stock/AddInboundModal.tsx` — update Zod schema: `supplierId: z.string().min(1, 'المورد مطلوب')`, `pricePerUnit: z.coerce.number().positive('السعر مطلوب')`, `totalPricePaid: z.coerce.number().positive('الإجمالي مطلوب')`; replace supplier free-text with a styled dropdown `<select>` (or custom dropdown) sourced from `suppliers:getAll`; add `showNestedSupplierModal: boolean` state; add `hasManuallyEditedTotal: boolean` ref (initially false); add `watch(['quantity','pricePerUnit'])` effect → if `!hasManuallyEditedTotal` then `setValue('totalPricePaid', qty * price)`; on `totalPricePaid` field change by user → set `hasManuallyEditedTotal = true`; replace color `<input>` with `<ManagedDropdown>` sourced from `useLookups().colors` with `addLabel="إضافة لون"` and `onAddNew` → `ipcClient.lookups.createColor` then `refetch()` (depends on T011, T012)
- [X] T021 [US4] Modify `frontend/components/stock/AddInboundModal.tsx` — add nested supplier modal flow (after T020): render `{showNestedSupplierModal && <NewSupplierModal onClose={() => setShowNestedSupplierModal(false)} onSuccess={(supplier) => { setSuppliers(prev => [...prev, supplier]); setValue('supplierId', supplier.id); setShowNestedSupplierModal(false); }} />}`; add "إضافة مورد" option at the bottom of the supplier dropdown that calls `setShowNestedSupplierModal(true)`; re-fetch suppliers list after successful nested creation (depends on T020)
- [X] T022 [US4] Modify `stock:addInbound` IPC handler in `electron/main.js` — add validation: check `supplierId` is non-empty and exists as a non-deleted supplier in the `suppliers` table (return `{ success: false, error: 'المورد غير موجود' }` if not); check `pricePerUnit > 0` (return `{ success: false, error: 'السعر مطلوب' }` if not); check `totalPricePaid > 0` (return `{ success: false, error: 'الإجمالي مطلوب' }` if not); keep all other handler logic unchanged (sequential with T006 — both modify `electron/main.js`)

**Checkpoint**: Full inbound transaction flow: supplier dropdown required, price auto-calculates, inline "إضافة مورد" works, backend validates all three required fields

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final syntax, type-check, and end-to-end validation

- [X] T023 [P] Run `node --check electron/main.js` — must exit 0 with no syntax errors
- [X] T024 [P] Run `npx tsc --noEmit` in `frontend/` — must exit 0 with zero type errors (strict mode)
- [X] T025 Execute quickstart.md Steps 1–24 end-to-end in the running Electron app (`npm run dev:electron`) to verify all acceptance scenarios for US1–US4 including cross-feature color propagation (Steps 22–24)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
  - `electron/main.js` changes are sequential: T002 → T003 → T004 → T005 → T006
  - T007 (`preload.js`) — after T006
  - T008 (`lookups.types.ts`) [P] — independent, start after Phase 1
  - T009 (Drizzle schemas) [P] — fully independent
  - T010 (`auth.types.ts`) — after T008
  - T011 (`ipc-client.ts`) — after T008, T010
  - T012 (`useLookups.ts`) — after T011
  - T013 (`ManagedDropdown.tsx`) — after T008
- **Phase 3 (US1)**: Depends on T012, T013 — can start once those complete
- **Phase 4 (US2)**: Depends on T012, T013 — T016, T017, T018 are [P] within the phase
- **Phase 5 (US3)**: Depends on T012, T013 — can run in parallel with Phase 3 and Phase 4
- **Phase 6 (US4)**: Depends on T011, T012, T013; T022 modifies `electron/main.js` — sequential after T006
  - T020 → T021 (sequential, same file)
- **Phase 7 (Polish)**: Depends on all desired story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent — no dependency on US2, US3, US4
- **US2 (P2)**: Independent — no dependency on US1, US3, US4
- **US3 (P3)**: Independent — no dependency on US1, US2, US4
- **US4 (P4)**: Independent — no dependency on US1, US2, US3

### Parallel Opportunities

Within Phase 2 (after T001):
- T008 and T009 can start immediately in parallel
- T010 and T013 can start in parallel after T008
- T011 starts after T010; T012 starts after T011
- T002–T006 are sequential (same file); T007 follows T006

After Phase 2 completes, Phases 3, 4, and 5 can all start in parallel:

| Developer A | Developer B | Developer C |
|---|---|---|
| Phase 3 (US1) | Phase 4 (US2) | Phase 5 (US3) |
| T014, T015 | T016, T017, T018 [P] | T019 |

Phase 6 (US4) can start immediately after Phase 2 as well.

---

## Parallel Example: Phase 4 (US2)

```bash
# All three form modifications can run in parallel (different files):
Task T016: "Modify CuttingStep1Form.tsx — color → ManagedDropdown with intersection"
Task T017: "Modify DistributeModal.tsx — color → ManagedDropdown"
Task T018: "Modify ReturnConsumptionEditor.tsx — color → ManagedDropdown"
```

## Parallel Example: Phase 2 Frontend

```bash
# After T001, start in parallel:
Task T008: "Create frontend/features/lookups/lookups.types.ts"
Task T009: "Create Drizzle reference schemas (item_type.ts, color.ts, unit.ts)"

# After T008:
Task T010: "Update auth.types.ts"
Task T013: "Create ManagedDropdown.tsx"

# After T010:
Task T011: "Update ipc-client.ts"

# After T011:
Task T012: "Create useLookups.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001
2. Complete Phase 2: T002–T013 (CRITICAL — blocks all stories)
3. Complete Phase 3: T014–T015 (US1)
4. **STOP and VALIDATE**: Navigate to Settings — three lookup sections functional
5. Demo lookup management before implementing any form changes

### Incremental Delivery

1. Phase 2 → Foundation ready (DB + IPC + types + hook + ManagedDropdown)
2. Phase 3 → US1: Settings management live (MVP — operators can now manage lookup data)
3. Phase 4 → US2: Inline add in cutting/distribution forms (app-wide color consistency)
4. Phase 5 → US3: Stock item form managed dropdowns (type/color/unit enforced)
5. Phase 6 → US4: Inbound transaction required fields (financial data completeness)
6. Phase 7 → Polish: Type-check + syntax-check + quickstart validation

### Single-Developer Sequence

1. Phase 2 backend (T002–T007) → `node --check electron/main.js`
2. Phase 2 frontend (T008–T013) → `npx tsc --noEmit`
3. Phase 3 US1 (T014–T015) → test Settings manually
4. Phase 4 US2 (T016–T018) → test cutting/distribution color dropdowns
5. Phase 5 US3 (T019) → test stock item form
6. Phase 6 US4 (T020–T022) → test inbound transaction
7. Phase 7 (T023–T025) → full validation pass

---

## Notes

- [P] tasks = different files with no incomplete dependencies — safe to run in parallel
- [Story] label maps each task to the user story for traceability
- `electron/main.js` edits are strictly sequential: T002 → T003 → T004 → T005 → T006, then T022 later
- `AddInboundModal.tsx` edits are sequential: T020 → T021
- All new/modified components must stay ≤150 lines and carry `dir="rtl"` on the root element
- No raw SQL in the renderer; all DB access via IPC handlers only
- Run `node --check electron/main.js` and `npx tsc --noEmit` after completing each phase
- Predefined lookup entries use `INSERT OR IGNORE` — safe to re-run on repeated app launches
- ManagedDropdown (T013) is the key shared primitive for US2, US3, US4 — get it right before the story phases
