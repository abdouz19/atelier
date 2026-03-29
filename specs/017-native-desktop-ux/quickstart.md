# Quickstart: Native Desktop UI/UX Overhaul

**Feature**: 017-native-desktop-ux
**Date**: 2026-03-28

## Prerequisites

- Node.js 20+ installed
- All existing dependencies installed (`npm install` in both root and `frontend/`)
- The `017-native-desktop-ux` branch is checked out

## Setup

### 1. Install Framer Motion

```bash
cd frontend
npm install framer-motion
```

Verify installation:
```bash
npm list framer-motion
# Should show: framer-motion@11.x.x
```

### 2. Start the Development Server

```bash
# From repo root:
npm run dev:electron
```

This starts both the Next.js dev server and Electron. Changes to `frontend/` hot-reload automatically.

## Key Files to Modify

| File | What changes |
|------|-------------|
| `frontend/app/globals.css` | Add Mica tokens, glass-border, sidebar-bg, scrollbar styles |
| `frontend/app/(auth)/layout.tsx` | Full-viewport login background |
| `frontend/components/auth/LoginForm.tsx` | Glassmorphism card + animations |
| `frontend/components/layout/Sidebar.tsx` | Active pill with Framer Motion layoutId |
| `frontend/components/layout/AppLayout.tsx` | Wrap content in PageTransition |
| `frontend/components/layout/PageTransition.tsx` | NEW: spring route transition wrapper |

## Framer Motion Usage Patterns

### Spring config (use consistently across all animations)
```ts
const SPRING = { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 } as const;
```

### Active pill in Sidebar
```tsx
import { motion } from 'framer-motion';

{isActive && (
  <motion.span
    layoutId="sidebar-active-pill"
    className="absolute inset-0 rounded-lg bg-primary-500"
    transition={SPRING}
  />
)}
```

### Page transition wrapper
```tsx
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={SPRING}
        className="flex-1 overflow-auto"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Login shake animation
```tsx
const shakeVariants = {
  idle: { x: 0 },
  shake: { x: [0, -8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.4 } },
};
// Trigger: animate={error ? 'shake' : 'idle'}
```

## Verification Checklist

Run through these checks after each task:

- [ ] Login screen: full-viewport background image visible, card centered, fallback works (rename login-bg.png temporarily)
- [ ] Login form: stagger entrance on load, shake on bad credentials, smooth transition to dashboard
- [ ] Sidebar: active pill slides smoothly between nav items, no jump on page load
- [ ] Page transitions: all routes animate in/out in ≤ 300ms, rapid clicks don't queue animations
- [ ] Dark mode: toggle in Settings → all surfaces update, no flash, correct contrast on all screens
- [ ] RTL: sidebar on right, scrollbars on left, no misaligned icons
- [ ] All existing features functional (cutting, distribution, QC, stock, employees, tailors, suppliers, settings)
- [ ] No TypeScript errors (`npx tsc --noEmit` from `frontend/`)
