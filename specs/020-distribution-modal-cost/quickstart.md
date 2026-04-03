# Quickstart: Distribution Modal Redesign & Cost Calculation

**Feature**: 020-distribution-modal-cost
**Date**: 2026-04-03

Manual end-to-end verification steps. No automated test framework. Run with `npm run dev:electron`.

---

## Prerequisites

Before testing, ensure the database has:
- At least 1 active tailor
- At least 1 cutting session with `not_distributed` pieces (model, size, color, part_name all set, unit_cost set on cutting_session_parts)
- At least 1 non-fabric stock item with available batches (for materials section)

---

## Scenario 1 — Full Distribution with All Cost Components (P1)

**Goal**: Verify the complete 2-step flow creates a correct distribution record with all 6 cost fields.

**Steps**:

1. Open the distribution modal (from the distribution page, click توزيع جديد or similar trigger).
2. **Step 1 — Tailor**: Select an active tailor from the searchable dropdown.
3. **Step 1 — Model**: Select a model from the dropdown (should only show models with not_distributed pieces).
4. **Step 1 — Size**: Select a size (should only show sizes that have not_distributed pieces for the selected model).
5. **Step 1 — Color**: Select a color (should only show colors that have not_distributed pieces for the selected model+size).
6. **Step 1 — Sewing inputs**: Enter `القطع المتوقعة النهائية = 10` and `سعر الخياطة للقطعة = 50`. Verify the sewing cost line shows `10 × 50 = 500.00 دج`.
7. **Step 1 — Parts**: The parts section should already have one empty row. Select a part from the dropdown. Verify:
   - Available count shows next to the part name in muted text.
   - Average unit cost is shown read-only (e.g., `تكلفة الوحدة: 25.00 دج`).
   - Enter quantity `3`. Verify row total shows `3 × 25.00 = 75.00 دج`.
8. **Step 1 — Add second part**: Click إضافة جزء. Select a different part. Enter quantity. Verify total pieces cost line = sum of both rows.
9. **Step 1 — Date**: Verify date defaults to today. Leave as-is.
10. **Step 1 — Consumed materials**: Click the toggle to expand. Add one material item. Select its color. Enter quantity in one batch. Verify total materials cost updates live.
11. **Step 1 — Cost card**: Verify the pinned cost summary card shows all 4 lines updating live:
    - `تكلفة الأجزاء المعطاة` = sum of part row totals
    - `تكلفة الخياطة` = expectedQty × sewingPrice
    - `تكلفة المواد المستهلكة` = materials cost
    - `التكلفة الإجمالية للتوزيع` (amber bold) = sum of above three
    - `تكلفة القطعة النهائية الواحدة` = total ÷ expectedQty
12. **Step 1 — Next**: Click التالي. Verify it advances to Step 2 only when all required fields are filled.
13. **Step 2 — Review**: Verify:
    - Info grid shows: tailor name, model, size, color, date
    - Parts table shows all rows with quantity, avg unit cost, row total
    - Expected final items and sewing price shown
    - Collapsed consumed materials section (expandable to review)
    - Cost summary card (frozen — not in amber, shows final values)
14. **Step 2 — Back**: Click السابق. Verify returning to Step 1 preserves all entered values exactly.
15. **Step 2 — Submit**: Re-advance to Step 2. Click توزيع. Verify:
    - Button shows loading state while submitting.
    - Modal closes on success.
    - Distribution record appears in tailor's history.

**Verification after submit**:
- Check distribution record in DB: `SELECT pieces_cost, sewing_cost, materials_cost, total_cost, cost_per_final_item, expected_pieces_count FROM distribution_batches ORDER BY created_at DESC LIMIT 1;`
- Verify `pieces_cost + sewing_cost + materials_cost = total_cost` (to 2 decimal places).
- Verify `cost_per_final_item = total_cost / expected_pieces_count`.
- Check `cutting_pieces` status: `SELECT COUNT(*) FROM cutting_pieces WHERE status='distributed';` — should have increased by the total pieces distributed.
- Check `distribution_piece_links`: should have one row per piece.
- Check `distribution_batch_parts.avg_unit_cost` is populated.

---

## Scenario 2 — Average Unit Cost Display (P1)

**Goal**: Verify the average unit cost correctly reflects the mean across not_distributed pieces from multiple cutting sessions.

**Setup**: Ensure the selected model+size+color+part has pieces from at least 2 cutting sessions with different `unit_cost` values on `cutting_session_parts`.

**Steps**:

1. Open the distribution modal, select model+size+color.
2. Add a part row for the multi-session part.
3. Verify the displayed average unit cost equals the mathematical mean of all not_distributed pieces' session unit costs.
4. Enter quantity. Verify row total = quantity × displayed avg unit cost.

---

## Scenario 3 — Cascading Selector Validation (P1)

**Goal**: Verify selectors only show valid combinations.

**Steps**:

1. Open the modal. Verify the size selector is disabled until a model is selected.
2. Select a model. Verify size selector becomes enabled and shows only sizes with not_distributed pieces for that model.
3. Select a size. Verify color selector becomes enabled and shows only colors with not_distributed pieces for that model+size.
4. Select a color. Verify the parts section only offers parts with not_distributed pieces for that model+size+color.
5. Change the model selection. Verify size and color reset (and are re-filtered for the new model).

---

## Scenario 4 — Quantity Validation (P1)

**Goal**: Verify quantity input rejects values exceeding available count.

**Steps**:

1. In a part row, note the available count shown in muted text next to the part name.
2. Enter a quantity equal to `availableCount + 1`.
3. Verify the input immediately shows a validation error.
4. Verify the Next button remains disabled.
5. Enter quantity = `availableCount` exactly. Verify the error clears and Next can activate.

---

## Scenario 5 — Zero Sewing Price (P2 Edge Case)

**Goal**: Verify a 0 sewing price is accepted without blocking submission.

**Steps**:

1. Fill all required fields.
2. Enter `سعر الخياطة للقطعة = 0`.
3. Verify sewing cost line shows `0.00 دج`.
4. Verify cost card shows `تكلفة الخياطة = 0.00 دج`.
5. Complete the flow. Verify distribution is created without error and `sewing_cost = 0` in DB.

---

## Scenario 6 — No Consumed Materials (P2)

**Goal**: Verify consumed materials section is omitted from Step 2 summary when empty.

**Steps**:

1. Fill all required fields but leave the consumed materials section empty.
2. Advance to Step 2.
3. Verify no consumed materials section appears in the review.
4. Submit. Verify `materials_cost = 0` and `total_cost = pieces_cost + sewing_cost`.

---

## Scenario 7 — Step 2 Data Fidelity (P2)

**Goal**: Verify every field from Step 1 is accurately reflected in Step 2.

**Steps**:

1. Fill Step 1 completely with specific values (e.g., 2 parts, 1 material, specific date).
2. Advance to Step 2 and verify each value matches exactly.
3. Click السابق, change one field (e.g., quantity on a part row), advance again.
4. Verify the changed value is reflected in Step 2 summary.
