# Tasks: Analytics Dashboard

**Feature**: 011-analytics-dashboard | **Branch**: `011-analytics-dashboard`

## Phase 1 — Setup

- [X] T001 Install recharts in frontend/package.json via npm install recharts
- [X] T002 Create electron/features/dashboard/ directory structure

## Phase 2 — Backend (Electron Main)

- [X] T003 Create electron/features/dashboard/queries.js with all SQL queries
- [X] T004 Create electron/features/dashboard/service.js thin wrapper
- [X] T005 Modify electron/main.js — require dashboardService + register 3 IPC handlers
- [X] T006 Modify electron/preload.js — add dashboard namespace

## Phase 3 — Frontend Types & IPC Client

- [X] T007 [P] Create frontend/features/dashboard/dashboard.types.ts
- [X] T008 [P] Modify frontend/features/auth/auth.types.ts — add dashboard to Window.ipcBridge
- [X] T009 Modify frontend/lib/ipc-client.ts — add dashboard section (depends on T007)

## Phase 4 — Hook

- [X] T010 Create frontend/hooks/useDashboard.ts

## Phase 5 — US1: KPI Cards

- [X] T011 [US1] Create frontend/components/dashboard/DashboardKpiCards.tsx

## Phase 6 — US2: Pipeline Widget

- [X] T012 [US2] Create frontend/components/dashboard/PipelineWidget.tsx

## Phase 7 — US3: Charts

- [X] T013 [P] [US3] Create frontend/components/dashboard/MonthlyProductionChart.tsx
- [X] T014 [P] [US3] Create frontend/components/dashboard/PipelineDonutChart.tsx
- [X] T015 [P] [US3] Create frontend/components/dashboard/TopTailorsChart.tsx
- [X] T016 [P] [US3] Create frontend/components/dashboard/TopModelsChart.tsx
- [X] T017 [P] [US3] Create frontend/components/dashboard/FabricConsumptionChart.tsx
- [X] T018 [P] [US3] Create frontend/components/dashboard/EmployeeDebtChart.tsx

## Phase 8 — US4: Activity Feed

- [X] T019 [US4] Create frontend/components/dashboard/ActivityFeed.tsx

## Phase 9 — US5: Page & Filters

- [X] T020 [US5] Modify frontend/app/(dashboard)/dashboard/page.tsx — replace stub with full page

## Phase 10 — Validation

- [X] T021 Run TypeScript check (npx tsc --noEmit in frontend/)
