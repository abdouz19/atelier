# Implementation Plan: Native Desktop UI/UX Overhaul

**Branch**: `017-native-desktop-ux` | **Date**: 2026-03-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-native-desktop-ux/spec.md`

## Summary

Transform the Atelier Electron app into a high-end, native-feeling desktop application by overhauling the visual shell (login screen, sidebar, layout), introducing spring-based transitions via Framer Motion, deepening the existing CSS variable design system with Mica-style surface tokens, and ensuring all tactile component states meet desktop-grade interaction standards — while preserving every existing feature and the RTL-first Arabic locale.

## Technical Context

**Language/Version**: TypeScript 5 strict (frontend renderer) + Node.js plain JS (Electron main process)
**Primary Dependencies**: Next.js 16.1.6 (App Router, static export), Electron 41, Tailwind CSS 4, Lucide React, Zustand, react-hook-form + Zod. **New**: `framer-motion` v11
**Storage**: SQLite via better-sqlite3; existing `app_settings` table handles theme persistence — no schema changes required
**Testing**: Manual visual/functional testing (no automated UI test framework in project)
**Target Platform**: Electron desktop app on Windows 10/11, minimum resolution 1280×720
**Project Type**: Desktop app (Electron + Next.js renderer)
**Performance Goals**: All spring animations ≤ 300ms; hover/press visual response ≤ 150ms; login-to-dashboard ≤ 5s on standard hardware
**Constraints**: RTL-first (Arabic, `dir="rtl"` on root); no mobile breakpoints; no new DB schema; zero regressions on existing features
**Scale/Scope**: ~10 screens, existing component library — this is a renderer-only overhaul with no IPC changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Core Data Flow Architecture | ✅ Pass | No new data flows. Theme persistence already exists via `app_settings` + IPC (feature 012/016). No new IPC channels introduced. |
| Component & Page Discipline | ✅ Pass | All new animated wrappers are presentational components with no logic. Max 150 lines enforced. Named exports throughout. |
| Type Safety & Data Integrity | ✅ Pass | Framer Motion ships its own TypeScript types. No `any`, no `@ts-ignore`. |
| RTL & Localization First | ✅ Pass | All layout changes preserve `dir="rtl"` root. Framer Motion transforms are coordinate-based and unaffected by text direction. RTL audit task included. |
| UI/UX Consistency & State Management | ✅ Pass | `AppLayout` and `PageHeader` remain on every dashboard page. No `localStorage` introduced (theme uses existing SQLite path). |

**No gate violations. No Complexity Tracking table needed.**

## Project Structure

### Documentation (this feature)

```text
specs/017-native-desktop-ux/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ipc.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files changed by this feature)

```text
frontend/
├── package.json                          # ADD: framer-motion dependency
├── app/
│   ├── globals.css                       # MODIFY: add Mica surface tokens, glass-border,
│   │                                     #   deep sidebar tokens, desktop scrollbar styling,
│   │                                     #   button pressed-state utilities
│   ├── (auth)/
│   │   └── layout.tsx                    # MODIFY: full-viewport login-bg.png layout with fallback
│   └── (dashboard)/
│       └── layout.tsx                    # MODIFY: wrap children in PageTransition component
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx                 # MODIFY: glassmorphism card, stagger entrance,
│   │                                     #   shake animation on auth error
│   └── layout/
│       ├── AppLayout.tsx                 # MODIFY: add PageTransition import + usage
│       ├── Sidebar.tsx                   # MODIFY: active-pill with Framer Motion layoutId
│       └── PageTransition.tsx            # NEW: spring route transition wrapper
└── public/
    └── login-bg.png                      # EXISTS: 544KB branded background (no changes)
```

**Structure Decision**: Single Next.js renderer project. All changes are confined to `frontend/`. No Electron main process changes required. No new routes or pages — purely visual/motion layer on top of the existing structure.
