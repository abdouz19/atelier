# Feature Specification: Parts Model Correction & Inventory KPIs

**Feature Branch**: `013-parts-distribution-fix`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "Corrections to cutting and distribution — cutting produces parts (garment components like back, arm right, arm left), not sellable pieces; distribution records expected final piece count plus a parts breakdown of what was physically given; new parts inventory KPI view shows available quantity per part type so the user knows what to produce next."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View Parts Inventory KPIs (Priority: P1)

The user navigates to the Cutting section and sees a parts inventory panel grouped by model. For each model they can see each part type (e.g., "Back", "Arm Right", "Arm Left") and how many are currently available (not yet distributed). For example: "Jacket — Back: 50", "Jacket — Arm Right: 40", "Shirt — Back: 30". This immediately tells the user which parts are in stock per model and which need to be cut again, eliminating the need for manual tracking outside the system.

**Why this priority**: Pure read-only value deliverable from existing data. This is the most actionable correction — it exposes what the user actually needs to see per model, making production decisions visible at a glance.

**Independent Test**: With jacket sessions having produced 100 backs and 50 of those distributed, verify the KPI panel shows "Jacket — Back: 50 available." With shirt sessions having their own backs, verify those appear separately. With no sessions, verify an empty state.

**Acceptance Scenarios**:

1. **Given** no cutting sessions exist, **When** the user views the parts KPI panel, **Then** all part counts show zero or an empty state message.
2. **Given** jacket sessions have produced 100 backs and 50 have been distributed, **When** the user views the parts KPI panel, **Then** "Jacket — Back" shows 50 available.
3. **Given** both jacket and shirt sessions exist with a "Back" part each, **When** the user views the panel, **Then** "Jacket — Back" and "Shirt — Back" appear as separate entries with their own counts.
4. **Given** multiple part types exist across multiple sessions of the same model, **When** the user views the panel, **Then** counts are aggregated per model + part name.
5. **Given** a new cutting session is submitted, **When** the user views the KPI panel, **Then** the newly produced parts appear under their model immediately — no refresh required.
6. **Given** a distribution or return action is completed, **When** the user views the KPI panel, **Then** counts reflect the updated state immediately.

---

### User Story 2 — Cutting Session Produces Named Parts (Priority: P2)

When creating a cutting session, step 2 now captures the specific parts produced — each row is a named part (e.g., "Back", "Arm Right", "Arm Left") with a count, not a generic size label. The model name entered in step 1 gives context to all parts in that session. A session cutting 50 jackets would produce: 50 backs, 50 fronts, 90 arm rights, 40 arm lefts. The session detail view shows this parts breakdown clearly. Parts are always inventory-tracked under their model + part name combination.

**Why this priority**: The foundational data correction. Without named parts in cutting output, the inventory KPI and the corrected distribution flow are impossible to build.

**Independent Test**: Create a cutting session with 3 part rows: Back (50), Arm Right (90), Arm Left (40). Verify the session detail shows these as named parts with their counts. Verify the parts inventory panel increases by those amounts.

**Acceptance Scenarios**:

1. **Given** the cutting session modal step 2, **When** the user adds rows, **Then** each row captures a part name (free text with autocomplete from previously used part names for that model) and a count ≥ 1.
2. **Given** step 2 with a row having count of zero, **When** the user attempts to submit, **Then** a validation error blocks submission — count must be ≥ 1.
3. **Given** step 2 with no part rows, **When** the user attempts to submit, **Then** a validation error blocks submission — at least one part row is required.
4. **Given** a session submitted with part rows, **When** the user views the session detail, **Then** the breakdown shows part name → count for every row (e.g., "Back: 50", "Arm Right: 90").
5. **Given** the same part name appears across multiple sessions for the same model, **When** the user views the parts inventory, **Then** totals aggregate correctly per model + part name.

---

### User Story 3 — Distribute Pieces with Parts Breakdown (Priority: P3)

When distributing to a tailor, the user records two things: (a) the expected number of final assembled pieces (e.g., "50 jackets expected"), and (b) the physical parts breakdown given (e.g., 50 backs, 50 arm rights, 50 arm lefts). The modal shows available quantities per part type and enforces that the user cannot give more than is available. The distribution history view shows both the expected count and the full parts breakdown.

**Why this priority**: Corrects the distribution flow to reflect physical reality — a tailor receives parts to assemble, not finished garments.

**Independent Test**: With 100 backs, 100 arm rights, 100 arm lefts available — distribute 50 expected pieces to a tailor with parts: 50 backs, 50 arm rights, 50 arm lefts. Verify available counts drop by 50 each, and the distribution record shows both the expected count (50) and the parts breakdown.

**Acceptance Scenarios**:

1. **Given** the Distribute modal opens, **When** the user fills in the form, **Then** there is an "Expected Pieces" field and a parts breakdown section (one or more rows of part name + quantity).
2. **Given** the parts breakdown section, **When** the user selects a part name, **Then** the available quantity for that part is displayed, and the entered quantity is validated to not exceed it.
3. **Given** a part quantity entered exceeds available, **When** the user attempts to submit, **Then** submission is blocked with a clear error on that row.
4. **Given** the parts breakdown section has no rows, **When** the user attempts to submit, **Then** a validation error requires at least one part row.
5. **Given** all fields are valid, **When** the user submits, **Then** the expected count and parts breakdown are recorded, and the available inventory for each given part decreases immediately.
6. **Given** a submitted distribution batch, **When** the user views the distribution history, **Then** they see the expected piece count and the full parts breakdown (each part name and quantity given).

---

### User Story 4 — Return Parts Increase Inventory (Priority: P4)

When a tailor returns parts, the user records a flat return quantity against a specific distribution batch — no per-part breakdown is required. For example, if a batch originally distributed 50 backs + 50 arm rights + 50 arm lefts and the tailor returns 30 pieces, the user enters "30" against that batch. The available parts inventory is restored accordingly, and the batch shows 30 returned with 20 still in distribution.

**Why this priority**: Completes the inventory lifecycle — parts given out must be returnable to inventory to keep the available counts accurate.

**Independent Test**: After distributing a batch of 50 expected pieces to a tailor, record a partial return of 20. Verify the batch shows 20 returned and 30 remaining. Verify the available parts inventory reflects the restoration. Verify a second return of 30 closes the batch entirely.

**Acceptance Scenarios**:

1. **Given** a tailor has an active distribution batch, **When** the user opens the Return modal and selects that tailor, **Then** all their not-fully-returned batches are listed with model, parts breakdown given, expected count, and remaining quantity.
2. **Given** the user selects a batch with 50 remaining, **When** they enter a return quantity of 20 and submit, **Then** the batch shows 20 returned, 30 remaining, and available inventory is increased by the returned amount.
3. **Given** the user enters a return quantity exceeding the remaining quantity, **When** they attempt to submit, **Then** a validation error blocks submission.
4. **Given** a return is submitted, **When** the user views the parts KPI panel, **Then** counts reflect the restoration immediately — no refresh required.
5. **Given** returns bring a batch's remaining quantity to zero, **When** the user views that tailor's distribution history, **Then** the batch is shown as fully returned.

---

### Edge Cases

- What happens when a part name is entered with inconsistent capitalization (e.g., "back" vs "Back")? The autocomplete suggests previously used names to help consistency, but the system accepts whatever the user enters. Inventory aggregation is case-sensitive, so naming discipline rests with the user.
- What happens when the available count of a specific part reaches zero? It shows zero in the KPI panel and cannot be selected in the distribution parts breakdown (or shows a validation error when the user tries to enter a quantity > 0).
- What happens when a cutting session is submitted with a part name that has never been used before? The new part type appears in the inventory panel with its produced count.
- What happens when parts from different models (e.g., jacket backs vs shirt backs) share the same part name? Since inventory is scoped per model, "Jacket — Back" and "Shirt — Back" are tracked separately and never merged. The user sees distinct rows per model in the KPI panel.
- What happens to existing data that recorded cutting output as size-based rows (from the original spec 005 implementation)? Migration strategy is out of scope for this specification — this feature defines the correct going-forward behavior.

## Requirements *(mandatory)*

### Functional Requirements

**Cutting — parts model:**

- **FR-001**: The cutting session step 2 rows MUST capture named parts (e.g., "Back", "Arm Right"), not generic size labels. Each row requires a part name and a count ≥ 1.
- **FR-002**: Part names MUST support free-text entry with autocomplete suggestions drawn from part names previously used for the same model name in prior sessions.
- **FR-003**: At least one part row MUST be present before the session can be submitted.
- **FR-004**: The cutting session detail view MUST display the parts breakdown as: part name → count for every row in that session.
- **FR-005**: On session submission, the system MUST record each produced part and its count, so they are immediately counted in the available parts inventory.

**Parts inventory KPIs:**

- **FR-006**: The system MUST display a parts inventory view accessible from the Cutting section, grouped by model name. Within each model, each part name MUST show its current available count (total produced − total distributed + total returned for that model + part combination).
- **FR-007**: Parts with zero available quantity MUST be visually distinguishable (e.g., shown with a zero badge or in a distinct state) so the user can immediately identify what needs to be produced.
- **FR-008**: The parts inventory view MUST update immediately after any cutting session submission, distribution action, or return action — no manual refresh required.

**Distribution — expected count + parts breakdown:**

- **FR-009**: The Distribute modal MUST include an "Expected Pieces" field (integer ≥ 1) representing the number of final assembled garments the tailor is expected to produce from the given parts.
- **FR-010**: The Distribute modal MUST include a parts breakdown section where the user adds one or more rows. Each row requires a part name and a quantity ≥ 1. At least one row is required.
- **FR-011**: For each part row in the distribution, the system MUST display the current available quantity for that part and enforce that the entered quantity does not exceed it.
- **FR-012**: On distribution submission, the system MUST record the expected piece count, the full parts breakdown, and deduct each part's quantity from the available inventory atomically.
- **FR-013**: The distribution history view MUST display, for each batch, the expected piece count and all part rows (part name + quantity given).

**Return — inventory restoration:**

- **FR-014**: Returns are recorded as a flat quantity against a specific distribution batch (not a per-part breakdown). The user selects a batch and enters a return quantity ≤ the batch's remaining (not-yet-returned) quantity.
- **FR-015**: On return submission, the system MUST increase the available inventory for that batch's model by the returned quantity and update the batch's remaining count accordingly.
- **FR-016**: The available parts inventory counts MUST reflect returns immediately after the return action is completed — no refresh required.

### Key Entities

- **Part**: A named garment component produced by a cutting session — part name (free text), count, linked to a cutting session and its model name. The combination of model name + part name is the inventory key.
- **Parts Inventory** (derived view): Per model + part name combination — total produced across all cutting sessions of that model minus total distributed plus total returned. Not a stored table; computed from part production and distribution records.
- **Distribution Batch** (updated): Links to tailor, model name, expected piece count, date. Contains one or more Distribution Part Entries.
- **Distribution Part Entry**: A line item in a distribution batch — part name, quantity given. Deducted from available inventory on submission.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see the available quantity for every part type from the Cutting section without navigating elsewhere — inventory is visible without additional steps.
- **SC-002**: Parts inventory totals are always accurate per model + part name: available = total produced − total distributed + total returned, verifiable by cross-checking cutting and distribution records. Zero tolerance for incorrect aggregation.
- **SC-003**: Users can complete a distribution with a parts breakdown (3+ part rows) in under 3 minutes.
- **SC-004**: After any cutting session, distribution, or return action, parts inventory counts update immediately — users never need to refresh to see the current state.
- **SC-005**: 100% of part quantities in inventory are traceable to the specific cutting sessions that produced them and the specific distribution batches that consumed them.
- **SC-006**: Users can identify which part types need to be re-cut without consulting any external tool or document — the parts inventory KPI provides all necessary information on-screen.

## Assumptions

- A "part" is a named physical component of a garment (e.g., "Back", "Front", "Arm Right", "Arm Left", "Collar", "Pocket"). Part names are free text — not a predefined enum.
- Parts inventory is scoped per model — the inventory key is model name + part name. "Jacket — Back" and "Shirt — Back" are always tracked separately and never aggregated together.
- Parts do not carry size labels in this correction; sizes are not part of the nomenclature. A "Back" is a "Back" regardless of garment size. (If size-differentiated parts are needed, e.g., "Back Size 38", the user enters that as the full part name via free text.)
- The "expected piece count" in a distribution is an informational/planning field only. It does not trigger assembly validation or enforce that parts given mathematically match any bill-of-materials for a given model.
- Returns are recorded as a flat quantity against a distribution batch (not a per-part breakdown). The inventory restoration uses the batch's model to correctly attribute the returned quantity back to that model's available count.
- Autocomplete for part names is scoped to the model — when entering parts for a "Jacket" session, autocomplete draws from part names previously used in other "Jacket" sessions.
- Existing data from spec 005 (size-based cutting rows) is out of scope for migration in this feature. This spec defines correct behavior for new data going forward.
- Partial returns are allowed — a batch remains open until all distributed quantity has been returned.
- All UI is right-to-left (Arabic) consistent with existing modules.
