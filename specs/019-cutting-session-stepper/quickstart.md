# Quickstart: Cutting Session Stepper Redesign & Cost Logic Fix

## What this feature does

Redesigns the cutting session creation wizard from 2 steps to 4 steps, and introduces per-employee independent cost tracking. Each employee gets their own layers × price per layer inputs. The cost distribution logic in Step 4 is unchanged in algorithm but moved to its own step.

## Steps to verify locally

1. Start the app: `npm run dev:electron`
2. Navigate to the Cutting Sessions page
3. Click "جلسة قص جديدة"
4. Verify the step indicator shows 4 steps: القماش والموديل / الموظفون والطبقات / الأجزاء والمواد / التوزيع والملاحظات
5. Step 1: Select fabric → color → enter batch quantities → select model → Next should activate
6. Step 2: Check 2 employees → enter different layers+price for each → verify totals are independent → verify footer shows sum
7. Step 3: Add 2 part rows → expand consumed materials → add a material with batches → verify cost summary card at bottom shows all 4 cost lines updating live
8. Step 4: Verify all rows start as "تلقائي" with equal distribution → edit one row → verify it becomes "محدد" and others recalculate → check grand total line turns green when matching → submit

## Key file locations

```
frontend/components/cutting/
  NewCuttingSessionModal.tsx   # Stepper orchestrator (4 steps)
  CuttingStep1Form.tsx         # Fabric + color + batch table + model
  CuttingStep2Form.tsx         # Employee checkboxes + per-employee rows
  CuttingStep3Form.tsx         # Parts editor + consumed materials + pinned cost card
  CuttingStep4Form.tsx         # Cost distribution table + notes + date + submit

frontend/features/cutting/
  cutting.types.ts             # EmployeeEntry type + updated CreateCuttingSessionPayload

electron/main.js               # cutting:create handler (multi-employee employeeEntries)
```

## Critical invariants

- `totalSessionCost = fabricCost + employeeCost + consumedMaterialsCost` — computed in modal, never re-derived from parts
- Cost distribution must equal `totalSessionCost` for submit to be allowed when all rows are locked
- Each `EmployeeEntry` generates exactly one `employee_operations` row with its own `quantity=layers`, `price_per_unit=pricePerLayer`
- `cutting_sessions.layers` and `cutting_sessions.price_per_layer` are stored as `0` for new sessions; authoritative employee cost is in `employee_cost` column
