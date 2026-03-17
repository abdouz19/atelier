# IPC Contracts: Stock & Suppliers Enhancements

All responses follow the standard envelope: `{ success: true, data: T } | { success: false, error: string }`

---

## New Namespace: `lookups`

### Shared Types

```ts
interface LookupEntry {
  id: string;
  name: string;
  isPredefined: boolean;  // true = cannot edit or delete
  isActive: boolean;      // false = soft-deleted
  createdAt: number;      // timestamp ms
}

type ItemType = LookupEntry;
type Color    = LookupEntry;
type Unit     = LookupEntry;
```

---

### `lookups:getTypes`

Returns all active (non-soft-deleted) item types including predefined.

**Payload**: none

**Response**: `{ success: true, data: ItemType[] }` — sorted by `is_predefined DESC, name ASC`

---

### `lookups:getColors`

Returns all active colors including predefined.

**Payload**: none

**Response**: `{ success: true, data: Color[] }` — sorted by `is_predefined DESC, name ASC`

---

### `lookups:getUnits`

Returns all active units including predefined.

**Payload**: none

**Response**: `{ success: true, data: Unit[] }` — sorted by `is_predefined DESC, name ASC`

---

### `lookups:createType`

Creates a new user-defined item type.

**Payload**: `{ name: string }` — trimmed, non-empty

**Validation**:
- name must be non-empty after trim
- LOWER(name) must not already exist in `item_types` (active or not) — returns error `'هذا النوع موجود مسبقاً'`

**Response**: `{ success: true, data: ItemType }` — the newly created entry

---

### `lookups:createColor`

Creates a new user-defined color.

**Payload**: `{ name: string }`

**Validation**: Same as createType — duplicate check on LOWER(name) in `colors`

**Response**: `{ success: true, data: Color }`

---

### `lookups:createUnit`

Creates a new user-defined unit.

**Payload**: `{ name: string }`

**Validation**: Same pattern — duplicate check on LOWER(name) in `units`

**Response**: `{ success: true, data: Unit }`

---

### `lookups:updateType`

Updates the name of a user-created item type.

**Payload**: `{ id: string, name: string }`

**Validation**:
- Entry must exist and `is_predefined = 0` — returns error `'لا يمكن تعديل النوع المحدد مسبقاً'`
- LOWER(name) must not conflict with another entry

**Response**: `{ success: true, data: ItemType }` — updated entry

---

### `lookups:updateColor`

**Payload**: `{ id: string, name: string }`

**Validation**: Entry must exist and `is_predefined = 0`

**Response**: `{ success: true, data: Color }`

---

### `lookups:updateUnit`

**Payload**: `{ id: string, name: string }`

**Validation**: Entry must exist and `is_predefined = 0`

**Response**: `{ success: true, data: Unit }`

---

### `lookups:deleteType`

Soft-deletes a user-created item type (sets `is_active = 0`).

**Payload**: `{ id: string }`

**Validation**: Entry must exist and `is_predefined = 0` — returns error `'لا يمكن حذف النوع المحدد مسبقاً'`

**Response**: `{ success: true, data: null }`

---

### `lookups:deleteColor`

**Payload**: `{ id: string }`

**Validation**: Entry must exist and `is_predefined = 0`

**Response**: `{ success: true, data: null }`

---

### `lookups:deleteUnit`

**Payload**: `{ id: string }`

**Validation**: Entry must exist and `is_predefined = 0`

**Response**: `{ success: true, data: null }`

---

## Modified Channel: `stock:addInbound`

**Changed fields** (all now required):

```ts
// Before: supplierId optional, pricePerUnit conditional, totalPricePaid conditional
// After: all three required on every inbound transaction

interface AddInboundPayload {
  stockItemId: string;
  quantity: number;          // > 0
  color?: string;            // optional (managed dropdown value)
  transactionDate: number;   // timestamp ms
  notes?: string;
  supplierId: string;        // REQUIRED (was optional)
  pricePerUnit: number;      // REQUIRED > 0 (was conditional)
  totalPricePaid: number;    // REQUIRED > 0 (was conditional)
}
```

**Validation added**: `supplierId` must reference an existing non-deleted supplier. `pricePerUnit > 0`. `totalPricePaid > 0`.

**Response**: unchanged — `{ success: true, data: StockItemDetail }`

---

## Removed / Deprecated Channels

| Old Channel | Replacement |
|-------------|-------------|
| `stock:getTypes` | `lookups:getTypes` |
| `stock:getUnits` | `lookups:getUnits` |

The old `stock:getTypes` and `stock:getUnits` handlers in `electron/main.js` are removed. The frontend's `ipcClient.stock.getTypes()` and `ipcClient.stock.getUnits()` methods are removed from `ipc-client.ts` and replaced with `ipcClient.lookups.getTypes()` and `ipcClient.lookups.getUnits()`.

---

## Unchanged Channels Referenced by This Feature

| Channel | Used By | Why Unchanged |
|---------|---------|---------------|
| `suppliers:getAll` | AddInboundModal supplier dropdown | Already returns `SupplierSummary[]` |
| `suppliers:create` | "إضافة مورد" nested modal | Existing supplier creation flow |
| `cutting:getFabricColors` | CuttingStep1Form fabricColor | Retains stock-availability constraint |
| `lookups:getColors` | CuttingStep1Form (for "إضافة لون" + intersection) | New channel |
| `distribution:getSizeSuggestions` | DistributeModal | Unchanged |

---

## Frontend Types (`frontend/features/lookups/lookups.types.ts`)

```ts
export interface LookupEntry {
  id: string;
  name: string;
  isPredefined: boolean;
  isActive: boolean;
  createdAt: number;
}

export type ItemType = LookupEntry;
export type Color = LookupEntry;
export type Unit = LookupEntry;

export interface CreateLookupPayload { name: string; }
export interface UpdateLookupPayload { id: string; name: string; }
export interface DeleteLookupPayload { id: string; }
```
