# Data Model: Cutting Session Stepper Redesign & Cost Logic Fix

## Schema Changes

### `cutting_sessions` — no DDL change needed

The `layers` and `price_per_layer` columns are kept as-is (NOT NULL). For multi-employee sessions they will be stored as `0` (the new default value meaning "see employee_operations for per-employee data"). No migration required.

| Column | Type | Change |
|--------|------|--------|
| `layers` | INTEGER NOT NULL | No DDL change. Stores `0` for new multi-employee sessions. |
| `price_per_layer` | REAL NOT NULL | No DDL change. Stores `0` for new multi-employee sessions. |
| `employee_cost` | REAL | No change. Stores sum of all employees' (layers × pricePerLayer). |
| `fabric_cost` | REAL | No change. |
| `consumed_materials_cost` | REAL | No change. |
| `total_session_cost` | REAL | No change. |

All other tables remain unchanged.

---

## Entities & Type Definitions

### New: `EmployeeEntry` (frontend only — Step 2 payload)

Represents one employee's contribution to a cutting session.

```
EmployeeEntry {
  employeeId:    string   // FK → employees.id
  layers:        number   // number of layers this employee cuts (> 0)
  pricePerLayer: number   // price per layer for this employee (> 0)
  // Derived client-side:
  total:         number   // layers × pricePerLayer (read-only display)
}
```

### Updated: `CreateCuttingSessionPayload`

Remove: `employeeIds: string[]`, `layers: number`, `pricePerLayer: number`
Add: `employeeEntries: EmployeeEntry[]`

Full updated shape:

```
CreateCuttingSessionPayload {
  // Step 1
  fabricItemId:              string
  fabricColor:               string
  modelName:                 string
  metersUsed:                number
  fabricBatchConsumptions:   FabricBatchEntry[]
  fabricCost:                number

  // Step 2 (NEW)
  employeeEntries:           EmployeeEntry[]
  employeeCost:              number   // pre-computed sum

  // Step 3
  parts:                     PartRow[]
  consumptionRows:           ConsumptionRow[]   // legacy — derived from materialBatchConsumptions
  materialBatchConsumptions: MaterialBatchConsumption[]
  consumedMaterialsCost:     number

  // Step 4
  partCosts:                 PartCost[]
  sessionDate:               number   // unix timestamp
  notes?:                    string

  // Totals
  totalSessionCost:          number
}
```

### New Step value types (frontend)

```
Step1Values {
  fabricItemId:      string
  fabricColor:       string
  modelName:         string
  availableMeters:   number
  metersUsed:        number
  fabricBatchEntries: FabricBatchEntry[]
  fabricCost:        number
}

Step2Values {
  employeeEntries:   EmployeeEntry[]
  employeeCost:      number
}

Step3Values {
  parts:                     PartRow[]
  materialBatchConsumptions: MaterialBatchConsumption[]
  consumedMaterialsCost:     number
}

Step4Values {
  partCosts:    PartCost[]
  sessionDate:  string   // ISO date string, converted to timestamp before submission
  notes?:       string
}
```

---

## Data Flow Through the Stepper

```
Step 1 → modal.step1Data (Step1Values)
Step 2 → modal.step2Data (Step2Values)
Step 3 → modal.step3Data (Step3Values)
         modal.totalSessionCost = step1.fabricCost + step2.employeeCost + step3.consumedMaterialsCost
Step 4 → modal.step4Data (Step4Values)
         Submit: merge all step data into CreateCuttingSessionPayload
```

---

## Existing Tables (reference — no changes)

### `cutting_sessions`
Stores one row per session. `employee_cost` = sum of all employee (layers × price_per_layer) from employeeEntries.

### `employee_operations`
Stores one row per employee per session. For each entry in `employeeEntries`:
- `employee_id` = employeeEntry.employeeId
- `operation_type` = 'cutting'
- `quantity` = employeeEntry.layers
- `price_per_unit` = employeeEntry.pricePerLayer
- `total_amount` = employeeEntry.layers × employeeEntry.pricePerLayer
- `source_module` = 'cutting'
- `source_reference_id` = sessionId

### `cutting_session_parts`
One row per PartRow. `unit_cost` comes from partCosts (cost distribution table).

### `cutting_batch_consumptions`
One row per batch entry consumed. `is_fabric = 1` for fabric batches, `is_fabric = 0` for material batches.

### `cutting_consumption_entries`
One row per consumed material item (aggregate across batches). Derived from `consumptionRows`.

### `stock_transactions`
One `consumed` row per fabric deduction (total meters). One `consumed` row per non-fabric material item.
