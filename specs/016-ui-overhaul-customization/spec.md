# Feature Specification: UI/UX Enhancement & Platform Customization

**Feature Branch**: `016-ui-overhaul-customization`
**Created**: 2026-03-27
**Status**: Draft
**Input**: User description: "Global UI overhaul with modern dashboard aesthetic and a dedicated platform customization section in settings"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Modern Dashboard Experience (Priority: P1)

An atelier manager opens the app and is greeted by a visually consistent, professional interface. Every screen uses a card-based layout with clear visual hierarchy: large bold screen titles, grouped section labels, regular-weight table content, and muted helper text. KPI cards on the dashboard show bold metric values, trend arrows with percentage vs the previous period, and a relevant icon. Colors are applied semantically — green for positive indicators, red for low stock or danger, amber for pending or warnings, blue for neutral informational actions.

**Why this priority**: This is the most visible and impactful change across the entire application. It sets the baseline visual language that all other stories build upon. Without this foundation, customization and individual UI improvements have no coherent context.

**Independent Test**: Can be validated by opening the app and verifying that all pages use the card layout, the KPI dashboard displays trend indicators, and semantic color usage is consistent — without requiring any customization settings to be active.

**Acceptance Scenarios**:

1. **Given** the app is open on any screen, **When** the user views the layout, **Then** every section, table, and KPI metric is wrapped in a rounded card with a white/surface background and a soft shadow
2. **Given** the user views the dashboard, **When** KPI metrics are displayed, **Then** each card shows a large bold value, a muted label beneath it, a trend arrow (up or down) with percentage compared to the previous period, and a relevant icon
3. **Given** any screen with data, **When** a positive value is displayed (e.g., stock increase), **Then** it appears in green; negative/danger values (e.g., low stock) appear in red; pending/warning values appear in amber; neutral informational values appear in blue
4. **Given** the user views any screen title, **When** compared to section labels and table content, **Then** titles are visually largest and boldest, section labels are medium weight, table rows are regular weight, and helper text is smaller and muted

---

### User Story 2 — Platform Customization & Branding (Priority: P2)

An atelier manager navigates to the settings screen and opens the "تخصيص المنصة" (Platform Customization) section. They upload their atelier's logo, select a primary brand color from the predefined swatches, and choose between light mode, dark mode, or system default theme. A live preview area shows a sidebar mockup, a KPI card, and a button reflecting their current selections before they save. When they save, the changes apply across the entire application immediately and persist across app restarts.

**Why this priority**: Branding and customization directly impact the professionalism and sense of ownership the manager feels toward the platform. This is a high-value feature for adoption and retention, and it builds on the visual system established in P1.

**Independent Test**: Can be tested in isolation by navigating to Settings → تخصيص المنصة, making changes, verifying the live preview updates, saving, and confirming changes persist after restarting the app.

**Acceptance Scenarios**:

1. **Given** the user is on the settings screen, **When** they open "تخصيص المنصة", **Then** they see: a logo upload control, theme toggle (light/dark/system), primary color swatches, a live preview area, a save button, and a reset-to-defaults button
2. **Given** the customization section is open, **When** the user selects a different primary color swatch, **Then** the live preview immediately reflects the new color on the sidebar, KPI card accent, and button — without requiring a save
3. **Given** the user uploads a valid logo image, **When** the upload completes, **Then** the logo appears in the live preview sidebar and replaces the default app name text
4. **Given** the user has saved customization settings and restarts the app, **When** any screen loads, **Then** the saved logo, theme, and primary color are applied from the first render without re-configuration
5. **Given** the user clicks "Reset to Defaults" and confirms the action, **When** the reset completes, **Then** the logo is removed (default app name restored), the theme reverts to system default, and the primary color reverts to the original app default
6. **Given** the user attempts to upload an unsupported file format (e.g., a PDF or executable), **When** the upload is attempted, **Then** the system rejects it with a clear error message listing accepted formats

---

### User Story 3 — Upgraded Data Tables (Priority: P3)

A user navigates to any screen containing a data table (stock, employees, cutting sessions, etc.) and finds it easy to read and scan. Table headers remain visible when scrolling through long lists. Row backgrounds alternate for readability. Number columns are right-aligned, text columns are right-aligned (RTL), and action columns are centered. Hovering over a row subtly highlights it.

**Why this priority**: Tables are the most frequently interacted-with component across the app. Improved readability directly reduces errors and cognitive load in daily use.

**Independent Test**: Can be tested on any single existing table in the app independently of all other changes.

**Acceptance Scenarios**:

1. **Given** a table with more than 10 rows, **When** the user scrolls down, **Then** the table header row remains fixed/sticky at the top
2. **Given** any data table, **When** viewing rows, **Then** odd and even rows have visually distinct background colors (alternating pattern)
3. **Given** a table with numeric columns (quantities, prices, totals), **When** the user views those columns, **Then** values are right-aligned; text and label columns are right-aligned (RTL); action button columns are centered
4. **Given** any table row, **When** the user hovers over it, **Then** the row background changes to a subtle highlight color

---

### User Story 4 — Consistent Modals, Buttons & Forms (Priority: P4)

A user opens a modal to add or edit a record. The modal has a clear header with the action title and a close button, a scrollable content body, and a sticky footer with primary and secondary action buttons. When the user submits a form with missing required fields, error messages appear inline directly below the relevant fields in red. The backdrop blur makes it clear they are overlaying the main screen.

**Why this priority**: Modal and form consistency reduces user errors and improves confidence during data-entry tasks, which are a core daily workflow.

**Independent Test**: Can be tested on any single modal (e.g., add stock modal) by verifying header, footer, body scroll, backdrop blur, and inline validation in isolation.

**Acceptance Scenarios**:

1. **Given** any modal is open, **When** the user views it, **Then** it has a header with the action title and a visible close (×) button, a scrollable body section, a sticky footer with action buttons, and a blurred backdrop
2. **Given** an open form modal, **When** the user submits with a required field empty, **Then** an inline error message appears in red directly beneath the invalid field
3. **Given** any interactive button on any screen, **When** comparing buttons across the app, **Then** primary actions use filled styling, secondary actions use outlined styling, ghost buttons use text-only styling, and destructive actions use red filled styling
4. **Given** any form field, **When** the field is focused, **Then** a visible focus ring appears; the label is displayed above the field; helper text (if applicable) appears below in muted color

---

### User Story 5 — Empty States & Loading States (Priority: P5)

A user navigates to a screen with no data yet (e.g., a freshly added product with no cutting sessions). Instead of a blank area or an empty table, they see a clear empty state with an icon, a title, a description, and a call-to-action button guiding them to add the first item. When data is being fetched, the content area shows a skeleton loader shaped like the expected content rather than a spinner alone.

**Why this priority**: Empty and loading states significantly impact perceived quality and the first-run experience for new users.

**Independent Test**: Can be tested independently by visiting any table screen before adding data, and by simulating slow data loading to observe skeleton loaders.

**Acceptance Scenarios**:

1. **Given** a table or list with no records, **When** the user views the screen, **Then** an empty state is shown with an icon, a title, a brief description, and a call-to-action button
2. **Given** content is being fetched/loaded, **When** the data has not yet arrived, **Then** a skeleton loader matching the shape of the expected content is displayed (not a standalone spinner)
3. **Given** data finishes loading, **When** the content replaces the skeleton, **Then** the transition is smooth and the layout does not shift unexpectedly

---

### User Story 6 — Upgraded Sidebar Navigation (Priority: P6)

A user uses the sidebar to navigate between app sections. The active section is clearly indicated with a filled pill indicator. Icons are always visible. Navigation items are grouped under labeled section headers. The atelier logo (or default app name) sits at the top, and the user's avatar and role label are at the bottom.

**Why this priority**: Navigation clarity is foundational but is lower priority than the core visual overhaul (P1) and customization (P2) since the current sidebar is functional.

**Independent Test**: Can be tested in isolation by verifying sidebar active states, icon visibility, section grouping, logo placement, and avatar/role display without requiring other features.

**Acceptance Scenarios**:

1. **Given** the user is on any screen, **When** viewing the sidebar, **Then** the currently active navigation item has a filled pill indicator around it
2. **Given** the sidebar is in any state, **When** the user views it, **Then** navigation icons are always visible
3. **Given** the user views the sidebar, **When** inspecting the top area, **Then** the atelier logo (or default app name if no logo is set) is displayed; at the bottom, the user's avatar and role label are displayed
4. **Given** the sidebar navigation items, **When** viewing the full list, **Then** items are visually grouped under labeled section headers

---

### Edge Cases

- What happens when the uploaded logo image is very large (e.g., 10MB+) or has an unusual aspect ratio?
- What happens if the system theme changes (OS-level dark/light switch) while the app is running with "system default" selected?
- What happens if a skeleton loader is shown for a screen that ultimately returns an empty state — does the empty state render correctly after the skeleton disappears?
- What happens when the user resets to defaults — are they prompted to confirm to avoid accidental logo deletion?
- What happens when a primary color swatch creates low contrast in either light or dark mode for text readability?

---

## Requirements *(mandatory)*

### Functional Requirements

**Global Visual System**

- **FR-001**: All screens MUST use a card-based layout where every section, table, and KPI metric is contained within a rounded card with a surface/white background and a soft drop shadow
- **FR-002**: The application MUST enforce a consistent typography hierarchy: screen titles are large and bold, section labels are medium weight, table/body content is regular weight, and helper/muted text is smaller and visually lighter
- **FR-003**: Color MUST be used semantically and consistently across all screens: green for positive/success outcomes, red for negative/danger/low-stock conditions, amber for warning/pending states, blue for informational or neutral interactive elements
- **FR-004**: Section backgrounds MUST apply subtle gradients to create visual distinction between different content areas

**Sidebar**

- **FR-005**: The sidebar MUST display the active navigation item with a filled pill indicator
- **FR-006**: The sidebar MUST always display navigation icons regardless of sidebar state
- **FR-007**: The sidebar MUST group navigation items under labeled section headers
- **FR-008**: The sidebar MUST display the atelier logo (or default app name if no logo is uploaded) at the top
- **FR-009**: The sidebar MUST display the user's avatar and role label at the bottom

**Data Tables**

- **FR-010**: All data tables MUST display alternating row background colors
- **FR-011**: All data tables MUST have a sticky header that remains visible when scrolling through long lists
- **FR-012**: All data tables MUST align columns consistently: numeric values right-aligned, text/label values right-aligned (RTL), action columns centered
- **FR-013**: All data table rows MUST display a subtle background highlight on hover

**Modals**

- **FR-014**: All modals MUST include a header section with the action title and a visible close button
- **FR-015**: All modals MUST have a scrollable body section
- **FR-016**: All modals MUST have a sticky footer containing action buttons
- **FR-017**: All modals MUST apply a backdrop blur effect behind the modal overlay

**Buttons**

- **FR-018**: All buttons MUST conform to a four-tier system: primary (filled), secondary (outlined), ghost (text-only), danger (red filled for destructive actions)

**Forms**

- **FR-019**: All form fields MUST display a visible label above the input
- **FR-020**: All form fields MUST display a visible focus ring when the field is active
- **FR-021**: All form validation errors MUST appear as inline red messages directly below the relevant field
- **FR-022**: All form fields with helper text MUST display it below the field in a muted/lighter style

**Empty States**

- **FR-023**: All tables and lists with no records MUST display an empty state containing an icon, a title, a brief description, and a call-to-action button

**Loading States**

- **FR-024**: All content loading states MUST use a skeleton loader shaped to match the expected content layout — a standalone spinner alone is not sufficient for content areas

**KPI Cards**

- **FR-025**: All KPI cards MUST display: a large bold metric value, a muted label below the value, a trend indicator (up/down arrow with percentage vs previous period), and a relevant contextual icon; if historical data is unavailable, the trend indicator is hidden rather than shown as zero

**Platform Customization**

- **FR-026**: A "تخصيص المنصة" (Platform Customization) section MUST be accessible from the settings screen
- **FR-027**: Users MUST be able to upload an atelier logo (accepted formats: PNG, JPG, SVG; max 2MB); the logo MUST replace the default app name text in the sidebar and on the login screen; unsupported formats or oversized files MUST be rejected with a user-friendly error
- **FR-028**: Users MUST be able to select from three theme options: light mode, dark mode, and system default
- **FR-029**: Users MUST be able to select a primary color from a predefined set of six swatches: blue, indigo, emerald, rose, amber, and slate
- **FR-030**: The selected primary color MUST be applied platform-wide to buttons, active states, sidebar indicators, KPI card accents, and interactive highlights
- **FR-031**: All customization settings (logo, theme, primary color) MUST be persisted in local storage and automatically applied on every subsequent app launch
- **FR-032**: A live preview area MUST be displayed within the customization section showing a miniature sidebar, a KPI card, and a button that reflect the currently selected (unsaved) options in real time as the user changes selections
- **FR-033**: A "Reset to Defaults" action MUST require a single confirmation step before executing; when confirmed, it MUST restore the logo to none, the theme to system default, and the primary color to the original app default

### Key Entities

- **Platform Settings**: Persisted user customization preferences; attributes: logo image data (optional), selected theme (light / dark / system), selected primary color swatch identifier
- **Navigation Item**: A sidebar entry; attributes: label (Arabic), icon, destination route, section group, active state
- **KPI Card**: A dashboard metric unit; attributes: metric value, label, trend direction (up / down / neutral), trend percentage, icon identifier
- **Skeleton Loader**: A loading placeholder defined by the shape and dimensions of the content it replaces
- **Empty State**: A zero-data placeholder; attributes: icon, title, description, call-to-action label and target action

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every screen in the application uses a card-based layout — zero screens retain the previous flat/borderless layout after the upgrade
- **SC-002**: All six predefined primary color swatches apply their color consistently to buttons, active sidebar indicators, KPI accents, and interactive highlights — verifiable on any screen immediately after color selection and save
- **SC-003**: Customization settings (logo, theme, primary color) survive an app restart — 100% of saved settings are present on the next launch without re-entry
- **SC-004**: All data tables across the application display sticky headers, alternating row colors, and RTL-appropriate column alignment — zero tables retain the previous unstyled layout
- **SC-005**: All modals include a sticky footer, scrollable body, header with close button, and backdrop blur — zero modals in the application lack any of these four elements
- **SC-006**: All content loading states use skeleton loaders — zero standalone spinners remain as the sole loading indicator for content areas
- **SC-007**: All empty table and list states display an icon, title, description, and call-to-action — zero empty states show a blank area or plain "no data" text alone
- **SC-008**: The live preview in the customization section updates visibly as the user changes logo, theme, or color selections — changes are reflected within the same interaction without requiring a save
- **SC-009**: The reset-to-defaults action restores all three customization dimensions (logo, theme, color) in a single confirmed step

---

## Assumptions

- The application is primarily an RTL (Arabic) interface; right-alignment is the default text direction for all content
- The existing settings screen will serve as the host for the new "تخصيص المنصة" section — no new top-level navigation entry is required
- All six color swatches (blue, indigo, emerald, rose, amber, slate) are fixed and predefined; users cannot define arbitrary custom hex colors
- The live preview updates reactively as the user makes selections — it does not require a save action to reflect changes
- Platform customization settings are per-device (stored locally) rather than per-user-account, consistent with the app's local storage model
- Trend indicators on KPI cards compare the current period (current month) against the previous period (previous month); if historical data is unavailable, the trend indicator is hidden rather than shown as zero
- The upgraded sidebar design applies to the existing sidebar component — no structural navigation changes (adding or removing menu items) are in scope for this feature
- All existing screens and modals are within scope for the visual upgrade; no screen is exempted
