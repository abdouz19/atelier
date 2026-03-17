# Data Model: Quality Control & Finition

## New Tables

### qc_records
Stores one QC review session covering part or all of a return batch.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PK | UUID |
| return_id | TEXT | NOT NULL, FK → return_records(id) | Source return event |
| employee_id | TEXT | NOT NULL, FK → employees(id) | Reviewer |
| quantity_reviewed | INTEGER | NOT NULL, CHECK > 0 | Pieces reviewed in this session |
| qty_damaged | INTEGER | NOT NULL DEFAULT 0, CHECK >= 0 | تالف |
| qty_acceptable | INTEGER | NOT NULL DEFAULT 0, CHECK >= 0 | مقبول |
| qty_good | INTEGER | NOT NULL DEFAULT 0, CHECK >= 0 | جيد |
| qty_very_good | INTEGER | NOT NULL DEFAULT 0, CHECK >= 0 | جيد جداً |
| price_per_piece | REAL | NOT NULL, CHECK > 0 | Cost per reviewed piece |
| total_cost | REAL | NOT NULL, CHECK > 0 | price_per_piece × quantity_reviewed |
| review_date | INTEGER | NOT NULL | Unix ms timestamp |
| created_at | INTEGER | NOT NULL | |
| updated_at | INTEGER | NOT NULL | |

**Constraint (enforced in service)**: `qty_damaged + qty_acceptable + qty_good + qty_very_good = quantity_reviewed`

**Derived — unreviewed qty for a return**: `return_records.quantity_returned − SUM(qc_records.quantity_reviewed) WHERE return_id = ?`

**Indexes**: `idx_qc_records_return(return_id)`, `idx_qc_records_date(review_date)`

---

### qc_consumption_entries
Non-fabric stock consumed during a QC session.

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| qc_id | TEXT | NOT NULL, FK → qc_records(id) |
| stock_item_id | TEXT | NOT NULL, FK → stock_items(id) |
| color | TEXT | nullable |
| quantity | REAL | NOT NULL, CHECK > 0 |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

**Index**: `idx_qc_consumption_qc(qc_id)`

---

### finition_records
One finition operation covering part or all of a QC record's finitionable pieces.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PK | |
| qc_id | TEXT | NOT NULL, FK → qc_records(id) | |
| employee_id | TEXT | NOT NULL, FK → employees(id) | |
| quantity | INTEGER | NOT NULL, CHECK > 0 | |
| price_per_piece | REAL | NOT NULL, CHECK > 0 | |
| total_cost | REAL | NOT NULL, CHECK > 0 | |
| finition_date | INTEGER | NOT NULL | Unix ms |
| is_ready | INTEGER | NOT NULL DEFAULT 0 | 1 = added to final stock |
| created_at | INTEGER | NOT NULL | |
| updated_at | INTEGER | NOT NULL | |

**Derived — finitionable qty remaining for a QC record**:
`(qc_records.qty_acceptable + qty_good + qty_very_good) − SUM(finition_records.quantity) WHERE qc_id = ?`

**Indexes**: `idx_finition_records_qc(qc_id)`, `idx_finition_records_date(finition_date)`

---

### finition_consumption_entries
Non-fabric stock consumed during a finition operation.

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| finition_id | TEXT | NOT NULL, FK → finition_records(id) |
| stock_item_id | TEXT | NOT NULL, FK → stock_items(id) |
| color | TEXT | nullable |
| quantity | REAL | NOT NULL, CHECK > 0 |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

**Index**: `idx_finition_consumption_finition(finition_id)`

---

### finition_steps
Custom processing steps chained after a finition record when the product is not yet ready.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PK | |
| finition_id | TEXT | NOT NULL, FK → finition_records(id) | |
| step_order | INTEGER | NOT NULL | 1-based, auto-assigned |
| step_name | TEXT | NOT NULL | Free text, e.g. كي، تغليف |
| employee_id | TEXT | FK → employees(id), nullable | Optional |
| quantity | INTEGER | NOT NULL, CHECK > 0 | ≤ preceding record's quantity |
| price_per_piece | REAL | nullable | Optional |
| total_cost | REAL | nullable | price_per_piece × quantity when set |
| step_date | INTEGER | NOT NULL | Unix ms |
| is_ready | INTEGER | NOT NULL DEFAULT 0 | 1 = added to final stock |
| created_at | INTEGER | NOT NULL | |
| updated_at | INTEGER | NOT NULL | |

**Constraint (enforced in service)**: `quantity ≤ preceding record's quantity` (finition_records.quantity for step_order=1, else previous step's quantity)

**Index**: `idx_finition_steps_finition(finition_id)`

---

### finition_step_consumption_entries
Non-fabric stock consumed during a custom step.

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| step_id | TEXT | NOT NULL, FK → finition_steps(id) |
| stock_item_id | TEXT | NOT NULL, FK → stock_items(id) |
| color | TEXT | nullable |
| quantity | REAL | NOT NULL, CHECK > 0 |
| created_at | INTEGER | NOT NULL |
| updated_at | INTEGER | NOT NULL |

**Index**: `idx_finition_step_consumption_step(step_id)`

---

### final_stock_entries
Append-only log of finished garments added to inventory when a product is marked ready.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PK | |
| model_name | TEXT | NOT NULL | From distribution_batches via the chain |
| size_label | TEXT | NOT NULL | |
| color | TEXT | NOT NULL | |
| quantity | INTEGER | NOT NULL, CHECK > 0 | |
| source_type | TEXT | NOT NULL | 'finition' or 'finition_step' |
| source_id | TEXT | NOT NULL | FK to finition_records.id or finition_steps.id |
| entry_date | INTEGER | NOT NULL | Unix ms |
| created_at | INTEGER | NOT NULL | |
| updated_at | INTEGER | NOT NULL | |

**Index**: `idx_final_stock_model(model_name, size_label, color)`, `idx_final_stock_source(source_type, source_id)`

---

## Entity Relationships

```
return_records (006)
  └── qc_records (1:many — multiple QC sessions per return)
        ├── qc_consumption_entries (1:many)
        └── finition_records (1:many — multiple finition ops per QC record)
              ├── finition_consumption_entries (1:many)
              ├── finition_steps (1:ordered-many — custom step chain)
              │     └── finition_step_consumption_entries (1:many)
              └── final_stock_entries (via finition_records.is_ready = 1)
                    (also via finition_steps.is_ready = 1)

employees (004)
  ├── qc_records.employee_id
  ├── finition_records.employee_id
  └── finition_steps.employee_id (optional)

stock_items (002)
  ├── qc_consumption_entries.stock_item_id
  ├── finition_consumption_entries.stock_item_id
  └── finition_step_consumption_entries.stock_item_id
```

## State Transitions

### Return Batch (via qc_records)
```
PENDING QC → (partial) → PARTIALLY REVIEWED (معلق) → FULLY REVIEWED (مكتمل)

Computed: SUM(qc_records.quantity_reviewed) WHERE return_id
  < return_records.quantity_returned  → "جزئي"
  = return_records.quantity_returned  → "مكتمل"
```

### Finition Record
```
CREATED → (is_ready=0, no steps, no final_stock_entry) → PENDING READINESS
        → (is_ready=1, final_stock_entry exists)        → READY (مكتمل)
        → (is_ready=0, has finition_steps)              → IN CUSTOM STEPS
```

### Finition Step
```
CREATED → (is_ready=0, last step) → PENDING READINESS
        → (is_ready=1)             → READY
        → (is_ready=0, next step exists) → CONTINUED
```

## KPI Computation Queries

| KPI | Query |
|-----|-------|
| Pending QC | SUM(rr.quantity_returned) − SUM(qr.quantity_reviewed) across all return_records |
| Total reviewed | SUM(qc_records.quantity_reviewed) |
| Total تالف | SUM(qc_records.qty_damaged) |
| Total مقبول | SUM(qc_records.qty_acceptable) |
| Total جيد | SUM(qc_records.qty_good) |
| Total جيد جداً | SUM(qc_records.qty_very_good) |
| Finition pending | SUM(finitionable per QC record) = SUM(qty_acc+qty_good+qty_vg) − SUM(finition_records.quantity) |
| Ready for final stock | SUM(final_stock_entries.quantity) |
