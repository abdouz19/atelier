# Quickstart: Suppliers & Purchase Tracking

End-to-end walkthrough to validate a complete implementation.

## Prerequisites

- App running in dev mode (`npm run dev:electron`)
- Stock management (002) already working — at least one stock item exists

---

## Step 1 — Add suppliers

1. Open the app. Verify "الموردون" appears in the sidebar.
2. Click "الموردون". Verify the suppliers table is empty with an empty state message.
3. Click "إضافة مورد". Fill: name="قماش للجميع", phone="0501112233", address="الرياض", products="أقمشة", notes="".
4. Submit. Verify the new supplier appears in the table.
5. Add a second supplier: name="بيت الخيوط", phone="0559998877".
6. Verify both suppliers appear in the table.

## Step 2 — Edit a supplier

1. Click the edit button on "قماش للجميع".
2. Change phone to "0501119999". Save.
3. Verify the updated phone appears in the table.

## Step 3 — Create a stock item with a supplier

1. Navigate to المخزون → click "إضافة صنف".
2. Fill: name="قماش أزرق", type="قماش", unit="متر", quantity=100.
3. In the supplier dropdown, select "قماش للجميع".
4. Verify price per unit and total price fields appear.
5. Enter price per unit=10. Verify total auto-fills as 1000.
6. Change total to 950 manually. Submit.
7. Verify "قماش أزرق" appears in the stock list with quantity 100.
8. Open "قماش أزرق" detail. In the transactions section, verify the initial inbound shows: supplier="قماش للجميع", price/unit=10, total=950.

## Step 4 — Add inbound stock with supplier and price

1. From the stock list, click the + button on "قماش أزرق".
2. In the add-inbound modal: quantity=50, supplier="قماش للجميع", price/unit=12.
3. Verify total auto-fills as 600. Leave it at 600. Submit.
4. Open "قماش أزرق" detail. Verify total quantity is now 150.
5. Verify two inbound rows: one showing 950 total, one showing 600 total, both linked to "قماش للجميع".

## Step 5 — Add inbound without supplier

1. Click + on "قماش أزرق" again.
2. Leave supplier empty. quantity=20. Leave price fields blank. Submit.
3. Verify the third inbound row shows no supplier, no price.
4. Verify total quantity is now 170.

## Step 6 — View supplier purchase history

1. Navigate to الموردون. Click on "قماش للجميع".
2. Verify the detail view shows: name, phone "0501119999", address "الرياض".
3. Verify purchase history shows exactly 2 rows (the 1000/950 and 600 transactions).
4. Verify total spent = 1550 SAR (950 + 600).
5. Each row must show: item name "قماش أزرق", quantity, unit "متر", price/unit, total paid, date.

## Step 7 — Edit an inbound transaction (add supplier + price retroactively)

1. Open "قماش أزرق" detail. Find the inbound row with no supplier (step 5).
2. Click the edit button.
3. Select supplier "بيت الخيوط", enter price/unit=11, total=220. Save.
4. Verify the transaction now shows supplier "بيت الخيوط", price 11, total 220.
5. Navigate to الموردون → "بيت الخيوط". Verify this transaction appears in their history. Total spent = 220.

## Step 8 — Soft delete a supplier

1. In the suppliers table, delete "قماش للجميع".
2. Verify "قماش للجميع" disappears from the suppliers table.
3. Open the add-inbound modal for any stock item. Verify "قماش للجميع" does not appear in the supplier dropdown.
4. Open "قماش أزرق" detail. Verify the two existing inbound transactions still show "قماش للجميع" as the supplier name (historical snapshot preserved).

## Step 9 — Validation edge cases

1. Try to add a supplier without a name. Verify an error appears and no row is saved.
2. Open add-inbound modal. Select "بيت الخيوط" as supplier. Leave price per unit blank. Try to submit. Verify a validation error prevents submission.
3. Deselect the supplier (back to empty). Verify price fields become optional / clear. Submit with no price. Verify it saves.
