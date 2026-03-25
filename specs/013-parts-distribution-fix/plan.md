# Implementation Plan: Parts Model Correction & Inventory KPIs

**Branch**: `013-parts-distribution-fix` | **Date**: 2026-03-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/013-parts-distribution-fix/spec.md`

## Summary

Correct the cutting and distribution data model so that cutting sessions produce **named parts** (aggregate rows per part type) rather than individual piece records per size. Add a **parts inventory KPI panel** in the cutting section showing available count per model + part name. Update the distribution flow to record an **expected piece count** plus a **per-part breakdown** of what was given to each tailor. Returns remain a flat quantity against a batch. All changes are backwards-compatible — legacy `cutting_pieces` and `distribution_piece_links` data is preserved and remains readable.

## Technical Context

**Language/Version**: TypeScript 5 strict (frontend renderer) + Node.js plain JavaScript (Electron main process)
**Primary Dependencies**: Next.js 14 App Router, Electron 41, better-sqlite3, react-hook-form + Zod, shadcn/ui + Tailwind CSS 4, Lucide React
**Storage**: SQLite via better-sqlite3 prepared statements in `electron/main.js`; Drizzle ORM schemas in `electron/db/schema/` are reference-only (not executed at runtime)
**Testing**: Manual smoke tests (no automated test framework in this project)
**Target Platform**: Desktop (macOS via Electron)
**Project Type**: Desktop application
**Performance Goals**: Standard desktop app — all queries complete within 200ms for expected data volumes
**Constraints**: Offline-only, RTL Arabic UI, no code-level migrations framework — schema changes are hand-written SQL in `initializeDatabase()` using `IF NOT EXISTS` / rename-copy-drop patterns
**Scale/Scope**: Single-user desktop app; expected tens of cutting sessions and hundreds of parts rows

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Core Data Flow (Page → Hook → ipc-client → handler → service → queries → Drizzle → SQLite) | ✅ Pass | All new IPC channels follow the established pattern: handler in `main.js`, types in `frontend/features/`, hook in `frontend/hooks/`, ipc-client entry in `frontend/lib/ipc-client.ts` |
| Component & Page Discipline (pages compose, components render, hooks manage IPC) | ✅ Pass | New `PartsInventoryPanel` is a pure UI component; new `useCuttingPartsInventory` hook handles IPC; no logic in pages |
| Type Safety (strict TS, no `any`, Zod validation) | ✅ Pass | All new types defined in `*.types.ts`; form payloads validated with Zod before reaching IPC |
| RTL & Localization First | ✅ Pass | All new strings added to `public/locales/ar/common.json` |
| UI/UX Consistency (AppLayout, PageHeader, EmptyState, skeleton loaders, ErrorAlert) | ✅ Pass | `PartsInventoryPanel` follows existing KPI card patterns; empty state shown when no parts exist |
| NEVER use Drizzle in renderer | ✅ Pass | All DB access stays in `electron/main.js` |
| NEVER hardcode strings in JSX | ✅ Pass | All new Arabic strings externalized |

**Gate result**: All principles pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/013-parts-distribution-fix/
├── plan.md              ← this file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ipc-channels.md
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (/speckit.tasks command)
```

### Source Code (affected paths)

```text
electron/
├── main.js                                    # Schema migration + all IPC handler updates
└── db/schema/
    ├── cutting_part.ts                        # NEW — Drizzle reference for cutting_parts
    └── distribution_batch_part.ts             # NEW — Drizzle reference for distribution_batch_parts

frontend/
├── app/(dashboard)/cutting/page.tsx           # Mount PartsInventoryPanel
├── components/cutting/
│   ├── PartsInventoryPanel.tsx                # NEW — parts inventory KPI panel
│   ├── PartRowsEditor.tsx                     # NEW — part name + count rows for step 2
│   ├── CuttingStep2Form.tsx                   # Update — use PartRowsEditor
│   ├── CuttingSessionDetail.tsx               # Update — render parts[] breakdown
│   └── CuttingKpiCards.tsx                    # Update — parts-based totals
├── components/distribution/
│   ├── DistributeModal.tsx                    # Update — expectedPiecesCount + parts breakdown
│   ├── DistributionTailorDetail.tsx           # Update — show parts per batch
│   └── AvailabilityTableSelector.tsx          # Update — show parts by model
├── features/cutting/cutting.types.ts          # Update — PartRow, updated payload types
├── features/distribution/distribution.types.ts # Update — DistributePayload, batch types
├── hooks/
│   ├── useCuttingPartsInventory.ts            # NEW
│   ├── useCuttingList.ts                      # Update — KPI type changes
│   └── useCuttingDetail.ts                    # Update — parts[] instead of piecesBySize
├── lib/ipc-client.ts                          # Update — new channels, removed channels
└── public/locales/ar/common.json             # Add new Arabic strings
```

**Structure Decision**: Single Electron + Next.js project. All backend changes in `electron/main.js` (plain JS, prepared statements). All frontend changes follow the existing module pattern under `frontend/`.

---

## Phase 0 — Research

**Status**: Complete. See [research.md](research.md).

Key decisions:
- New `cutting_parts` table (aggregate) alongside legacy `cutting_pieces` (individual pieces).
- New `distribution_batch_parts` table for per-part distribution breakdown.
- `distribution_batches` recreated to add `expected_pieces_count` and relax legacy NOT NULL constraints.
- Parts inventory formula: `produced − distributed` per (model_name, part_name); returns not attributed per-part.
- `cutting:getSizeSuggestions` replaced by `cutting:getPartSuggestions(modelName)`.
- `distribution:getAvailablePieces` replaced by `distribution:getAvailablePartsForModel(modelName)`.

---

## Phase 1 — Design & Contracts

**Status**: Complete.

- [data-model.md](data-model.md) — schema definitions, migration SQL, derived inventory view query
- [contracts/ipc-channels.md](contracts/ipc-channels.md) — full request/response contracts for all new, updated, and removed channels
- [quickstart.md](quickstart.md) — file-level change map and smoke test checklist

### Schema Changes Summary

| Table | Action | Key Change |
|-------|--------|------------|
| `cutting_parts` | Create new | Aggregate parts per session (part_name, count) |
| `distribution_batch_parts` | Create new | Per-part rows per distribution batch |
| `distribution_batches` | Recreate | Add `expected_pieces_count`; nullable `size_label`, `color` |
| `cutting_pieces` | No change | Legacy — read-only from new code |
| `distribution_piece_links` | No change | Legacy — kept for old batch data |

### IPC Channels Summary

| Channel | Action |
|---------|--------|
| `cutting:getPartSuggestions` | New |
| `cutting:getPartsInventory` | New |
| `distribution:getAvailablePartsForModel` | New |
| `cutting:create` | Updated payload (parts[] instead of sizes[]) |
| `cutting:getById` | Updated response (parts[] instead of piecesBySize) |
| `cutting:getKpis` | Updated response (parts-based totals) |
| `distribution:distribute` | Updated payload (expectedPiecesCount + parts[]) |
| `distribution:getBatchesForTailor` | Updated response (includes parts breakdown) |
| `distribution:getDetailByTailor` | Updated response (includes parts breakdown) |
| `cutting:getSizeSuggestions` | Removed |
| `distribution:getAvailablePieces` | Removed |
| `distribution:getSizeSuggestions` | Removed |

---

## Constitution Check (Post-Design)

Re-evaluated after Phase 1 design — no new violations introduced.

- No business logic in components (PartsInventoryPanel is display-only).
- No Drizzle in renderer (all queries in `main.js`).
- All new types are strictly typed with no `any`.
- All IPC responses use the standard `{ success, data } | { success, error }` envelope.
- All new Arabic strings are in `public/locales/ar/`.
- `PartRowsEditor` will follow the same pattern as the existing `ConsumptionRowsEditor` (max 150 lines, named export, no inline styles).
