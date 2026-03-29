# Research: Native Desktop UI/UX Overhaul

**Feature**: 017-native-desktop-ux
**Date**: 2026-03-28

---

## R-001: Framer Motion Version Compatibility

**Decision**: Use `framer-motion` v11 (latest stable as of March 2026).

**Rationale**: Framer Motion v11 is the first release with full React 19 compatibility (concurrent mode, Server Components). The project uses React 19.2.3 and Next.js 16. Earlier versions (v10) work but emit deprecation warnings with React 19. v11 also ships smaller bundles via tree-shaking.

**Alternatives considered**:
- `motion` (the rebranded v11+ package from the same authors): functionally identical, but `framer-motion` is the stable, well-known alias and avoids a dependency rename migration.
- CSS transitions only: insufficient for the spring physics required by the spec (FR-014). CSS cannot express spring damping/stiffness natively.
- React Spring: capable, but adds a second animation library where Framer Motion covers all required use cases (layout animations, AnimatePresence, spring configs).

**Installation**: `npm install framer-motion` inside `frontend/`

---

## R-002: Mica / Glassmorphism in CSS

**Decision**: Implement Mica-style surfaces using `backdrop-filter: blur(20px)` combined with a semi-transparent CSS variable-backed background (`rgba` with 0.6–0.8 opacity). No OS-native Mica API.

**Rationale**: Electron does not expose the Windows 11 Mica material API in a stable, cross-version manner. CSS `backdrop-filter` achieves a visually equivalent result (blurred, semi-transparent surfaces that reveal depth behind them) and works consistently across Chromium (Electron's renderer). The effect is pure CSS — no JavaScript overhead.

**New CSS tokens to add to `globals.css`**:
```css
--sidebar-bg:       rgba(15, 23, 42, 0.92);    /* deep obsidian, slightly transparent */
--glass-surface:    rgba(255, 255, 255, 0.08);  /* light glass overlay for cards */
--glass-border:     rgba(255, 255, 255, 0.10);  /* 1px subtle white border */
--app-bg:           var(--bg-base);             /* alias for clarity */
```

Dark mode versions:
```css
[data-theme="dark"] {
  --sidebar-bg:     rgba(10, 15, 30, 0.95);
  --glass-surface:  rgba(255, 255, 255, 0.04);
  --glass-border:   rgba(255, 255, 255, 0.08);
}
```

**Alternatives considered**:
- Electron `backgroundMaterial: 'mica'` (Windows 11 only, Electron 22+): fragile across Windows versions and unavailable on older hardware. Rejected for portability.
- Pure opaque dark surfaces: Simpler but loses the layered depth effect that is core to the spec.

---

## R-003: Framer Motion Active Pill (Sidebar)

**Decision**: Use `motion.span` with `layoutId="sidebar-active-pill"` as a background element inside each nav item. When the active item changes, Framer Motion automatically animates the pill between positions using layout animations.

**Pattern**:
```tsx
{isActive && (
  <motion.span
    layoutId="sidebar-active-pill"
    className="absolute inset-0 rounded-lg bg-primary-500"
    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
  />
)}
```
Nav items need `relative` positioning. The link text/icon sits above the pill with `relative z-10`.

**Rationale**: `layoutId` is the idiomatic Framer Motion approach for shared-element transitions. It requires zero imperative code — the animation triggers automatically when the component with the matching `layoutId` mounts/unmounts across re-renders.

**Alternatives considered**:
- CSS transition on background-color: Works but produces a color fade, not a physical sliding pill.
- Manual x/y animation with useEffect: More brittle; requires measuring DOM positions.

---

## R-004: Login Screen — Full-Viewport Background

**Decision**: Rework `(auth)/layout.tsx` to use CSS Grid with the background image applied as a `background-image` on the root div, covering the full viewport. A `<div>` with `backdrop-filter: blur(4px)` and `bg-black/30` overlays the image to ensure card legibility.

**Pattern**:
```tsx
<div
  className="grid h-screen place-items-center"
  style={{ backgroundImage: 'url(/login-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
>
  <div className="absolute inset-0 backdrop-blur-sm bg-black/20" />
  <div className="relative z-10">{children}</div>
</div>
```

**Fallback**: If `login-bg.png` fails, the `bg-base` CSS variable produces a neutral solid background — no layout breakage.

**Alternatives considered**:
- `<img>` tag as background: Requires absolute positioning and z-indexing complexity.
- CSS `background-image` on the `body`: Leaks outside the auth route group.

---

## R-005: Page Transition (Route Changes)

**Decision**: Wrap route content in a `PageTransition` component using `motion.div` with `AnimatePresence`. Use `key={pathname}` to trigger exit/enter on route changes.

**Spring config**:
```ts
{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }
```
This produces a ~250ms transition that feels snappy and physical, well within the 300ms spec requirement.

**Variants**:
```ts
const variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
}
```

**Rapid navigation guard**: Using `mode="wait"` on `AnimatePresence` ensures only one page animates at a time and rapid clicks resolve to the final destination.

**Alternatives considered**:
- CSS keyframe animations on `.page-enter`: Less controllable, cannot express spring physics.
- `next/navigation` view transitions API: Experimental in Next.js 16, not stable.

---

## R-006: RTL Compatibility with Framer Motion

**Decision**: No special RTL handling required for Framer Motion. All layout animations (`layoutId`, scale, y-axis) operate in the CSS coordinate system and are unaffected by `dir="rtl"`. Horizontal slide animations (x-axis) must be avoided or inverted if used — the chosen page transition uses y-axis only, which is RTL-safe.

**Sidebar**: Already uses `border-l` / right-anchored positioning via the existing `flex h-screen` layout in `AppLayout.tsx`. The active pill animation is position-relative within each nav item — RTL direction of the containing flex does not affect it.

---

## R-007: Desktop Scrollbar Styling

**Decision**: Add custom scrollbar CSS using the `::-webkit-scrollbar` pseudo-elements (Chromium/Electron). Style to match the design system tokens.

```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
```

**RTL**: Scrollbars appear on the left side of scroll containers when `dir="rtl"` is set — this is native browser/Chromium behavior. No additional CSS required.

---

## R-008: Tactile Component States

**Decision**: Implement hover/pressed depth states using Tailwind utility classes added to existing component classes. No new component files needed — update `LoginForm.tsx` inputs/buttons and add global utility classes to `globals.css` for reuse.

**Button pressed state**:
```css
.btn-primary:active {
  transform: translateY(1px);
  box-shadow: var(--shadow-sm);
}
```

**Input focus ring** (already partially implemented in LoginForm.tsx):
```
focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
```
Transition class: `transition-[border-color,box-shadow] duration-150`

**Card depth**: `shadow-[var(--shadow-md)] border border-[var(--glass-border)]`

---

## Summary of Decisions

| ID | Topic | Decision |
|----|-------|----------|
| R-001 | Animation library | `framer-motion` v11 |
| R-002 | Mica/glass surfaces | CSS `backdrop-filter` + semi-transparent CSS vars |
| R-003 | Active sidebar pill | Framer Motion `layoutId` on `motion.span` |
| R-004 | Login background | CSS `background-image` on auth layout root div |
| R-005 | Page transitions | `AnimatePresence` + spring `motion.div` with y-axis variants |
| R-006 | RTL + animations | y-axis only transitions; RTL-safe by design |
| R-007 | Scrollbar styling | `::-webkit-scrollbar` Chromium-specific CSS |
| R-008 | Tactile states | Tailwind utilities + CSS `transition` on existing components |
