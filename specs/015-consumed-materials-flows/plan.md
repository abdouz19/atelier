# Implementation Plan: Cutting, Distribution, QC & Finition Flow Finalization

**Branch**: `015-consumed-materials-flows` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/015-consumed-materials-flows/spec.md`

---

## Summary

Finalize the production flow UX across five operations: cutting (Step 1 + Step 2), distribute, return, QC, and finition. The primary work is (1) moving `size_label` from session-level to per-part-row in cutting Step 2, (2) refining Step 1 UX with cascade dropdowns, live stock validation display, and live cost calculation, and (3) building a single shared `ConsumedMaterialsEditor` component that provides a consistent consumed-materials section across all five modals, backed by a new `distribution_consumption_entries` table and an extended `distribution:distribute` IPC handler.

---

## Technical Context

**Language/Version**: TypeScript 5 strict (frontend renderer) + Node.js plain JS (Electron main process)
**Primary Dependencies**: Next.js 14 App Router, Electron 41, better-sqlite3, react-hook-form + Zod, Tailwind CSS 4, Lucide React, shadcn/ui
**Storage**: SQLite via better-sqlite3 prepared statements in `electron/main.js`; Drizzle ORM schemas in `electron/db/schema/` are reference-only
**Testing**: Manual integration testing via the Electron dev server
**Target Platform**: Desktop (macOS/Windows via Electron)
**Project Type**: Desktop application (Electron + Next.js static export)
**Performance Goals**: UI feedback (validation) within 1 second of user input; standard desktop app responsiveness
**Constraints**: Single-user desktop app; SQLite transactions ensure atomicity; no network latency
**Scale/Scope**: 5 modal forms modified; 1 new shared component; 1 new DB table; 2 IPC handler updates

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Core Data Flow (Page → Hook → IPC → Handler → Service → Queries) | ✅ PASS | All new data flows follow: modal component → hook → `ipc-client` → `ipcMain.handle` → business logic in handler → prepared statements |
| Component & Page Discipline (max 150 lines, named exports, no inline styles) | ✅ PASS | `ConsumedMaterialsEditor` must stay ≤ 150 lines; if it grows, extract sub-components |
| TypeScript strict mode, no `any`, no `@ts-ignore` | ✅ PASS | All new types explicitly defined in contracts |
| IPC responses typed as `{success:true,data:T}\|{success:false,error:string}` | ✅ PASS | No deviation from existing pattern |
| Zod validation before service layer | ✅ PASS | Form payloads validated with Zod before IPC call |
| RTL + Arabic strings externalized | ✅ PASS | All Arabic strings in `public/locales/ar/common.json` |
| Every table has `id`, `created_at`, `updated_at` | ✅ PASS | `distribution_consumption_entries` includes all three |
| Forms use react-hook-form + Zod resolver + visible labels + error slots + toast on success | ✅ PASS | `ConsumedMaterialsEditor` integrates with parent form context |
| No hardcoded strings in JSX | ✅ PASS | All new strings added to `ar/common.json` |
| NEVER use `useEffect` for data fetching | ✅ PASS | Data fetched via hooks using IPC calls |

**No constitution violations. No complexity tracking required.**

---

## Project Structure

### Documentation (this feature)

```text
specs/015-consumed-materials-flows/
├── plan.md              # This file
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/
│   └── ipc-channels.md  # Phase 1 output ✅
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (this feature)

```text
electron/
└── main.js                          # DB migration + cutting:create + distribution:distribute updates

frontend/
├── app/(dashboard)/                 # No new pages
├── components/
│   ├── shared/
│   │   └── ConsumedMaterialsEditor.tsx   # NEW — shared across all modals
│   ├── cutting/
│   │   ├── CuttingStep1Form.tsx     # Modified — remove sizeLabel, add live cost, refine UX
│   │   ├── CuttingStep2Form.tsx     # Modified — use shared ConsumedMaterialsEditor
│   │   └── PartRowsEditor.tsx       # Modified — add sizeLabel per row
│   ├── distribution/
│   │   ├── DistributeModal.tsx      # Modified — add ConsumedMaterialsEditor
│   │   └── ReturnModal.tsx          # Modified — replace with shared ConsumedMaterialsEditor
│   ├── qc/
│   │   └── AddQcRecordModal.tsx     # Modified — replace with shared ConsumedMaterialsEditor
│   └── finition/
│       └── AddFinitionRecordModal.tsx  # Modified — replace with shared ConsumedMaterialsEditor
├── features/
│   ├── cutting/
│   │   └── cutting.types.ts         # Modified — sizeLabel per CuttingPartRow
│   └── distribution/
│       └── distribution.types.ts    # Modified — consumptionRows on DistributePayload
├── lib/
│   └── ipc-client.ts                # Modified — updated signatures
└── public/locales/ar/
    └── common.json                  # Modified — new Arabic strings
```

---

## Implementation Phases

### Phase 1: Database & Types (Foundation)

Unblock everything else. No UI work yet.

1. Migrate DB in `electron/main.js`:
   - `ALTER TABLE cutting_session_parts ADD COLUMN size_label TEXT NOT NULL DEFAULT ''` (idempotent try/catch)
   - `CREATE TABLE IF NOT EXISTS distribution_consumption_entries (...)` (idempotent)
2. Update TypeScript types:
   - `cutting.types.ts`: `CuttingPartRow` gets `sizeLabel`; remove top-level `sizeLabel` from session payload
   - `distribution.types.ts`: `DistributePayload` gets `consumptionRows`
   - `ipc-client.ts`: Update both signatures

### Phase 2: Shared Component

Build `ConsumedMaterialsEditor` in isolation before plugging into modals.

1. Create `frontend/components/shared/ConsumedMaterialsEditor.tsx`
2. Verify it compiles and the collapse/expand, add/remove, validation behavior works correctly

### Phase 3: Cutting Form Refactor

3. Update `PartRowsEditor.tsx` — add `sizeLabel` field with ManagedDropdown
4. Update `CuttingStep1Form.tsx` — remove sizeLabel, add live cost display, add available-meters hint
5. Update `CuttingStep2Form.tsx` — use shared `ConsumedMaterialsEditor`
6. Update `cutting:create` IPC handler in `main.js` — write `sizeLabel` from part rows

### Phase 4: Distribution Distribute Modal

7. Update `DistributeModal.tsx` — add `ConsumedMaterialsEditor`
8. Update `distribution:distribute` IPC handler — process `consumptionRows`

### Phase 5: Remaining Modals

9. Update `ReturnModal.tsx` — swap existing editor with shared component
10. Update `AddQcRecordModal.tsx` — swap existing editor
11. Update `AddFinitionRecordModal.tsx` — swap existing editor

### Phase 6: Arabic Strings & Polish

12. Add all new strings to `public/locales/ar/common.json`
13. End-to-end test: create cutting session, distribute, return, QC, finition — verify stock balances

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `ALTER TABLE` fails on existing dev DBs | Medium | Wrap in try/catch; log and continue |
| `cutting_parts` aggregate gets blank `size_label` after refactor | High | Unit-test the upsert path; grep for all `size_label` writes |
| `ConsumedMaterialsEditor` exceeds 150-line constitution limit | Medium | Extract `ConsumptionRow` sub-component if needed |
| Distribute modal breaks on submit without `consumptionRows` | Low | Default `consumptionRows = []` in payload if not provided |
