# Quickstart: UI/UX Enhancement & Platform Customization

**Branch**: `016-ui-overhaul-customization` | **Date**: 2026-03-27

---

## Running the App

```bash
# From the repo root
npm run dev:electron
```

This starts both the Next.js dev server and the Electron shell. The app opens automatically.

---

## Testing the Visual Overhaul

### Sidebar

1. Open the app — the sidebar (right side, RTL) should show:
   - Atelier logo or app name at the top
   - Navigation items grouped by domain with icons
   - Active page highlighted with a filled rounded pill in the primary color
   - User avatar, name, and role at the bottom
   - Logout button below the user info

2. Navigate between pages — verify the pill indicator updates to the new active item

### Per-Page Layout Rhythm

1. Go to any data screen (e.g., `/stock`, `/employees`, `/tailors`)
2. Verify the layout from top to bottom:
   - Screen title (large, bold) with the primary action button (e.g., "إضافة مورد") on the left
   - KPI cards in a responsive grid below — each with a large value, muted label, icon, and colored left border
   - Main content area as a card (surface background, soft shadow, rounded corners)
   - Table inside the card with sticky header, alternating rows, and hover highlight

### Data Tables

1. On any table screen, scroll down a long list — the table header must remain pinned
2. Hover over a row — a subtle background highlight should appear
3. Hover over a row's action area — icon buttons become visible only on hover
4. Verify number columns (quantities, totals) are right-aligned within RTL layout

### Modals

1. Click any "add" or "edit" action button to open a modal
2. Verify: blurred backdrop behind the modal, header with title and × button, scrollable body, sticky footer with Cancel and Confirm buttons
3. For multi-step modals (e.g., NewCuttingSessionModal, DistributeModal), verify the step indicator in the header shows step names with the current step highlighted

### Forms

1. Open any add/edit modal and try to submit without filling required fields
2. Verify: inline red error messages appear directly below each invalid field
3. Click any field — verify the focus ring appears in the primary color

### Empty States

1. Create a new atelier, navigate to a module with no data yet
2. Verify the empty state: icon + title + description + call-to-action button (not a blank table)

### KPI Cards (Trend Indicators)

1. On the Dashboard or any module with KPI cards, verify each card shows a trend arrow (↑ green or ↓ red) with a percentage vs the previous month
2. If there is no historical data (e.g., first month of use), verify the trend indicator is hidden — not shown as "0%"

---

## Testing Platform Customization

### Opening the Customization Section

1. Go to **Settings** (via the sidebar)
2. Find the **"تخصيص المنصة"** section (below the existing lookup and password sections)
3. The section should have three sub-areas: Logo, Theme, Primary Color — and a live preview panel on the right

### Logo Upload

1. Click "رفع الشعار" (Upload Logo) — a file picker opens
2. Select a PNG, JPG, or SVG file under 2MB — the logo should appear in both the live preview and replace the app name in the main Sidebar
3. Click "إزالة الشعار" (Remove Logo) — the logo is removed and the default app name is restored
4. Try uploading a PDF or a file larger than 2MB — verify a clear Arabic error message appears

### Theme Toggle

1. Click the **Dark** option card — the entire app should switch to dark mode immediately (live preview + main app)
2. Click **System** — the theme should match your OS setting
3. Click **Light** — returns to light mode
4. These changes are preview-only until Save is clicked; refresh the app to confirm they did not persist yet

### Primary Color Picker

1. Click each color swatch circle — the live preview panel updates the sidebar item, KPI card accent, and button color in real time
2. Changes are preview-only until Save is clicked

### Live Preview Panel

1. As you change theme or color, the small sidebar item, KPI card, and button in the preview panel should update immediately
2. The preview must not require a save to reflect selections

### Saving & Persistence

1. Make a selection (e.g., indigo color + dark mode)
2. Click **حفظ** (Save)
3. Fully close and reopen the app
4. Verify the app opens with indigo primary color and dark mode — no re-selection needed

### Reset to Defaults

1. With a non-default configuration saved, click **استعادة الإعدادات الافتراضية**
2. A confirmation dialog should appear — confirm it
3. Verify logo is removed, theme reverts to System, primary color reverts to Blue
4. Save and restart — verify defaults persist

---

## Build Verification

```bash
# Verify the static export compiles without errors
npm run build

# Full Electron distribution build
npm run build:electron
```

No TypeScript errors, no unused imports — the strict mode compiler must pass cleanly.

---

## Key Files to Review After Implementation

| File | What to Check |
|------|-------------|
| `frontend/app/globals.css` | 6 color palettes defined under `[data-primary]` selectors, dark mode vars, `@theme inline` mapping |
| `frontend/app/layout.tsx` | Inline `<script>` injects `data-primary` and `data-theme` before React paint |
| `frontend/components/layout/Sidebar.tsx` | Logo at top, grouped nav, pill indicator, user info at bottom |
| `frontend/components/shared/AppModal.tsx` | Blur backdrop, sticky footer, scrollable body |
| `frontend/components/shared/KpiCard.tsx` | Trend indicator hidden when no historical data |
| `frontend/store/useThemeStore.ts` | `applyToDocument()` sets attributes on `document.documentElement` |
| `electron/features/settings/queries.js` | Uses `INSERT OR IGNORE` defaults; logo size validation |
| `electron/preload/index.ts` | `settings.getAppearanceSync` uses `ipcRenderer.sendSync` |
