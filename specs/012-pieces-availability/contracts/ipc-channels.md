# IPC Channel Contracts: Distribution & Dashboard Pieces Availability Enhancement

**Feature**: 012-pieces-availability | **Date**: 2026-03-17

All responses wrapped in: `{ success: true; data: T } | { success: false; error: string }`

---

## New Channels

### `distribution:getAvailabilityForModel`

**Direction**: renderer → main
**Trigger**: User selects a model in the Distribute modal
**Purpose**: Return all (part+size+color) combinations ever produced for a model, with not-distributed counts

#### Request Payload

```typescript
{ modelName: string }
```

#### Response Data

```typescript
Array<{
  partName: string | null;
  sizeLabel: string;
  color: string;
  notDistributedCount: number;  // may be 0
}>
```

#### Behavior

- Returns ALL combinations ever produced for the model — including zero-count rows (shown disabled in the table)
- Ordered: `notDistributedCount DESC`, then `partName ASC`, `sizeLabel ASC`, `color ASC`
- Empty array if model has no cut pieces

#### SQL

```sql
SELECT
  cp.part_name,
  cp.size_label,
  cs.fabric_color AS color,
  SUM(CASE WHEN cp.status = 'not_distributed' THEN 1 ELSE 0 END) AS not_distributed_count
FROM cutting_pieces cp
JOIN cutting_sessions cs ON cs.id = cp.session_id
WHERE cs.model_name = ?
GROUP BY cp.part_name, cp.size_label, cs.fabric_color
ORDER BY not_distributed_count DESC, cp.part_name, cp.size_label, cs.fabric_color
```

---

### `pieces:getAvailability`

**Direction**: renderer → main
**Trigger**: Pieces Availability tab loads or filter changes
**Purpose**: Full availability breakdown for all (or filtered) model+part+size+color combinations

#### Request Payload

```typescript
{
  modelName?: string;   // empty/omit = all models
  partName?: string;    // empty/omit = all parts (note: null part_name rows still returned)
  sizeLabel?: string;   // empty/omit = all sizes
  color?: string;       // empty/omit = all colors
}
```

#### Response Data

```typescript
Array<{
  modelName: string;
  partName: string | null;
  sizeLabel: string;
  color: string;
  totalProduced: number;
  notDistributed: number;
  inDistribution: number;
  returned: number;
}>
```

#### Behavior

- Returns all distinct (model, part, size, color) combinations from `cutting_pieces` joined with `cutting_sessions`
- All four counts computed in a single SQL using conditional SUM on `cutting_pieces.status`
- Empty string filter values are treated as "no filter" (same `? IS NULL OR col = ?` pattern)
- Ordered by: `modelName ASC`, `partName ASC` (nulls first), `sizeLabel ASC`, `color ASC`

#### SQL

```sql
SELECT
  cs.model_name,
  cp.part_name,
  cp.size_label,
  cs.fabric_color AS color,
  COUNT(*) AS total_produced,
  SUM(CASE WHEN cp.status = 'not_distributed' THEN 1 ELSE 0 END) AS not_distributed,
  SUM(CASE WHEN cp.status = 'distributed' THEN 1 ELSE 0 END) AS in_distribution,
  SUM(CASE WHEN cp.status = 'returned' THEN 1 ELSE 0 END) AS returned
FROM cutting_pieces cp
JOIN cutting_sessions cs ON cs.id = cp.session_id
WHERE (? IS NULL OR cs.model_name = ?)
  AND (? IS NULL OR cp.size_label = ?)
  AND (? IS NULL OR cs.fabric_color = ?)
GROUP BY cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
ORDER BY cs.model_name ASC, cp.part_name ASC, cp.size_label ASC, cs.fabric_color ASC
```

Note: `partName` filter not applied in SQL (null-safe equality is complex for text filters); applied client-side for simplicity.

---

### `pieces:getLowStockThreshold`

**Direction**: renderer → main
**Trigger**: Pieces Availability tab mount; Dashboard page mount
**Purpose**: Retrieve current low-stock threshold from app_settings

#### Request Payload

None.

#### Response Data

```typescript
{ threshold: number }
```

#### Behavior

- Reads `value` from `app_settings WHERE key = 'low_stock_threshold'`
- If key does not exist, inserts default `(key='low_stock_threshold', value='5')` and returns `{ threshold: 5 }`
- Value is stored as TEXT, parsed to integer before returning

---

### `pieces:setLowStockThreshold`

**Direction**: renderer → main
**Trigger**: Manager changes the threshold input in the Pieces Availability screen
**Purpose**: Persist the new threshold value to app_settings

#### Request Payload

```typescript
{ threshold: number }   // must be integer >= 0
```

#### Response Data

```typescript
void  // success: true, data: null
```

#### Behavior

- Validates `threshold` is a non-negative integer; rejects negative values with error
- Upserts: `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('low_stock_threshold', ?, ?)`

#### Error Cases

- `threshold < 0` → `{ success: false, error: "الحد الأدنى يجب أن يكون صفراً أو أكثر" }`

---

## Modified Channels

### `distribution:distribute` — extended payload

**Change**: Accepts optional `partName` field in payload; inserts it into `distribution_batches.part_name`.

#### Updated Request Payload

```typescript
{
  tailorId: string;
  modelName: string;
  partName?: string | null;   // NEW — null for no part
  sizeLabel: string;
  color: string;
  quantity: number;
  sewingPricePerPiece: number;
  distributionDate: number;
}
```

All other behavior unchanged.

---

### `dashboard:getSnapshotData` — extended response

**Change**: Adds `zeroStockCombosCount`, `lowStockCombosCount`, and `criticalCombinations` to the snapshot response. The threshold is read internally from `app_settings` to compute `lowStockCombosCount`.

#### Updated Response Data

```typescript
{
  kpis: {
    // ... existing fields ...
    zeroStockCombosCount: number;    // NEW
    lowStockCombosCount: number;     // NEW
  };
  pipeline: PipelineStage[];         // unchanged
  activity: ActivityEntry[];         // unchanged
  criticalCombinations: Array<{      // NEW
    modelName: string;
    partName: string | null;
    sizeLabel: string;
    color: string;
    notDistributed: number;
  }>;
}
```

---

### `dashboard:getChartData` — extended response

**Change**: Adds `monthlyDistributed` series alongside existing chart data. Scoped by same date range and model filter as `monthlyProduction`.

#### Updated Response Data

```typescript
{
  monthlyProduction: MonthlyProductionPoint[];   // unchanged
  monthlyDistributed: Array<{                    // NEW
    month: string;     // 'YYYY-MM'
    distributed: number;
  }>;
  topTailors: TopTailorPoint[];      // unchanged
  topModels: TopModelPoint[];        // unchanged
  fabricConsumption: FabricConsumptionRawPoint[];  // unchanged
  employeeDebt: EmployeeDebtPoint[]; // unchanged
}
```

#### SQL for monthly distributed

```sql
SELECT
  strftime('%Y-%m', datetime(db.distribution_date / 1000, 'unixepoch')) AS month,
  SUM(db.quantity) AS distributed
FROM distribution_batches db
WHERE db.distribution_date >= ?  -- 12 months ago
  AND (? IS NULL OR db.model_name = ?)
GROUP BY month
ORDER BY month ASC
```

---

## Filter Scope Summary (updated)

| Data | Date Range | Model Filter |
|------|-----------|-------------|
| Zero/low stock combo KPIs | ❌ | ❌ |
| Critical combinations widget | ❌ | ❌ |
| Monthly distributed chart | ✅ | ✅ |
| All other existing data | unchanged | unchanged |
