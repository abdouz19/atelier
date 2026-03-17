# PRD – منصة إدارة الإنتاج الخياطي
## **Tailor Flow** — Product Requirements Document
**Version:** 1.0.0  
**Date:** 2026-03-14  
**Stack:** Next.js · shadcn/ui · SQLite (better-sqlite3) · Electron  
**Language/Direction:** Arabic · RTL  
**Target Platforms:** macOS · Windows  

---

## 1. Vision & Goals

Build a **desktop-first** production management platform for garment workshops. It covers the full lifecycle: raw fabric stock → cutting → tailor distribution → quality control & finishing → final stock. All data is stored locally via SQLite, with no cloud dependency.

---

## 2. Tech Stack & Constraints

| Layer | Choice |
|---|---|
| UI Framework | Next.js 14 (App Router) |
| Component Library | shadcn/ui + Tailwind CSS (RTL configured) |
| Desktop Shell | Electron |
| Database | SQLite via `better-sqlite3` |
| ORM | Drizzle ORM |
| State Management | Zustand |
| Charts | Recharts |
| i18n | next-i18next (AR only, RTL enforced globally) |
| Packaging | electron-builder (macOS .dmg, Windows .exe) |

---

## 3. Database Schema (Core Tables)

```
users               – auth (local login)
employees           – worker profiles
stock_items         – unified stock (fabrics + other supplies)
stock_transactions  – every in/out movement on stock_items
models              – garment model definitions
sizes               – size catalogue
colors              – color catalogue
cuttings            – cutting sessions
cutting_details     – per-size output of a cutting session
cutting_consumptions – stock consumed during cutting
pieces              – individual piece batches (status-tracked)
distributions       – tailor distribution records
distribution_returns – returned pieces from tailors
distribution_consumptions – stock consumed during distribution
quality_reviews     – QC records per return
finishing_records   – finishing records per QC review
finishing_consumptions – stock consumed during finishing
custom_steps        – user-defined post-finishing steps
custom_step_records – execution records for custom steps
final_stock         – aggregated finished product stock
employee_payments   – salary/advance payments to employees
```

---

## 4. Screens & Features

---

### 4.1 Authentication
- Local login / logout (username + password stored hashed in SQLite).
- Single-user for v1; settings allow password change.
- Auto-lock after inactivity (configurable timeout).

---

### 4.2 Dashboard (لوحة التحكم)

**KPIs (date-range filterable):**
- Total fabric meters in stock
- Total pieces produced / distributed / returned / finished
- Pieces currently with tailors
- Defective (تالف) rate %
- Total employee debt outstanding
- Final stock count (per model/size/color)

**Charts:**
- Production funnel (stock → cutting → distribution → QC → final)
- Pieces by status over time (line chart)
- Top tailors by returned pieces
- Cutting sessions per month

---

### 4.3 Stock (المخزون)

#### 4.3.1 Stock List Screen
- Table of all stock items with: image thumbnail, name, type (fabric / thread / flex / packaging / other — user-defined), color, quantity + unit, notes, description.
- Filters: type, color, low-stock alert flag.
- Add / Edit / Archive item.

#### 4.3.2 Stock Item Detail
- Full history of all transactions (in/out) with date, source operation, quantity delta, running balance.
- Ability to manually add incoming stock (quantity, date, notes, optional supplier).

#### 4.3.3 Add Stock Item Form
Fields: name, type (select or create), color (optional), unit (meters / kg / pieces / liters / other), quantity, image upload, description, notes.

---

### 4.4 Cutting (الفصالة)

#### 4.4.1 Cutting List Screen
- Table of all cutting sessions: date, model, fabric used, meters consumed, total pieces produced, employee(s).
- KPIs: total sessions, total meters consumed, total pieces produced this month.

#### 4.4.2 New Cutting – Step 1 (Session Info)
Fields:
- Fabric (stock item, type=fabric) — select with color picker
- Model
- Meters used → auto-deducts from fabric stock
- Number of layers
- Layer price (price per layer paid to employees)
- Employee(s) who performed the cutting (multi-select)
- Date, Notes

#### 4.4.3 New Cutting – Step 2 (Piece Output)
For each size (add multiple rows):
- Size
- Pieces count produced → creates piece batches with status: `not_distributed`

**Additional consumptions (optional):**
- Select non-fabric stock item + quantity consumed → deducted from stock.

#### 4.4.4 Cutting Detail View
Full breakdown of sizes, pieces, consumptions, employees, cost.

---

### 4.5 Distribution (التوزيع)

#### 4.5.1 Distribution List Screen
KPIs:
- Total pieces currently in distribution
- Total returned pieces
- Pieces not yet returned (per tailor breakdown)
- Average return time
- Total sewing cost to date

Tabs: All Distributions · By Tailor · Pending Returns

#### 4.5.2 Distribute (توزيع) – New Distribution Form
Fields:
- Tailor (employee, role=tailor)
- Model
- Size
- Color
- Quantity (pulls from `not_distributed` pieces of that model/size/color)
- Sewing price per piece
- Total cost (auto-calculated)
- Date, Notes

Piece status after save → `in_distribution`.

#### 4.5.3 Return (مرتجع) – New Return Form
- Select tailor
- See all his active distributed batches (model · size · color · quantity sent · quantity already returned)
- Select one batch → enter quantity returned
- Date, Notes

**Additional consumptions (optional)** — same as cutting.

Piece status after save → `returned`.

---

### 4.6 Quality Control & Finishing (مراقبة الجودة والتشطيب)

#### 4.6.1 Quality Control (مراقبة الجودة)

List of returned distributions pending QC.

**New QC Record Form:**
- Select a return batch
- Employee who performed QC + price per piece reviewed
- Quantity breakdown:
  - معلق (default pending)
  - مقبول
  - جيد
  - جيد جداً
  - تالف
- Date, Notes

Piece status → `qc_done` per reviewed quantity.

#### 4.6.2 Finishing (التشطيب)

List of QC-reviewed batches pending finishing.

**New Finishing Record Form:**
- Select QC review batch
- Quantity to finish
- Employee who finished + price per piece
- Date, Notes

After saving → prompt: **"هل المنتج جاهز للمخزون النهائي؟"**
- **Yes** → pieces moved to Final Stock (status: `finished`).
- **No** → user is routed to add a Custom Step.

**Additional consumptions (optional).**

#### 4.6.3 Custom Steps (خطوات مخصصة)

User can define custom step types (ironing, packaging, embroidery…).

**New Custom Step Record:**
- Step type (select existing or create new)
- Source: from finishing batch
- Quantity
- Employee (optional) + price per piece
- Date, Notes

After saving → same prompt: **"هل المنتج جاهز؟"**
- Yes → Final Stock.
- No → add another custom step (loop until ready).

**Additional consumptions (optional).**

---

### 4.7 Final Stock (المخزون النهائي)

- Table: model · size · color · quantity · last updated.
- Filters: model, size, color.
- Each row expandable → shows full history of batches that contributed to it.
- Manual adjustment (with reason note) allowed.

---

### 4.8 Employees (الموظفون)

#### 4.8.1 Employee List
Table: name, role, phone, total operations, total earned, total paid, **outstanding debt**.

#### 4.8.2 Employee Profile Detail
Tabs:
- **Operations** — timeline of all operations (cutting / distribution / QC / finishing / custom steps) with date, type, quantity, price per unit, total.
- **Financial** — total earnings, total payments received, balance (debt).
- **Add Payment** — record a payment given to employee (amount, date, notes) → deducted from debt.

#### 4.8.3 Add / Edit Employee Form
Fields: full name, role (cutter / tailor / QC / finisher / other), phone, national ID, notes, profile photo.

---

### 4.9 Settings (الإعدادات)

- Change password
- App language (AR — v1 only)
- Auto-lock timeout
- Manage lookup data: models, sizes, colors, custom step types
- Database: export backup (.sqlite), import/restore backup
- About / version

---

## 5. Piece Status Lifecycle

```
not_distributed
    └─► in_distribution
            └─► returned
                    └─► qc_done
                            └─► finishing_done
                                    └─► custom_step (loop)
                                            └─► finished  ──► Final Stock
```

---

## 6. Stock Transaction Rules

Every operation that touches stock must insert a `stock_transactions` row:
- `source_type`: manual_in | cutting | distribution | distribution_return | finishing | custom_step
- `source_id`: FK to the operation record
- `delta`: positive (in) or negative (out)
- Running balance is computed from transaction history (no cached balance to avoid drift).

---

## 7. Employee Debt Rules

- Debt increases when an operation record is saved with price > 0 for that employee.
- Debt decreases when an `employee_payments` record is added.
- Net debt = Σ(operation costs) − Σ(payments).

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Offline-first | 100% — no internet required |
| RTL support | Full RTL layout, Arabic numerals optional (setting) |
| Performance | All list queries < 200 ms on 100 k rows |
| Backup | One-click SQLite export/import |
| Window size | Minimum 1280 × 800 |
| Accessibility | WCAG AA contrast ratios |

---

## 9. Screens List (Navigation)

```
/                    → Dashboard
/stock               → Stock list
/stock/[id]          → Stock item detail
/cutting             → Cutting list
/cutting/new         → New cutting (2-step wizard)
/cutting/[id]        → Cutting detail
/distribution        → Distribution list + KPIs
/distribution/new    → New distribution
/distribution/return → New return
/qc                  → QC list
/qc/new              → New QC record
/finishing           → Finishing list
/finishing/new       → New finishing record
/custom-steps        → Custom steps list
/custom-steps/new    → New custom step record
/final-stock         → Final stock
/employees           → Employee list
/employees/[id]      → Employee profile
/settings            → Settings
/login               → Login
```

---

## 10. Development Phases (Spec Order)

| # | Spec | Description |
|---|---|---|
| 1 | Project Bootstrap | Electron + Next.js + shadcn + Drizzle + SQLite setup, RTL config |
| 2 | Auth | Login/logout, local hashed password |
| 3 | DB Schema | All tables, migrations via Drizzle |
| 4 | Stock Module | Stock items CRUD + transactions |
| 5 | Employees Module | Employee CRUD + payment records |
| 6 | Lookup Data | Models, sizes, colors, custom step types CRUD (in settings) |
| 7 | Cutting Module | Cutting sessions + piece generation |
| 8 | Distribution Module | Distribute + return flows |
| 9 | QC Module | Quality review records |
| 10 | Finishing Module | Finishing + custom steps loop |
| 11 | Final Stock Module | Aggregated view + history |
| 12 | Dashboard | KPIs + charts |
| 13 | Settings | Backup/restore, preferences |
| 14 | Polish | RTL audit, error states, empty states, loading skeletons |
| 15 | Packaging | electron-builder macOS + Windows |

---

*This document is the single source of truth for the GitHub Copilot agent during development. Every spec command will reference section numbers from this PRD.*