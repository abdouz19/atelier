# Tasks: Native Desktop UI/UX Overhaul

**Input**: Design documents from `/specs/017-native-desktop-ux/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ipc.md ✅

---

## Phase 1: Setup

**Purpose**: Install new dependency and confirm the development environment is ready.

- [x] T001 Install `framer-motion` v11 — run `npm install framer-motion` inside `frontend/`, commit updated `frontend/package.json` and `frontend/package-lock.json`
- [x] T002 Verify TypeScript types resolve — run `npx tsc --noEmit` from `frontend/` after install; confirm zero errors before proceeding

**Checkpoint**: `framer-motion` importable, no TypeScript errors.

---

## Phase 2: Foundational — Design Token Extension

**Purpose**: Extend the CSS variable system with the new Mica/glass tokens that all visual stories depend on. Must be complete before any component story starts.

**⚠️ CRITICAL**: All visual user stories depend on these tokens existing in globals.css.

- [x] T003 Add Mica surface tokens to `frontend/app/globals.css` — add `--sidebar-bg`, `--glass-surface`, `--glass-border`, `--app-bg` to `:root` and `[data-theme="dark"]` blocks (see research.md R-002)
- [x] T004 Add desktop scrollbar styles to `frontend/app/globals.css` — `::-webkit-scrollbar` rules using existing design tokens (see research.md R-007)
- [x] T005 [P] Add button pressed-state and transition utilities to `frontend/app/globals.css` — `.btn-pressed` active state (translateY 1px, shadow-sm), input focus-ring transition class `transition-[border-color,box-shadow] duration-150`

**Checkpoint**: Open browser devtools and confirm new CSS variables are present on `:root`. Scrollbar is styled in the main content area.

---

## Phase 3: User Story 1 — Branded Login Experience (Priority: P1) 🎯 MVP

**Goal**: Full-viewport branded login portal with glassmorphism card, animated form entrance, and shake-on-error feedback.

**Independent Test**: Launch app unauthenticated → verify background image fills viewport → focus an input (smooth transition) → submit bad credentials (shake) → submit correct credentials (spring transition to dashboard).

### Implementation

- [x] T006 [US1] Rework `frontend/app/(auth)/layout.tsx` — replace centered `bg-gray-50` container with full-viewport grid layout using `login-bg.png` as `background-image` (cover + center), overlay div with `backdrop-blur-sm bg-black/20`, fallback to `bg-base` when image absent (see research.md R-004)
- [x] T007 [US1] Rework `frontend/components/auth/LoginForm.tsx` — update card styles to glassmorphism (semi-transparent background using `--glass-surface`, `--glass-border` 1px border, `shadow-[var(--shadow-md)]`, `backdrop-blur-md`, rounded-2xl preserved)
- [x] T008 [US1] Add staggered entrance animation to `LoginForm.tsx` — wrap card in `motion.div` with `initial/animate` variants; stagger title, username field, password field, submit button using `motion.div` children with `transition.delay` increments (0, 0.05, 0.1, 0.15s)
- [x] T009 [US1] Add shake animation to `LoginForm.tsx` on auth error — wrap form in `motion.div` with `shakeVariants`; trigger `animate={error ? 'shake' : 'idle'}` when `error` from `useAuth()` is non-null (see research.md R-005 shake pattern)
- [x] T010 [US1] Apply focus-ring transition to inputs in `LoginForm.tsx` — add `transition-[border-color,box-shadow] duration-150` to both input className strings

**Checkpoint**: Launch app → login screen has branded background, card looks glassy, form fields animate in on load, wrong password triggers visible shake, correct login transitions smoothly.

---

## Phase 4: User Story 2 — Anchored Command Center Dashboard (Priority: P2)

**Goal**: Full-height anchored sidebar with animated active pill; native title bar; window-filling grid layout with no overflow.

**Independent Test**: Log in → navigate between all sections → verify sidebar stays anchored, active pill slides between items, title area updates, no horizontal overflow at any resolution.

### Implementation

- [x] T011 [US2] Create `frontend/components/layout/PageTransition.tsx` — `'use client'` component wrapping children in `AnimatePresence mode="wait"` + `motion.div` keyed on `usePathname()` with spring variants `{ hidden: {opacity:0, y:8}, visible: {opacity:1, y:0}, exit: {opacity:0, y:-4} }` and `SPRING` config `{type:'spring', stiffness:300, damping:28, mass:0.8}` (see research.md R-005); component must accept `className` and pass `flex-1 overflow-auto` to the motion div
- [x] T012 [US2] Update `frontend/components/layout/AppLayout.tsx` — replace `<main className="flex-1 overflow-auto p-6">` with `<PageTransition>` wrapper; keep `p-6` padding inside the transition
- [x] T013 [US2] Upgrade `frontend/components/layout/Sidebar.tsx` — add active pill animation: make each nav link `relative overflow-hidden`, add `{isActive && <motion.span layoutId="sidebar-active-pill" className="absolute inset-0 rounded-lg bg-primary-500" transition={SPRING} />}` inside the link; update icon/label to `relative z-10` so they render above the pill (see research.md R-003)
- [x] T014 [US2] Apply `--sidebar-bg` token to `Sidebar.tsx` — replace `bg-surface` on `<aside>` with `bg-[var(--sidebar-bg)]` to use the deeper Mica-toned background token added in T003

**Checkpoint**: Navigate between Dashboard → Cutting → Distribution → Settings. Active pill animates smoothly. No page flicker. Sidebar visually distinct from main content.

---

## Phase 5: User Story 3 — Tactile Component System (Priority: P3)

**Goal**: All interactive elements (buttons, inputs, cards) have visible hover, focus, and pressed depth states.

**Independent Test**: Open any form page → hover buttons (shadow change) → click button (pressed state) → focus input (ring transition) → view any AppCard (shadow + border depth visible).

### Implementation

- [x] T015 [P] [US3] Audit all button usages across `frontend/components/` — identify primary action buttons (submit buttons, action buttons) and confirm `transition hover:bg-primary-600 active:translate-y-px active:shadow-sm` classes are present; add missing transition classes where absent. Key files: `LoginForm.tsx`, `frontend/components/shared/` button patterns.
- [x] T016 [P] [US3] Audit all AppCard / data card components in `frontend/components/shared/` — confirm `shadow-[var(--shadow-md)] border border-[var(--glass-border)]` depth classes applied; add where missing to create visual separation from `bg-base` background
- [x] T017 [US3] Audit all form input components — confirm `transition-[border-color,box-shadow] duration-150` is present on all `<input>` and `<textarea>` elements across `frontend/components/`; add where missing (builds on T010 pattern)

**Checkpoint**: Interact with the Employees form, Stock form, and Settings form. All inputs have smooth focus rings. All submit buttons have pressed states. Cards have visible depth.

---

## Phase 6: User Story 4 — Adaptive Dark Mode Polish (Priority: P4)

**Goal**: Dark mode surfaces use Mica-style tonal layering; all text passes 4.5:1 contrast; no surface left in light mode when dark is active.

**Independent Test**: Activate dark mode in Settings → visit every screen → verify tonal contrast between sidebar and main area, semi-transparent modal overlays, no light-mode surfaces remain.

### Implementation

- [x] T018 [US4] Dark mode surface audit — enable dark mode and visit every screen (Dashboard, Cutting, Distribution, QC, Final Stock, Employees, Tailors, Suppliers, Stock, Settings); document any surface, card, or text element that does not respond to `[data-theme="dark"]` CSS variables; fix offending hardcoded color classes
- [x] T019 [US4] Update `AppModal` / overlay components in `frontend/components/shared/` — ensure modal backdrop uses `bg-black/50 backdrop-blur-sm` rather than a solid color, so it creates the semi-transparent Mica layer described in FR-011 and spec US4 scenario 3
- [x] T020 [US4] Verify OS-preference fallback — in `frontend/app/layout.tsx` confirm the `themeInitScript` already handles `'system'` theme via `prefers-color-scheme` (it does per exploration); no code change needed, but verify the behavior by toggling OS theme and observing app response

**Checkpoint**: Toggle dark mode → all surfaces switch. Open any modal in dark mode → backdrop is semi-transparent. Text on all surfaces readable.

---

## Phase 7: User Story 5 — Fluid Desktop Motion (Priority: P5)

**Goal**: All remaining motion touch-points use consistent spring dynamics; rapid navigation is handled gracefully.

**Independent Test**: Rapidly click 5 different nav items → only final destination renders. Open/close modal repeatedly → smooth spring each time, no stacking. Time a page transition → ≤ 300ms.

### Implementation

- [x] T021 [US5] Audit `AppModal` component in `frontend/components/shared/` — add `AnimatePresence` + `motion.div` spring entrance to modal open/close if not already animated; use `SPRING` config from `PageTransition.tsx` for consistency
- [x] T022 [US5] Verify `AnimatePresence mode="wait"` in `PageTransition.tsx` (created in T011) prevents animation queuing — manually rapid-click nav items and confirm only the final page renders; no code change if already working

**Checkpoint**: All motion is spring-based, snappy, and consistent. No animation queuing on rapid navigation.

---

## Phase 8: RTL Verification & Regression (Priority: Cross-cutting)

**Purpose**: Confirm RTL layout is pixel-perfect after all changes, and no existing features regressed.

- [x] T023 [P] RTL audit — with Arabic locale active, verify: sidebar on right edge, active pill positions correctly (RTL flex), scrollbars on left of scroll containers, all Lucide icons that imply direction (arrows, chevrons) are mirrored via `rtl:scale-x-[-1]` or `scale-x` flip where needed, no x-axis animation jank in RTL
- [x] T024 [P] Regression smoke test — navigate every screen (Dashboard, Cutting, Distribution, QC, Final Stock, Employees, Tailors, Suppliers, Stock, Settings); create/edit one record in any CRUD flow; confirm all data displays correctly under the new visual shell
- [x] T025 TypeScript clean compile — run `npx tsc --noEmit` from `frontend/`; zero errors required before marking feature complete

**Checkpoint**: Zero regressions. Zero TypeScript errors. RTL looks correct on all screens. Feature ready for delivery.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational tokens)**: Depends on Phase 1 — BLOCKS all visual phases
- **Phase 3 (US1 Login)**: Depends on Phase 2
- **Phase 4 (US2 Dashboard)**: Depends on Phase 2; can run in parallel with Phase 3 (different files)
- **Phase 5 (US3 Tactile)**: Depends on Phase 2; can run in parallel with Phases 3–4 (mostly different files)
- **Phase 6 (US4 Dark Mode)**: Depends on Phase 2; best after Phase 5 (tactile layer complete)
- **Phase 7 (US5 Motion)**: Depends on Phase 4 (PageTransition exists from T011)
- **Phase 8 (RTL + Regression)**: Depends on all implementation phases complete

### Parallel Opportunities

- T003, T004, T005 — all in globals.css, sequential within the file; T005 can run in parallel with T003+T004 if editing non-overlapping sections
- T006, T007 — different files, fully parallel after Phase 2
- T008, T009, T010 — all in `LoginForm.tsx`, sequential
- T011, T012 — T012 depends on T011 (PageTransition must exist first)
- T013, T014 — both in Sidebar.tsx, sequential
- T015, T016 — different component files, fully parallel
- T023, T024 — independent verification tasks, fully parallel

### Within-Story Task Order

```
US1: T006 → T007 → T008 → T009 → T010
US2: T011 → T012 (sequential) + T013 → T014 (sequential)
US3: T015 [P] + T016 [P] → T017
US4: T018 → T019 → T020
US5: T021 → T022
Final: T023 [P] + T024 [P] → T025
```

---

## Implementation Strategy

### MVP First (Login Screen Only)

1. Complete Phase 1: Install framer-motion
2. Complete Phase 2: Add CSS tokens (T003–T005)
3. Complete Phase 3: Rework login screen (T006–T010)
4. **STOP and VALIDATE**: Branded login portal complete and functional

### Incremental Delivery

1. Setup + Tokens → Foundation ready
2. Login overhaul (US1) → Branded entry point ✅
3. Dashboard shell (US2) → Native navigation feel ✅
4. Tactile layer (US3) → Physical interaction depth ✅
5. Dark mode polish (US4) → Production-ready dark theme ✅
6. Motion polish (US5) → Full spring motion system ✅
7. RTL + Regression (Phase 8) → Ship-ready ✅

---

## Notes

- `SPRING` constant `{type:'spring', stiffness:300, damping:28, mass:0.8}` should be defined once in `PageTransition.tsx` and imported where needed — do not inline different values per component
- All `motion.*` components must use `'use client'` directive in their parent component file (Next.js App Router requirement)
- Do NOT add `framer-motion` imports to Server Components — only to `'use client'` components
- Commit after each phase checkpoint passes
- If `backdrop-filter` causes performance issues (unlikely in Electron), fall back to opaque equivalents using the same CSS variable tokens
