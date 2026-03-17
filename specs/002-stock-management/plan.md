# Implementation Plan: Stock Management

**Branch**: `002-stock-management` | **Date**: 2026-03-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-stock-management/spec.md`

## Summary

Implement the central inventory management screen for Atelier. Users can browse, search, and filter stock items; add new items with an initial quantity; record incoming deliveries; view per-color variant quantities and full transaction history; edit item metadata; and archive/restore items. Quantities are always computed (never stored directly) from inbound and consumed transactions. The feature follows the established Electron IPC → service → Drizzle → SQLite architecture with a Next.js frontend.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 16 (App Router, static export), React 19, Electron 41, better-sqlite3 12, Drizzle ORM, Zod 4, react-hook-form 7, Zustand 5, Tailwind 4, Lucide React
**Storage**: SQLite via Drizzle ORM — two new tables: `stock_items`, `stock_transactions`
**Testing**: Manual integration testing via Electron app (no automated test runner configured in current project)
**Target Platform**: Desktop (macOS/Windows via Electron)
**Project Type**: Desktop application
**Performance Goals**: Stock list renders within 1 second for up to 1000 items; quantity computation runs in-process synchronously
**Constraints**: Offline-only (no network), RTL Arabic UI, static Next.js export (no SSR), all persistent state in SQLite
**Scale/Scope**: Expected ~100–500 stock items, ~5000–50000 transactions over app lifetime

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| Core Data Flow (Page → Hook → ipc-client → handler → service → queries → Drizzle → SQLite) | ✅ Pass | All stock operations follow this chain; no shortcuts |
| Component & Page Discipline (pages compose + call hooks only, components ≤150 lines) | ✅ Pass | StockPage composes layout + calls hooks; no logic in components |
| Type Safety (strict TS, no `any`, IPC typed as `{success,data}\|{success:false,error}`) | ✅ Pass | All IPC channels typed; Zod validates all form data |
| RTL & Localization (Arabic UI, all strings in `public/locales/ar/`) | ✅ Pass | New `stock.json` locale file required |
| UI/UX Consistency (AppLayout, PageHeader, EmptyState, skeleton loaders, ErrorAlert, ConfirmDialog) | ✅ Pass | Stock page uses AppLayout/PageHeader; archive action uses ConfirmDialog |
| No business logic in components | ✅ Pass | Quantity computation lives in `stock.service.ts` |
| No Drizzle in renderer | ✅ Pass | All DB access through IPC |
| No useEffect for data fetching | ✅ Pass | All data via hooks using IPC |
| No hardcoded strings in JSX | ✅ Pass | All strings externalized to locale file |
| Every table has id, created_at, updated_at | ✅ Pass | Both new tables include these columns |

**No violations. Gate passed.**

## Project Structure

### Documentation (this feature)

```text
specs/002-stock-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ipc-channels.md
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
# Electron (main process)
electron/
├── db/
│   └── schema/
│       ├── stock_item.ts          # Stock item table definition
│       └── stock_transaction.ts  # Stock transaction table definition
├── features/
│   └── stock/
│       ├── stock.service.ts       # Business logic: compute quantities, validate, archive
│       └── stock.queries.ts       # Drizzle queries: CRUD + aggregations
└── ipc/
    └── stock.handler.ts           # IPC handler: one file for stock domain

# Frontend (renderer process)
frontend/
├── app/
│   └── (dashboard)/
│       └── stock/
│           ├── page.tsx           # Stock list page
│           └── [id]/
│               └── page.tsx       # Item detail page
├── components/
│   └── stock/
│       ├── StockTable.tsx         # Main data table
│       ├── StockTableRow.tsx      # Single row with quantity flag + variant badge
│       ├── AddItemModal.tsx       # Create item modal (react-hook-form + Zod)
│       ├── AddInboundModal.tsx    # Add incoming quantity modal
│       ├── EditItemModal.tsx      # Edit metadata modal
│       ├── EditTransactionModal.tsx # Edit inbound transaction modal
│       ├── ItemDetailPanel.tsx    # Detail view container
│       ├── ColorVariantCard.tsx   # Per-color variant card with quantity
│       ├── TransactionHistory.tsx # Chronological transaction list
│       └── ArchivedItemsView.tsx  # Archived items table + restore action
├── hooks/
│   ├── useStockList.ts            # Hook: list with search/filter + archive
│   ├── useStockItem.ts            # Hook: single item detail + transactions
│   └── useStockMutations.ts       # Hook: create, update, addInbound, archive, restore
├── features/
│   └── stock/
│       └── stock.types.ts         # Shared TypeScript types for stock domain
├── store/
│   └── useStockStore.ts           # Zustand: search query, type filter, selected item UI state
└── public/
    └── locales/
        └── ar/
            └── stock.json         # All Arabic strings for stock module
```

**Structure Decision**: Single Electron + Next.js project following the established pattern from the auth feature. Feature code lives under `electron/features/stock/` and `frontend/` mirrored structure. IPC handler in `electron/ipc/stock.handler.ts`.

## Complexity Tracking

> No Constitution violations — section not applicable.
