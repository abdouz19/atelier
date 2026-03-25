# Quickstart / Smoke Test: Cutting Parts Size/Color

## Prerequisites
- App running (`npm run dev:electron`)
- At least one fabric stock item with color stock available
- Settings: models, parts, sizes all have at least 2 entries each
- At least one active employee
- At least one active tailor

---

## Scenario 1: Create Cutting Session with Size and Color

1. Navigate to **Cutting** page
2. Click **جلسة قص جديدة** — modal opens at Step 1
3. **Fabric**: Select a fabric item (e.g., "قماش صوف")
4. **Color**: Select a color from the dropdown — this is the fabric color
5. **Model**: Open dropdown → should list only models from Settings → select "كلاسيك"
6. **Size**: Open dropdown → should list only sizes from Settings → select "L"
7. Fill in: Meters used, Employees, Layers, Price per layer, Date
8. Click **التالي** → Step 2
9. **Parts section**: Click "إضافة جزء"
   - Part name dropdown should list parts from Settings → select "ظهر"
   - Count: enter 50
   - Add another row: "ذراع يمين", count 50
   - Add another row: "ذراع يسار", count 50
10. Click **إنشاء الجلسة**

**Expected**: Session created. Parts inventory panel shows:
- "كلاسيك / L / [fabric color] / ظهر: 50"
- "كلاسيك / L / [fabric color] / ذراع يمين: 50"
- "كلاسيك / L / [fabric color] / ذراع يسار: 50"

---

## Scenario 2: Verify Part Accumulation

1. Create a **second** cutting session with the exact same model ("كلاسيك"), size ("L"), fabric color, and parts (ظهر: 30, ذراع يمين: 20)
2. View Parts Inventory panel

**Expected**:
- "كلاسيك / L / [color] / ظهر: **80**" (50 + 30)
- "كلاسيك / L / [color] / ذراع يمين: **70**" (50 + 20)
- "كلاسيك / L / [color] / ذراع يسار: **50**" (unchanged)
- NOT two separate rows for ظهر

---

## Scenario 3: Parts Inventory Filters

1. Create sessions for a second model "كاجوال" size "M" with a different color
2. In the parts inventory panel:
   - Filter by Model "كلاسيك" → only كلاسيك rows visible
   - Clear model filter; filter by Size "M" → only M rows visible
   - Apply both Model "كلاسيك" and Size "L" → only كلاسيك/L rows

---

## Scenario 4: Distribute with Size and Color

1. Navigate to **Distribution** page
2. Click **توزيع** — modal opens
3. Select a tailor
4. Select Model "كلاسيك"
5. Select Size "L" (only sizes with available inventory should appear)
6. Select Color (only colors with inventory for كلاسيك/L should appear)
7. Available parts appear: ظهر (80 available), ذراع يمين (70), ذراع يسار (50)
8. Enter Expected pieces: 40
9. Enter Price per piece: 200
10. Add part rows: ظهر: 40, ذراع يمين: 40, ذراع يسار: 40
11. Set date, click **توزيع**

**Expected**:
- Distribution saved with size "L" and color visible
- Parts inventory now shows:
  - ظهر: 80 − 40 = **40**
  - ذراع يمين: 70 − 40 = **30**
  - ذراع يسار: 50 − 40 = **10**

---

## Scenario 5: Return and Verify Inventory Restored

1. In Distribution, click **ارتجاع**
2. Select tailor → batch for "كلاسيك / L / [color]" should show size and color
3. Return 20 pieces
4. Check parts inventory: available counts increase proportionally

---

## Scenario 6: Final Stock Filters (Verify Existing)

1. After QC and Finition add entries to final stock
2. Navigate to **المخزون النهائي**
3. Filter by Size "L" → only size L entries shown
4. Filter by Color → only that color shown
5. Apply both → intersection shown

---

## Scenario 7: Legacy Session Still Visible

1. Navigate to **Cutting** → session list
2. Any sessions created before this feature (size = blank) should still be visible
3. Clicking them should show the session detail with parts (from cutting_session_parts log)
4. They do NOT appear in the parts inventory (since they have no model_name in aggregate)
