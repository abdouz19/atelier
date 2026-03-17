# Quickstart: Stock & Suppliers Enhancements

End-to-end verification steps. Run in sequence in the running Electron app after implementation.

---

## US1: Settings — Manage Lookup Lists

### Step 1 — First Launch Seeding
- Launch the app (or start with a fresh DB)
- Navigate to **Settings**
- Verify three new sections exist: **أنواع الأصناف**, **الألوان**, **الوحدات**
- In **الألوان** section: exactly 8 entries shown (أبيض، أسود، أحمر، أزرق، أخضر، أصفر، رمادي، بيج), each marked with a predefined badge/icon
- In **أنواع الأصناف**: entry "قماش" shown with predefined badge
- In **الوحدات**: entry "متر" shown with predefined badge
- **Expected**: All predefined entries have edit and delete buttons disabled/hidden

### Step 2 — Predefined Entries Cannot Be Modified
- Click edit on "قماش" in أنواع الأصناف
- **Expected**: Edit action is disabled or no edit button visible
- Click delete on "متر" in الوحدات
- **Expected**: Delete action is disabled or no delete button visible
- Click edit on "أبيض" in الألوان
- **Expected**: Edit action is disabled

### Step 3 — Add New Entries from Settings
- In **أنواع الأصناف**, click "إضافة نوع", enter "صوف", click Save
- **Expected**: "صوف" appears in the list (user-created, with edit + delete enabled)
- In **الوحدات**, click "إضافة وحدة", enter "كيلو", click Save
- **Expected**: "كيلو" appears in the list
- In **الألوان**, click "إضافة لون", enter "بنفسجي", click Save
- **Expected**: "بنفسجي" appears in the list

### Step 4 — Duplicate Prevention in Settings
- In **أنواع الأصناف**, click "إضافة نوع", enter "قماش" (same as predefined), click Save
- **Expected**: Error message shown, no duplicate created
- Enter "صوف" (same as previously added), click Save
- **Expected**: Error message shown, no duplicate created

### Step 5 — Edit a User-Created Entry
- Click edit on "صوف", change to "حرير", click Save
- **Expected**: Entry now shows "حرير" in the list

### Step 6 — Soft-Delete a User-Created Entry
- Click delete on "حرير", confirm the dialog
- **Expected**: "حرير" disappears from the Settings list

### Step 7 — Soft-Deleted Entry Not in Dropdown
- Navigate to **المخزون** → Add new item
- Open the **النوع** dropdown
- **Expected**: "حرير" does NOT appear; "قماش" and "صوف"... wait "حرير" was "صوف" renamed, so "صوف" should not appear either since it was renamed then deleted
- **Expected**: only active entries visible (قماش + كيلو is a unit, not type)

---

## US2: Inline Add from Dropdowns

### Step 8 — Inline Add Type from Stock Item Modal
- Navigate to **المخزون** → click "إضافة صنف"
- Click on the **النوع** dropdown
- **Expected**: dropdown list shows active types with "إضافة نوع" at the bottom
- Click "إضافة نوع", enter "جلد", click Save
- **Expected**: dropdown closes, "جلد" is pre-selected in النوع field, no modal closed

### Step 9 — Inline Add Persists to Settings
- Navigate to **الإعدادات** → أنواع الأصناف
- **Expected**: "جلد" appears in the list as a user-created entry

### Step 10 — Inline Add Color (App-Wide)
- Open Add Stock Item modal → click **اللون** dropdown → click "إضافة لون"
- Enter "زيتي", click Save
- **Expected**: "زيتي" selected in اللون field
- Close modal (cancel)
- Navigate to **القص** → create new cutting session → select a fabric → click **لون القماش** dropdown
- **Expected**: "زيتي" is present in the color list (with "إضافة لون" option available there too)

### Step 11 — Inline Add Duplicate Prevention
- Open Add Stock Item modal → النوع dropdown → click "إضافة نوع"
- Enter "قماش" (predefined name)
- **Expected**: error shown immediately, no entry created
- Enter "جلد" (existing user-created)
- **Expected**: error shown, no entry created

### Step 12 — Inline Add Cancel
- Open Add Stock Item modal → النوع dropdown → click "إضافة نوع"
- Type something, then click "إلغاء"
- **Expected**: no entry created, dropdown returns to unselected state, form is still open

---

## US3: Stock Item Form — Managed Dropdowns

### Step 13 — Type Dropdown in Add Modal
- Open Add Stock Item modal
- **Expected**: النوع is a dropdown (not a free-text input), showing active types
- **Expected**: الوحدة is a dropdown, showing active units (متر + كيلو)
- **Expected**: اللون is a dropdown, showing active colors

### Step 14 — Create Stock Item with Managed Values
- Fill: name="قماش حرير أحمر", type=قماش (from dropdown), unit=متر, color=أحمر (from dropdown), initialQuantity=100, supplier=(select one), pricePerUnit=50, totalPricePaid=5000, date=today
- Click "حفظ"
- **Expected**: Item created successfully, toast shown

### Step 15 — Edit Existing Item (Migration Scenario)
- Find an existing stock item that was created before this feature (has a free-text type)
- Click edit
- **Expected**: النوع dropdown pre-selects the existing type value (seeded from migration)
- **Expected**: الوحدة dropdown pre-selects the existing unit value
- **Expected**: اللون dropdown pre-selects the existing color value (if set)

### Step 16 — Soft-Deleted Entry Not in Add Dropdown
- In Settings, soft-delete "كيلو" (user-created unit)
- Open Add Stock Item modal
- **Expected**: "كيلو" does NOT appear in الوحدة dropdown
- **Expected**: existing items that had unit="كيلو" still show "كيلو" in their detail view (read-only display preserved)

---

## US4: Inbound Transactions — Required Supplier, Price & Total

### Step 17 — Required Field Validation
- Open any stock item → click "إضافة وارد"
- Try submitting without selecting a supplier
- **Expected**: validation error "المورد مطلوب" (or similar), form not submitted

### Step 18 — Price and Total Required
- Select a supplier but leave pricePerUnit blank, submit
- **Expected**: validation error on pricePerUnit
- Fill pricePerUnit=10, clear totalPricePaid, submit
- **Expected**: totalPricePaid is auto-calculated (quantity × 10), form submits successfully

### Step 19 — Auto-Calculation
- Enter quantity=50, pricePerUnit=20
- **Expected**: totalPricePaid auto-fills as 1000
- Change pricePerUnit=25
- **Expected**: totalPricePaid auto-updates to 1250 (if not manually edited)
- Manually change totalPricePaid to 1100
- Change quantity to 60
- **Expected**: totalPricePaid stays at 1100 (manual edit is preserved, no auto-recalculation)

### Step 20 — Inline Add Supplier
- Open Add Inbound Transaction modal
- Click supplier dropdown → click "إضافة مورد"
- **Expected**: a nested modal opens with all supplier fields (name, phone, address, etc.)
- Fill supplier name="مورد القماش المتحدة", click Save
- **Expected**: nested modal closes, "مورد القماش المتحدة" is selected in supplier dropdown
- Verify the new supplier appears in **الموردون** list

### Step 21 — Submit Full Inbound Transaction
- Complete: quantity=100, color=أحمر (from dropdown), pricePerUnit=30, totalPricePaid=3000 (auto), supplier=selected, date=today
- Submit
- **Expected**: transaction saved, stock item detail shows new transaction with supplier name and prices

---

## Cross-Feature Verification

### Step 22 — Color App-Wide After Inline Add
- From Settings → الألوان, add new color "قرميدي"
- Open Add Stock Item modal → اللون dropdown
- **Expected**: "قرميدي" appears
- Open a Cutting Session (القص → new cutting session) → لون القماش dropdown
- **Expected**: "قرميدي" appears (with "إضافة لون" at bottom)
- Open Distribution modal → اللون field
- **Expected**: "قرميدي" appears

### Step 23 — Settings Shows Migration-Seeded Values
- Open Settings → أنواع الأصناف
- **Expected**: All distinct types from existing stock items (before this feature) are present as user-created entries
- Open Settings → الألوان
- **Expected**: All distinct colors from stock_items, cutting_sessions, and distribution_batches present
- Open Settings → الوحدات
- **Expected**: All distinct units from existing stock items present

### Step 24 — Restart Persistence
- Close and relaunch the app
- **Expected**: All user-created lookup entries persist (not duplicated)
- **Expected**: Predefined entries remain present and protected
