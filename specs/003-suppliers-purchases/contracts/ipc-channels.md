# IPC Channel Contracts: Suppliers & Purchase Tracking

All responses follow: `{ success: true; data: T } | { success: false; error: string }`

---

## New Channels: `suppliers:*`

### `suppliers:getAll`
Returns all active (non-deleted) suppliers sorted by name.

**Payload**: none

**Response data**: `SupplierSummary[]`
```typescript
{
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  productsSold: string | null;
  notes: string | null;
  isDeleted: false; // always false — deleted excluded
}
```

---

### `suppliers:getById`
Returns a single supplier with full purchase history and total spent.

**Payload**: `{ id: string }`

**Response data**: `SupplierDetail`
```typescript
{
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  productsSold: string | null;
  notes: string | null;
  isDeleted: boolean;
  totalSpent: number;        // SUM(total_price_paid) across all linked transactions
  purchases: PurchaseRecord[];
}

interface PurchaseRecord {
  transactionId: string;
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  unit: string;
  color: string | null;
  pricePerUnit: number;
  totalPricePaid: number;
  transactionDate: number;   // Unix ms
}
```
Purchases ordered by `transaction_date DESC`.

---

### `suppliers:create`

**Payload**:
```typescript
{
  name: string;           // required, non-empty
  phone?: string;
  address?: string;
  productsSold?: string;
  notes?: string;
}
```

**Response data**: `SupplierSummary`

**Errors**: `'اسم المورد مطلوب'`

---

### `suppliers:update`

**Payload**:
```typescript
{
  id: string;
  name?: string;
  phone?: string | null;
  address?: string | null;
  productsSold?: string | null;
  notes?: string | null;
}
```

**Response data**: `null`

**Errors**: `'المورد غير موجود'`, `'اسم المورد مطلوب'`

---

### `suppliers:delete`
Soft-deletes the supplier (`is_deleted = 1`). The supplier is no longer returned by `getAll` or available in selectors. Historical transactions retain the `supplier_name` snapshot.

**Payload**: `{ id: string }`

**Response data**: `null`

**Errors**: `'المورد غير موجود'`

---

## Extended Channels: `stock:*`

### `stock:create` (extended)

Added optional fields to existing payload:
```typescript
{
  // ... existing fields (name, type, unit, initialQuantity, color, imageData, ...) ...
  supplierId?: string;         // optional; if set, pricePerUnit required
  pricePerUnit?: number;       // required when supplierId set
  totalPricePaid?: number;     // defaults to initialQuantity × pricePerUnit if omitted
}
```

**Errors added**: `'السعر مطلوب عند اختيار مورد'`, `'السعر يجب أن يكون أكبر من صفر'`

---

### `stock:addInbound` (extended)

Added optional fields to existing payload:
```typescript
{
  // ... existing fields (stockItemId, quantity, color, transactionDate, notes) ...
  supplierId?: string;
  pricePerUnit?: number;
  totalPricePaid?: number;
}
```

**Errors added**: `'السعر مطلوب عند اختيار مورد'`, `'السعر يجب أن يكون أكبر من صفر'`

---

### `stock:updateTransaction` (extended)

Added optional fields to existing payload:
```typescript
{
  // ... existing fields (id, quantity, transactionDate) ...
  supplierId?: string | null;       // null = remove supplier association
  pricePerUnit?: number | null;
  totalPricePaid?: number | null;
}
```

**Errors added**: `'السعر مطلوب عند اختيار مورد'`

---

### `stock:getById` (response extended)

`StockTransaction` in the response now includes:
```typescript
{
  // ... existing fields ...
  supplierName: string | null;
  pricePerUnit: number | null;
  totalPricePaid: number | null;
}
```

---

## Preload bridge additions (`electron/preload.js`)

```javascript
suppliers: {
  getAll: () => ipcRenderer.invoke('suppliers:getAll'),
  getById: (payload) => ipcRenderer.invoke('suppliers:getById', payload),
  create: (payload) => ipcRenderer.invoke('suppliers:create', payload),
  update: (payload) => ipcRenderer.invoke('suppliers:update', payload),
  delete: (payload) => ipcRenderer.invoke('suppliers:delete', payload),
}
```
