# Feature Specification: Native Desktop UI/UX Overhaul

**Feature Branch**: `017-native-desktop-ux`
**Created**: 2026-03-28
**Status**: Draft
**Input**: User description: "Native Desktop UI/UX Specification — transform Atelier into a high-end, desktop-first native OS-like application"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Branded Login Experience (Priority: P1)

A production operator opens Atelier and is greeted by a visually branded, full-screen login portal. The background is a fixed high-resolution abstract image that establishes brand identity. A centered translucent card contains the login form with clear input focus transitions and high-visibility inline error messaging. The user enters credentials and transitions smoothly into the application.

**Why this priority**: The login screen is the first impression of the redesign. It is self-contained, independently testable, and delivers immediate visual proof of the new brand direction.

**Independent Test**: Can be fully tested by launching the app unauthenticated, verifying the branded background renders, submitting valid/invalid credentials, and confirming smooth transition into the dashboard.

**Acceptance Scenarios**:

1. **Given** the app is launched unauthenticated, **When** the login screen appears, **Then** the full viewport shows a static abstract background image (`/login-bg.png`) with a centered translucent card overlaid on it.
2. **Given** the login form is visible, **When** the user focuses an input field, **Then** a smooth visual transition (highlight, border change) communicates active state within 150ms.
3. **Given** incorrect credentials are entered, **When** the user submits, **Then** inline error messaging appears prominently within the card without a page reload.
4. **Given** correct credentials are submitted, **When** authentication succeeds, **Then** the view transitions into the dashboard with a spring animation completing in ≤ 300ms.

---

### User Story 2 — Anchored Command Center Dashboard (Priority: P2)

A logged-in operator navigates the application through a full-height sidebar that stays anchored to the window edge at all times. The sidebar displays bold Lucide icons with clear active-state indicators. A native-style title area at the top of the main content area provides page context and quick actions without feeling like a browser chrome. The layout fills the entire window with no overflow scrolling at the shell level.

**Why this priority**: The navigation shell is used on every screen. A stable, anchored sidebar and title bar elevates the entire app experience and provides the structural foundation the rest of the redesign builds on.

**Independent Test**: Can be tested by navigating between all main sections and verifying the sidebar remains fixed, icons are legible, the active route is highlighted, and the title area reflects the current section.

**Acceptance Scenarios**:

1. **Given** the user is on any page, **When** they look at the sidebar, **Then** it spans the full window height, is anchored to the correct edge (right for RTL / left for LTR), and does not scroll with page content.
2. **Given** the user navigates to a new section, **When** the route changes, **Then** the active sidebar item is visually distinct (bold, highlighted, or accented) and the title area updates to reflect the new section name.
3. **Given** the RTL locale (Arabic) is active, **When** the layout renders, **Then** the sidebar is on the right, close/action buttons are mirrored, and scrollbars appear on the left.
4. **Given** the window is resized to any standard desktop resolution (≥ 1280×720), **When** content is displayed, **Then** the layout fills the viewport with no horizontal overflow.

---

### User Story 3 — Tactile Component System (Priority: P3)

All interactive components (buttons, cards, inputs, table rows) communicate depth and interactivity through subtle visual cues: 1px borders, layered shadows, and "pressed" states on click. The visual language makes the interface feel physical and responsive.

**Why this priority**: Tactile fidelity reinforces the desktop-native feel across every interaction. It is a polish layer above structure and navigation, so it builds on P1 and P2.

**Independent Test**: Can be tested by interacting with any form, button, or data table and verifying visible pressed states and depth cues are present without requiring the sidebar or login to be in a specific state.

**Acceptance Scenarios**:

1. **Given** any primary button is displayed, **When** the user hovers it, **Then** a subtle elevation or shadow change is visible within 100ms.
2. **Given** any primary button is clicked, **When** the pointer is pressed down, **Then** a "pressed" visual state (reduced shadow, slight inset appearance) is displayed during the press.
3. **Given** a data card is rendered, **When** the user views it, **Then** a 1px border and layered shadow provide depth separation from the background.
4. **Given** any form input is displayed, **When** the user focuses it, **Then** the border or ring transitions to the accent color within 150ms.

---

### User Story 4 — Adaptive Dark Mode (Priority: P4)

The application supports a high-contrast dark mode with deep, semi-transparent ("Mica-style") surface backgrounds. When dark mode is active, the visual hierarchy is maintained through careful surface layering and contrast ratios to reduce eye strain during extended production sessions.

**Why this priority**: Long production sessions are a core use case. Dark mode is an enhancement layer that relies on the component system (P3) being in place.

**Independent Test**: Can be tested by activating dark mode in settings and verifying that all surfaces, text, borders, and icons remain readable and properly layered with no visible contrast failures.

**Acceptance Scenarios**:

1. **Given** dark mode is activated, **When** any screen is viewed, **Then** background surfaces use deep, layered tones and all text meets a minimum contrast ratio of 4.5:1 against its background.
2. **Given** dark mode is active, **When** the sidebar and main content area are displayed side by side, **Then** a visible tonal contrast differentiates them without a hard border.
3. **Given** dark mode is active, **When** a modal or overlay is opened, **Then** the overlay background uses a semi-transparent dark surface that does not fully obscure context behind it.
4. **Given** the user toggles between dark and light modes, **When** the theme changes, **Then** all surfaces update consistently with no flash of unstyled content.

---

### User Story 5 — Fluid Desktop Motion (Priority: P5)

All view-level transitions (page changes, modal openings, drawer slides) use spring-based animations that feel snappy and physical. Animations complete within 300ms and never block interaction.

**Why this priority**: Motion is the final polish layer. It requires stable components and layouts to function correctly, making it the last dependency in the redesign chain.

**Independent Test**: Can be tested by navigating between pages and opening/closing modals, measuring transition duration, and verifying no jank or layout shift occurs during or after animations.

**Acceptance Scenarios**:

1. **Given** the user navigates from one page to another, **When** the transition starts, **Then** a spring animation plays, completes in ≤ 300ms, and the new content is fully interactive immediately after.
2. **Given** a modal is opened, **When** it appears, **Then** it scales or slides in using a spring curve with no perceptible lag.
3. **Given** the user rapidly navigates (clicking multiple items quickly), **When** each navigation triggers, **Then** animations do not stack or queue — only the final destination renders.

---

### Edge Cases

- What happens when `/login-bg.png` is missing or fails to load? The card must remain fully functional against a solid fallback background.
- How does the layout behave if the window is resized below 1280px width? A minimum usable layout must exist; the shell must not break.
- What happens when the user switches locale (RTL ↔ LTR) without restarting? The layout mirroring must update dynamically without a full reload.
- How does the "pressed" state interact with disabled components? Disabled components must never show hover or pressed states.
- What happens if the dark mode preference is not persisted across sessions? The app must default to the OS-level preference on first launch.
- How does animation behave on a machine under heavy CPU load? Animations must gracefully drop or shorten rather than causing jank or blocking input.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The login screen MUST display a full-viewport branded background image that remains static and does not scroll with any content.
- **FR-002**: The login screen MUST display a centered, visually elevated card containing all authentication form elements.
- **FR-003**: The login form MUST preserve and validate existing credentials without requiring re-enrollment.
- **FR-004**: The login form MUST show high-visibility inline error messages when authentication fails, without a full page reload.
- **FR-005**: If the background image fails to load, the login screen MUST remain fully functional against a solid fallback background.
- **FR-006**: The application shell MUST include a full-height sidebar that remains anchored and does not scroll with page content for the lifetime of the authenticated session.
- **FR-007**: The sidebar MUST display navigation items using bold icon-based labels with a clear, visually distinct active state for the current route.
- **FR-008**: The main content area MUST include a native-style header that displays the current section name and contextual quick actions.
- **FR-009**: The layout MUST fill the entire window using a rigid grid-based structure with no horizontal overflow at supported desktop resolutions (≥ 1280×720).
- **FR-010**: All interactive components (buttons, inputs, cards, table rows) MUST display distinct hover, focus, and pressed visual states.
- **FR-011**: The design system MUST support a high-contrast dark mode with semi-transparent surface layering across all screens.
- **FR-012**: Dark and light mode preferences MUST be persisted across sessions and MUST default to the OS-level preference on first launch.
- **FR-013**: When the RTL locale (Arabic) is active, the sidebar MUST appear on the right edge, directional icons and close buttons MUST be mirrored, and scrollbars MUST appear on the left.
- **FR-014**: All page-level view transitions MUST use spring-based animations completing in ≤ 300ms.
- **FR-015**: Modal and overlay openings MUST animate in with a spring curve and MUST NOT block user interaction after animation completes.
- **FR-016**: Rapid consecutive navigations MUST NOT cause animation queuing — the UI MUST resolve directly to the final destination state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete login (from app open to dashboard visible) in under 5 seconds on a standard production machine.
- **SC-002**: All page-level transitions complete in 300ms or less with no dropped frames on a standard production machine.
- **SC-003**: All interactive components respond visually to hover and press within 150ms (perceived as instant).
- **SC-004**: The application layout shows no horizontal scrollbar at any window size ≥ 1280×720.
- **SC-005**: All text in both light and dark modes meets a minimum contrast ratio of 4.5:1 against its background surface.
- **SC-006**: RTL layout mirrors all directional elements correctly with zero misaligned components observable by a native Arabic-speaking user.
- **SC-007**: Dark mode propagates across all surfaces (sidebar, cards, modals, inputs) with no surface remaining in light mode when dark mode is active.
- **SC-008**: Zero regressions in existing functionality — all previously working features continue to operate correctly within the new visual shell.

## Assumptions

- The existing authentication logic and credential model remain unchanged; only the visual presentation of the login screen is updated.
- A `/login-bg.png` asset will be provided before implementation begins; the fallback is a solid accent-color background.
- "Standard production machine" is defined as a Windows 10/11 PC with integrated graphics and at least 8 GB RAM, running the Electron desktop build.
- All supported resolutions are desktop-only (≥ 1280×720); mobile and tablet breakpoints are out of scope.
- Arabic (RTL) is the only non-LTR locale in scope; other RTL languages are not required.
- Theme preference persistence uses the existing `app_settings` table; no new data schema is required.
- Spring animation support is introduced as a new dependency; its impact on the Electron build size is acceptable to the team.
