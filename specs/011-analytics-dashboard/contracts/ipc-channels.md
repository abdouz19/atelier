# IPC Channel Contracts: Analytics Dashboard

**Feature**: 011-analytics-dashboard | **Date**: 2026-03-17

All responses are wrapped in the standard envelope:
```typescript
{ success: true; data: T } | { success: false; error: string }
```

---

## Channel 1: `dashboard:getSnapshotData`

**Direction**: renderer → main
**Re-fetch trigger**: Page mount only (never re-fetched on filter change)
**Purpose**: Live snapshot KPIs + 6-stage pipeline + activity feed (all reflect current database state, not scoped by date range)

### Request Payload

None.

### Response Data

```typescript
{
  kpis: {
    fabricItems: Array<{ name: string; availableMeters: number }>;
    zeroStockNonFabricCount: number;
    piecesNotDistributed: number;
    piecesInDistribution: number;
    piecesAwaitingQc: number;
    piecesAwaitingFinition: number;
    piecesInFinition: number;
    piecesInFinalStock: number;
    activeTailorsWithPendingDistributions: number;
  };
  pipeline: Array<{
    label: string;
    count: number;
    href: string;
  }>;
  activity: Array<{
    id: string;
    type: 'cutting_session' | 'distribution' | 'return' | 'qc' | 'finition' | 'final_stock';
    modelName: string | null;
    eventDate: number;
  }>;
}
```

### Behavior

- `pipeline` always contains exactly 6 items in stage order (counts may be 0)
- `activity` contains at most 20 entries ordered by `eventDate DESC`
- `fabricItems` may be empty if no `unit='متر'` items exist in `stock_items`
- `zeroStockNonFabricCount` counts only `stock_items` with `unit != 'متر'` where available quantity = 0

### Error Cases

- Database read failure → `{ success: false, error: "..." }`

---

## Channel 2: `dashboard:getPeriodKpis`

**Direction**: renderer → main
**Re-fetch trigger**: Date range filter change
**Purpose**: Period-scoped KPIs (employee debt total, purchases total)

### Request Payload

```typescript
{
  startDate: number;  // Unix timestamp ms (inclusive)
  endDate: number;    // Unix timestamp ms (inclusive)
}
```

### Response Data

```typescript
{
  totalEmployeeDebt: number;   // Sum of positive individual balances only (always >= 0)
  totalPurchases: number;      // Sum of stock_transactions WHERE type='inbound' in date range
}
```

### Behavior

- `totalEmployeeDebt` is not date-scoped — always reflects current employee balance state; employees with zero or negative balance contribute 0
- `totalPurchases` is date-scoped to `[startDate, endDate]`; returns 0 if no purchases in range
- Model filter does NOT affect either KPI

### Error Cases

- Missing/invalid payload fields → `{ success: false, error: "startDate and endDate are required" }`
- Database read failure → `{ success: false, error: "..." }`

---

## Channel 3: `dashboard:getChartData`

**Direction**: renderer → main
**Re-fetch trigger**: Date range filter change OR model filter change
**Purpose**: All 5 chart datasets in a single call

### Request Payload

```typescript
{
  startDate: number;    // Unix timestamp ms (inclusive)
  endDate: number;      // Unix timestamp ms (inclusive)
  modelName?: string;   // Optional — omit or empty string for all models
}
```

### Response Data

```typescript
{
  monthlyProduction: Array<{
    month: string;    // 'YYYY-MM'
    pieces: number;
  }>;
  topTailors: Array<{
    name: string;
    returned: number;
  }>;
  topModels: Array<{
    modelName: string;
    pieces: number;
  }>;
  fabricConsumption: Array<{
    fabricName: string;
    month: string;    // 'YYYY-MM'
    metersConsumed: number;
  }>;
  employeeDebt: Array<{
    name: string;
    balance: number;
  }>;
}
```

### Behavior

**monthlyProduction**
- Returns up to 12 months of data ending at today; each row is one calendar month
- Raw rows from DB (months with 0 production are absent); client fills gaps with `pieces: 0`
- Scoped by: date range + model filter (if provided)

**topTailors**
- At most 5 entries, ordered by `returned DESC`
- Scoped by: date range + model filter (if provided)
- Returns fewer than 5 if fewer than 5 tailors have returns in the range

**topModels**
- At most 5 entries, ordered by `pieces DESC`
- Not date-scoped; always shows all-time totals in `final_stock_entries`
- Not model-scoped; always shows all models

**fabricConsumption**
- Returns raw `(fabricName, month, metersConsumed)` rows for the last 6 months (relative to today)
- Scoped by: date range only (model filter does NOT affect this chart)
- Client-side pivot: each `month` data point gets one key per fabric name

**employeeDebt**
- Not date-scoped; reflects current balance state
- Not model-scoped
- Employees with balance ≤ 0 are excluded
- Ordered by `balance DESC`

### Error Cases

- Missing/invalid `startDate` or `endDate` → `{ success: false, error: "startDate and endDate are required" }`
- Database read failure → `{ success: false, error: "..." }`

---

## Filter Scope Summary

| Data | Date Range | Model Filter |
|------|-----------|-------------|
| Snapshot KPIs (pipeline, fabric meters, zero-stock, etc.) | ❌ | ❌ |
| Activity feed | ❌ | ❌ |
| Employee debt KPI | ❌ | ❌ |
| Purchases KPI | ✅ | ❌ |
| Monthly production chart | ✅ | ✅ |
| Top tailors chart | ✅ | ✅ |
| Top models chart | ❌ | ❌ |
| Fabric consumption chart | ✅ | ❌ |
| Employee debt chart | ❌ | ❌ |
