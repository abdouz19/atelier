# IPC Contracts: Quality Control & Finition

All channels follow the envelope pattern: `{ success: true, data: T } | { success: false, error: string }`

---

## Namespace: `qc`

### `qc:getKpis`
Returns all dashboard KPI counts.

**Input**: none

**Output**:
```ts
{
  pendingQc: number;          // unreviewed pieces across all return records
  totalReviewed: number;
  totalDamaged: number;       // تالف
  totalAcceptable: number;    // مقبول
  totalGood: number;          // جيد
  totalVeryGood: number;      // جيد جداً
  finitionPending: number;    // finitionable pieces not yet finitioned
  readyForStock: number;      // sum of final_stock_entries.quantity
}
```

---

### `qc:getReturnBatchesForQc`
Returns return records that still have unreviewed quantity.

**Input**: none

**Output**: `ReturnBatchForQc[]`
```ts
interface ReturnBatchForQc {
  returnId: string;
  batchId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantityReturned: number;
  quantityReviewed: number;    // sum across all qc_records
  quantityAvailable: number;   // quantityReturned - quantityReviewed
  returnDate: number;
}
```

---

### `qc:getRecords`
Returns all QC records for the table view.

**Input**: none

**Output**: `QcRecordSummary[]`
```ts
interface QcRecordSummary {
  id: string;
  returnId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  employeeName: string;
  reviewDate: number;
  quantityReviewed: number;
  qtyDamaged: number;
  qtyAcceptable: number;
  qtyGood: number;
  qtyVeryGood: number;
  pricePerPiece: number;
  totalCost: number;
  batchStatus: 'جزئي' | 'مكتمل';   // derived from batch completion
}
```

---

### `qc:create`
Creates a QC record with optional consumption entries.

**Input**:
```ts
{
  returnId: string;
  employeeId: string;
  quantityReviewed: number;    // > 0, ≤ quantityAvailable
  qtyDamaged: number;          // ≥ 0
  qtyAcceptable: number;       // ≥ 0
  qtyGood: number;             // ≥ 0
  qtyVeryGood: number;         // ≥ 0
  // sum of above 4 must equal quantityReviewed
  pricePerPiece: number;       // > 0
  reviewDate: number;          // Unix ms
  consumptionEntries?: {
    stockItemId: string;
    color?: string;
    quantity: number;          // > 0
  }[];
}
```

**Output**: `{ id: string }`

**Validation errors**:
- Grade sum ≠ quantityReviewed → "مجموع الدرجات لا يساوي الكمية المراجعة"
- quantityReviewed > quantityAvailable → "الكمية تتجاوز الكمية المتاحة للمراجعة"

---

## Namespace: `finition`

### `finition:getQcRecordsForFinition`
Returns QC records with remaining finitionable quantity.

**Input**: none

**Output**: `QcRecordForFinition[]`
```ts
interface QcRecordForFinition {
  qcId: string;
  returnId: string;
  tailorName: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  reviewDate: number;
  finitionableTotal: number;   // qty_acc + qty_good + qty_very_good
  finitionedSoFar: number;     // sum of finition_records.quantity for this qc_id
  finitionableRemaining: number;
}
```

---

### `finition:getRecords`
Returns all finition records with their custom step chains.

**Input**: none

**Output**: `FinitionRecordSummary[]`
```ts
interface FinitionRecordSummary {
  id: string;
  qcId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  employeeName: string;
  finitionDate: number;
  quantity: number;
  pricePerPiece: number;
  totalCost: number;
  isReady: boolean;
  steps: {
    id: string;
    stepOrder: number;
    stepName: string;
    employeeName: string | null;
    quantity: number;
    stepDate: number;
    isReady: boolean;
  }[];
}
```

---

### `finition:create`
Creates a finition record with optional consumption entries.

**Input**:
```ts
{
  qcId: string;
  employeeId: string;
  quantity: number;            // > 0, ≤ finitionableRemaining
  pricePerPiece: number;       // > 0
  finitionDate: number;        // Unix ms
  consumptionEntries?: {
    stockItemId: string;
    color?: string;
    quantity: number;
  }[];
}
```

**Output**: `{ id: string }`

**Validation errors**:
- quantity > finitionableRemaining → "الكمية تتجاوز الكمية القابلة للتشطيب"

---

### `finition:createStep`
Creates a custom processing step linked to a finition record.

**Input**:
```ts
{
  finitionId: string;
  stepName: string;            // non-empty
  quantity: number;            // > 0, ≤ preceding record's quantity
  employeeId?: string;
  pricePerPiece?: number;
  stepDate: number;            // Unix ms
  consumptionEntries?: {
    stockItemId: string;
    color?: string;
    quantity: number;
  }[];
}
```

**Output**: `{ id: string; stepOrder: number }`

**Validation errors**:
- quantity > preceding quantity → "الكمية تتجاوز كمية السجل السابق"

---

### `finition:addToFinalStock`
Marks a finition record or step as ready and creates a final stock entry.

**Input**:
```ts
{
  sourceType: 'finition' | 'finition_step';
  sourceId: string;
  modelName: string;
  sizeLabel: string;
  color: string;
  quantity: number;   // must match source record's quantity
  entryDate: number;
}
```

**Output**: `{ finalStockEntryId: string }`
