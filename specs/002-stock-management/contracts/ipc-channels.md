# IPC Channel Contracts: Stock Management

**Branch**: `002-stock-management` | **Date**: 2026-03-14

All channels follow the project convention:
- Defined as `const enum StockChannel` in `electron/ipc/stock.handler.ts`
- Exposed on `window.ipcBridge.stock.*` via `electron/preload/index.ts`
- All responses typed as `IpcResponse<T>` = `{ success: true; data: T } | { success: false; error: string }`

---

## Read Channels

### `stock:getAll`

Returns all active (non-archived) items with computed total quantity and variant summary.

**Payload**: none

**Response**: `IpcResponse<StockItemSummary[]>`

```typescript
interface StockItemSummary {
  id: string
  name: string
  type: string
  unit: string
  color: string | null           // item-level color label
  imagePath: string | null       // resolved absolute path
  description: string | null
  totalQuantity: number          // computed: sum(inbound) - sum(consumed)
  variantCount: number           // distinct color values in transactions (min 1)
  isLow: boolean                 // true if totalQuantity <= 0
}
```

---

### `stock:getArchived`

Returns all archived items.

**Payload**: none

**Response**: `IpcResponse<StockItemSummary[]>`

---

### `stock:getById`

Returns full item detail: attributes + variant quantities + transaction history.

**Payload**: `{ id: string }`

**Response**: `IpcResponse<StockItemDetail>`

```typescript
interface StockItemDetail {
  id: string
  name: string
  type: string
  unit: string
  color: string | null
  imagePath: string | null
  description: string | null
  notes: string | null
  isArchived: boolean
  totalQuantity: number
  variants: ColorVariant[]
  transactions: StockTransaction[]
}

interface ColorVariant {
  color: string | null           // null = default uncolored variant
  quantity: number               // computed for this color
  isLow: boolean
}

interface StockTransaction {
  id: string
  type: 'inbound' | 'consumed'
  quantity: number
  color: string | null
  transactionDate: number        // Unix timestamp ms
  notes: string | null
  sourceModule: string | null    // 'cutting' | 'distribution' | 'qc' | 'finition'
  sourceReferenceId: string | null
  createdAt: number
}
```

---

### `stock:getTypes`

Returns sorted distinct type values from all items (active + archived) for autocomplete.

**Payload**: none

**Response**: `IpcResponse<string[]>`

---

### `stock:getUnits`

Returns sorted distinct unit values from all items for autocomplete.

**Payload**: none

**Response**: `IpcResponse<string[]>`

---

## Write Channels

### `stock:create`

Creates a new stock item and records the initial quantity as the first inbound transaction.

**Payload**:

```typescript
interface CreateStockItemPayload {
  name: string                   // required, non-empty
  type: string                   // required, non-empty
  unit: string                   // required, non-empty
  initialQuantity: number        // required, > 0
  color?: string                 // optional
  imageData?: string             // optional, base64-encoded image data
  imageMimeType?: string         // optional, e.g. 'image/jpeg'
  description?: string
  notes?: string
}
```

**Response**: `IpcResponse<StockItemSummary>`

**Side effects**: Writes one `stock_items` row + one `stock_transactions` row (type='inbound', date=now, color from payload).

---

### `stock:update`

Updates item metadata. Quantity is not affected.

**Payload**:

```typescript
interface UpdateStockItemPayload {
  id: string
  name?: string
  type?: string
  unit?: string
  color?: string | null          // null clears the color label
  imageData?: string | null      // null removes the image
  imageMimeType?: string
  description?: string | null
  notes?: string | null
}
```

**Response**: `IpcResponse<StockItemSummary>`

---

### `stock:addInbound`

Records an incoming quantity as a new inbound transaction.

**Payload**:

```typescript
interface AddInboundPayload {
  stockItemId: string
  quantity: number               // required, > 0
  color?: string                 // optional
  transactionDate: number        // Unix timestamp ms, must be ≤ now
  notes?: string
}
```

**Response**: `IpcResponse<StockItemDetail>`

---

### `stock:updateTransaction`

Edits the quantity and/or date of an existing inbound transaction. Consumed transactions cannot be updated via this channel.

**Payload**:

```typescript
interface UpdateTransactionPayload {
  id: string                     // transaction id
  quantity?: number              // must be > 0 if provided
  transactionDate?: number       // Unix timestamp ms, must be ≤ now
}
```

**Response**: `IpcResponse<StockItemDetail>`

**Error cases**:
- Returns `{ success: false, error: '...' }` if transaction is of type `'consumed'`

---

### `stock:archive`

Soft-archives an item (sets `is_archived = 1`).

**Payload**: `{ id: string }`

**Response**: `IpcResponse<void>`

---

### `stock:restore`

Restores an archived item (sets `is_archived = 0`).

**Payload**: `{ id: string }`

**Response**: `IpcResponse<void>`

---

## Preload Bridge Extension

Add to `electron/preload/index.ts` under the `ipcBridge` object:

```typescript
stock: {
  getAll:            () => ipcRenderer.invoke('stock:getAll'),
  getArchived:       () => ipcRenderer.invoke('stock:getArchived'),
  getById:           (payload) => ipcRenderer.invoke('stock:getById', payload),
  getTypes:          () => ipcRenderer.invoke('stock:getTypes'),
  getUnits:          () => ipcRenderer.invoke('stock:getUnits'),
  create:            (payload) => ipcRenderer.invoke('stock:create', payload),
  update:            (payload) => ipcRenderer.invoke('stock:update', payload),
  addInbound:        (payload) => ipcRenderer.invoke('stock:addInbound', payload),
  updateTransaction: (payload) => ipcRenderer.invoke('stock:updateTransaction', payload),
  archive:           (payload) => ipcRenderer.invoke('stock:archive', payload),
  restore:           (payload) => ipcRenderer.invoke('stock:restore', payload),
}
```

## IPC Client Extension

Add to `frontend/lib/ipc-client.ts`:

```typescript
stock: {
  getAll:            () => window.ipcBridge.stock.getAll(),
  getArchived:       () => window.ipcBridge.stock.getArchived(),
  getById:           (payload) => window.ipcBridge.stock.getById(payload),
  getTypes:          () => window.ipcBridge.stock.getTypes(),
  getUnits:          () => window.ipcBridge.stock.getUnits(),
  create:            (payload) => window.ipcBridge.stock.create(payload),
  update:            (payload) => window.ipcBridge.stock.update(payload),
  addInbound:        (payload) => window.ipcBridge.stock.addInbound(payload),
  updateTransaction: (payload) => window.ipcBridge.stock.updateTransaction(payload),
  archive:           (payload) => window.ipcBridge.stock.archive(payload),
  restore:           (payload) => window.ipcBridge.stock.restore(payload),
}
```
