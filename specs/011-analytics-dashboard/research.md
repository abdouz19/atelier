# Research: Analytics Dashboard

**Feature**: 011-analytics-dashboard | **Phase**: 0 | **Date**: 2026-03-17

## Decision: Chart Library

- **Decision**: Recharts (installed via `npm install recharts` in frontend/)
- **Rationale**: Recharts is explicitly listed in the Atelier Constitution's Core Stack. No alternatives considered.
- **Finding**: Recharts is NOT currently in frontend/package.json — must be installed before component work begins
- **Components needed**: `BarChart`, `Bar`, `LineChart`, `Line`, `PieChart`, `Pie`, `Cell`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer`

## Decision: Filter State Management

- **Decision**: `useSearchParams` + `router.replace()` for date range and model filters
- **Rationale**: Every existing page in the project uses this exact pattern; it provides shareable/bookmarkable URLs and avoids Zustand for page-level filter state (per constitution: "Use useSearchParams for filters/pagination")
- **URL params**: `from` (Unix timestamp ms, start of range), `to` (Unix timestamp ms, end of range), `model` (model name string, empty = all)
- **Defaults**: if `from`/`to` absent, compute first/last ms of current calendar month in the page component

## Decision: IPC Channel Architecture

- **Decision**: 3 channels with clear filter boundaries
  1. `dashboard:getSnapshotData` — snapshot KPIs + pipeline stages + activity feed; never re-fetched on filter change
  2. `dashboard:getPeriodKpis({ startDate, endDate })` — period KPIs; re-fetched when date range changes
  3. `dashboard:getChartData({ startDate, endDate, modelName? })` — all 5 chart datasets (pipeline donut derived client-side from pipeline stages); re-fetched when either filter changes
- **Rationale**: Separating snapshot (live state) from period (date-filtered) data allows targeted re-fetching with minimal IPC overhead

## Decision: Fabric Item Identification

- **Decision**: Fabric items = `stock_items` WHERE `unit = 'متر'`
- **Rationale**: The cutting:getFabrics handler identifies fabric items by unit type; consistent with how the app distinguishes fabric from non-fabric stock
- **Dashboard KPI**: SUM of inbound - consumed transactions per fabric item = available meters; show one value per fabric item

## Decision: Pipeline Stage Queries

| Stage | Arabic Label | Computation |
|-------|-------------|-------------|
| 1 — Not distributed | غير موزعة | `COUNT(*) FROM cutting_pieces WHERE status = 'not_distributed'` |
| 2 — In distribution | في التوزيع | `COUNT(*) FROM cutting_pieces WHERE status = 'distributed'` |
| 3 — Returned, awaiting QC | مُعادة — بانتظار مراقبة | `SUM(return_records.quantity_returned) - SUM(qc_records.quantity_reviewed)` |
| 4 — QC complete, awaiting finition | جاهزة للتشطيب | `SUM(qty_acceptable+qty_good+qty_very_good FROM qc_records) - SUM(finition_records.quantity)` |
| 5 — In finition | في التشطيب | `SUM(finition_records.quantity WHERE is_ready=0)` |
| 6 — Final stock | المخزون النهائي | `SUM(final_stock_entries.quantity)` |

Stages 1–2: individual piece counts (cutting_pieces, 1 row = 1 piece).
Stages 3–6: aggregate quantities from their respective tables.

## Decision: Activity Feed UNION Query

Approach: UNION ALL across 6 operation types, ordered by event_date DESC, LIMIT 20.

```sql
SELECT 'cutting_session' AS type, cs.id, cs.model_name, cs.session_date AS event_date
FROM cutting_sessions cs
UNION ALL
SELECT 'distribution', db.id, db.model_name, db.distribution_date
FROM distribution_batches db
UNION ALL
SELECT 'return', rr.id, db.model_name, rr.return_date
FROM return_records rr JOIN distribution_batches db ON db.id = rr.batch_id
UNION ALL
SELECT 'qc', qr.id, db.model_name, qr.review_date
FROM qc_records qr
  JOIN return_records rr ON rr.id = qr.return_id
  JOIN distribution_batches db ON db.id = rr.batch_id
UNION ALL
SELECT 'finition', fr.id, db.model_name, fr.finition_date
FROM finition_records fr
  JOIN qc_records qr ON qr.id = fr.qc_id
  JOIN return_records rr ON rr.id = qr.return_id
  JOIN distribution_batches db ON db.id = rr.batch_id
UNION ALL
SELECT 'final_stock', fse.id, fse.model_name, fse.entry_date
FROM final_stock_entries fse
ORDER BY event_date DESC LIMIT 20
```

## Decision: Employee Debt (Positive Balances Only)

```sql
SELECT e.id, e.name,
  COALESCE(SUM(eo.total_amount), 0) - COALESCE(SUM(ep.amount), 0) AS balance
FROM employees e
LEFT JOIN employee_operations eo ON eo.employee_id = e.id
LEFT JOIN employee_payments ep ON ep.employee_id = e.id
WHERE e.is_active = 1
GROUP BY e.id, e.name
HAVING balance > 0
ORDER BY balance DESC
```

The KPI value = SUM of all positive individual balances. Employees with zero/negative balance excluded from both KPI and chart.

## Decision: Purchases KPI

```sql
SELECT COALESCE(SUM(st.total_price_paid), 0) AS total_purchases
FROM stock_transactions st
WHERE st.type = 'inbound'
  AND st.total_price_paid IS NOT NULL
  AND st.transaction_date >= ? AND st.transaction_date <= ?
```

## Decision: Monthly Production Chart

```sql
SELECT strftime('%Y-%m', datetime(fse.entry_date/1000, 'unixepoch')) AS month,
       SUM(fse.quantity) AS pieces
FROM final_stock_entries fse
WHERE fse.entry_date >= ?  -- 12 months ago
  AND (? IS NULL OR fse.model_name = ?)
GROUP BY month
ORDER BY month ASC
```

Returns up to 12 months; gaps (months with 0 pieces) filled client-side.

## Decision: Top 5 Tailors by Returns

```sql
SELECT t.name, SUM(rr.quantity_returned) AS returned
FROM return_records rr
  JOIN distribution_batches db ON db.id = rr.batch_id
  JOIN tailors t ON t.id = db.tailor_id
WHERE rr.return_date >= ? AND rr.return_date <= ?
  AND (? IS NULL OR db.model_name = ?)
GROUP BY t.id, t.name
ORDER BY returned DESC
LIMIT 5
```

## Decision: Top 5 Models by Final Stock

```sql
SELECT fse.model_name, SUM(fse.quantity) AS pieces
FROM final_stock_entries fse
GROUP BY fse.model_name
ORDER BY pieces DESC
LIMIT 5
```

Not date-filtered (shows current total in stock); not affected by model filter (always shows all models).

## Decision: Fabric Consumption Chart

```sql
SELECT si.name AS fabric_name,
       strftime('%Y-%m', datetime(st.transaction_date/1000, 'unixepoch')) AS month,
       SUM(st.quantity) AS meters_consumed
FROM stock_transactions st
  JOIN stock_items si ON si.id = st.stock_item_id
WHERE st.type = 'consumed'
  AND si.unit = 'متر'
  AND st.transaction_date >= ?  -- 6 months ago
GROUP BY si.id, month
ORDER BY month ASC, si.name ASC
```

Client-side pivot: one key per fabric in each month's data point.
