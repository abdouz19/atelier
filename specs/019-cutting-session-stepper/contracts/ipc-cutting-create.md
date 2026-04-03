# IPC Contract: `cutting:create` (updated)

## Channel
`cutting:create`

## Direction
Renderer → Main process

## Request Payload (`CreateCuttingSessionPayload`)

```typescript
{
  // ── Step 1: Fabric ──────────────────────────────────────────────────────
  fabricItemId:              string          // FK → stock_items.id (fabric type)
  fabricColor:               string          // color string
  modelName:                 string          // model name
  metersUsed:                number          // sum of all fabricBatchConsumptions quantities
  fabricBatchConsumptions:   FabricBatchEntry[]  // per-batch fabric consumption
  fabricCost:                number          // sum(batch.quantity × batch.pricePerUnit)

  // ── Step 2: Employees (CHANGED from flat employeeIds+layers+pricePerLayer) ─
  employeeEntries: Array<{
    employeeId:    string   // FK → employees.id
    layers:        number   // integer > 0
    pricePerLayer: number   // decimal > 0
  }>
  employeeCost: number      // sum of (entry.layers × entry.pricePerLayer) for all entries

  // ── Step 3: Parts & Materials ────────────────────────────────────────────
  parts: Array<{
    partName:   string    // part name
    sizeLabel:  string    // size label
    count:      number    // integer ≥ 1
  }>
  consumptionRows: Array<{   // legacy — derived from materialBatchConsumptions
    stockItemId: string
    color:       string | null
    quantity:    number
  }>
  materialBatchConsumptions: Array<{
    stockItemId: string
    color:       string | null
    batches: Array<{
      transactionId:     string
      quantity:          number
      pricePerUnit:      number
      availableQuantity: number
    }>
  }>
  consumedMaterialsCost: number   // sum of all material batch costs

  // ── Step 4: Distribution & Notes ─────────────────────────────────────────
  partCosts: Array<{
    partName:  string
    sizeLabel: string
    unitCost:  number
  }>
  sessionDate: number    // unix timestamp (ms)
  notes?:      string    // optional

  // ── Totals ────────────────────────────────────────────────────────────────
  totalSessionCost: number   // fabricCost + employeeCost + consumedMaterialsCost
}
```

## Response

**Success:**
```typescript
{
  success: true,
  data: CuttingSessionSummary   // existing type, unchanged
}
```

**Failure:**
```typescript
{
  success: false,
  error: string   // Arabic user-facing error message
}
```

## Backend Changes Required

1. Destructure `employeeEntries` instead of `employeeIds`, `layers`, `pricePerLayer`.
2. Derive `employeeIds = employeeEntries.map(e => e.employeeId)` for validation loop.
3. Compute `employeeCost` from payload (already pre-computed, trust it; no re-computation needed).
4. Insert `cutting_sessions` with `layers = 0, price_per_layer = 0` (legacy fields, authoritative cost is in `employee_cost`).
5. Loop over `employeeEntries` (not `employeeIds`) for `employee_operations` INSERT, using each entry's own `layers` and `pricePerLayer`.
6. Return `totalCost: totalSessionCost ?? employeeCost` (since `layers * pricePerLayer` no longer meaningful).

## Removed Fields (from previous version)

- `employeeIds: string[]` → replaced by `employeeEntries[].employeeId`
- `layers: number` → replaced by `employeeEntries[].layers`
- `pricePerLayer: number` → replaced by `employeeEntries[].pricePerLayer`
