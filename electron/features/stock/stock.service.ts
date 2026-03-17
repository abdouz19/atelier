import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import * as queries from './stock.queries';

export interface StockItemSummary {
  id: string;
  name: string;
  type: string;
  unit: string;
  color: string | null;
  imagePath: string | null;
  description: string | null;
  totalQuantity: number;
  variantCount: number;
  isLow: boolean;
}

export interface ColorVariant {
  color: string | null;
  quantity: number;
  isLow: boolean;
}

export interface StockTransactionDto {
  id: string;
  type: 'inbound' | 'consumed';
  quantity: number;
  color: string | null;
  transactionDate: number;
  notes: string | null;
  sourceModule: string | null;
  sourceReferenceId: string | null;
  createdAt: number;
}

export interface StockItemDetail {
  id: string;
  name: string;
  type: string;
  unit: string;
  color: string | null;
  imagePath: string | null;
  description: string | null;
  notes: string | null;
  isArchived: boolean;
  totalQuantity: number;
  variants: ColorVariant[];
  transactions: StockTransactionDto[];
}

export interface CreateItemPayload {
  name: string;
  type: string;
  unit: string;
  initialQuantity: number;
  color?: string;
  imageData?: string;
  imageMimeType?: string;
  description?: string;
  notes?: string;
}

export interface UpdateItemPayload {
  id: string;
  name?: string;
  type?: string;
  unit?: string;
  color?: string | null;
  imageData?: string | null;
  imageMimeType?: string;
  description?: string | null;
  notes?: string | null;
}

export interface AddInboundPayload {
  stockItemId: string;
  quantity: number;
  color?: string;
  transactionDate: number;
  notes?: string;
}

export interface UpdateTransactionPayload {
  id: string;
  quantity?: number;
  transactionDate?: number;
}

// ── Image helpers ──────────────────────────────────────────────────────────────

function getImagesDir(): string {
  const dir = path.join(app.getPath('userData'), 'stock-images');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveImage(base64Data: string, mimeType: string): string {
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(getImagesDir(), filename);
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filepath, buffer);
  return filename;
}

function deleteImage(filename: string): void {
  try {
    const filepath = path.join(getImagesDir(), filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch {
    // Non-fatal: log but don't throw
  }
}

function resolveImagePath(filename: string | null): string | null {
  if (!filename) return null;
  return path.join(getImagesDir(), filename);
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function toSummary(row: queries.StockItemWithStats): StockItemSummary {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    unit: row.unit,
    color: row.color ?? null,
    imagePath: resolveImagePath(row.image_path ?? null),
    description: row.description ?? null,
    totalQuantity: row.total_quantity,
    variantCount: row.variant_count,
    isLow: row.total_quantity <= 0,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function getAll(): StockItemSummary[] {
  return queries.getAllActiveItems().map(toSummary);
}

export function getArchived(): StockItemSummary[] {
  return queries.getArchivedItems().map(toSummary);
}

export function getById(id: string): StockItemDetail {
  const item = queries.getItemById(id);
  if (!item) throw new Error('الصنف غير موجود');

  const variantRows = queries.getVariantsForItem(id);
  const txRows = queries.getTransactionsForItem(id);

  // If no transactions at all, show one default variant with 0 quantity
  const variants: ColorVariant[] =
    variantRows.length > 0
      ? variantRows.map((v) => ({ color: v.color, quantity: v.quantity, isLow: v.quantity <= 0 }))
      : [{ color: null, quantity: 0, isLow: true }];

  const totalQuantity = variants.reduce((sum, v) => sum + v.quantity, 0);

  const transactions: StockTransactionDto[] = txRows.map((t) => ({
    id: t.id,
    type: t.type as 'inbound' | 'consumed',
    quantity: t.quantity,
    color: t.color ?? null,
    transactionDate: t.transaction_date instanceof Date ? t.transaction_date.getTime() : Number(t.transaction_date),
    notes: t.notes ?? null,
    sourceModule: t.source_module ?? null,
    sourceReferenceId: t.source_reference_id ?? null,
    createdAt: t.created_at instanceof Date ? t.created_at.getTime() : Number(t.created_at),
  }));

  return {
    id: item.id,
    name: item.name,
    type: item.type,
    unit: item.unit,
    color: item.color ?? null,
    imagePath: resolveImagePath(item.image_path ?? null),
    description: item.description ?? null,
    notes: item.notes ?? null,
    isArchived: item.is_archived === 1,
    totalQuantity,
    variants,
    transactions,
  };
}

export function getTypes(): string[] {
  return queries.getDistinctTypes();
}

export function getUnits(): string[] {
  return queries.getDistinctUnits();
}

export function createItem(payload: CreateItemPayload): StockItemSummary {
  const name = payload.name.trim();
  const type = payload.type.trim();
  const unit = payload.unit.trim();

  if (!name) throw new Error('اسم الصنف مطلوب');
  if (!type) throw new Error('النوع مطلوب');
  if (!unit) throw new Error('الوحدة مطلوبة');
  if (!payload.initialQuantity || payload.initialQuantity <= 0) {
    throw new Error('الكمية الابتدائية يجب أن تكون أكبر من صفر');
  }

  let imagePath: string | undefined;
  if (payload.imageData && payload.imageMimeType) {
    imagePath = saveImage(payload.imageData, payload.imageMimeType);
  }

  const itemId = crypto.randomUUID();
  const now = new Date();

  queries.insertStockItem({
    id: itemId,
    name,
    type,
    unit,
    color: payload.color?.trim() || null,
    image_path: imagePath ?? null,
    description: payload.description?.trim() || null,
    notes: payload.notes?.trim() || null,
    is_archived: 0,
    created_at: now,
    updated_at: now,
  });

  queries.insertTransaction({
    id: crypto.randomUUID(),
    stock_item_id: itemId,
    type: 'inbound',
    quantity: payload.initialQuantity,
    color: payload.color?.trim() || null,
    transaction_date: now,
    notes: null,
    source_module: null,
    source_reference_id: null,
    created_at: now,
    updated_at: now,
  });

  const items = queries.getAllActiveItems();
  const created = items.find((i) => i.id === itemId);
  if (!created) throw new Error('فشل في إنشاء الصنف');
  return toSummary(created);
}

export function updateItem(payload: UpdateItemPayload): StockItemSummary {
  const item = queries.getItemById(payload.id);
  if (!item) throw new Error('الصنف غير موجود');

  const updates: Partial<typeof item> = {};

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (!name) throw new Error('اسم الصنف مطلوب');
    updates.name = name;
  }
  if (payload.type !== undefined) {
    const type = payload.type.trim();
    if (!type) throw new Error('النوع مطلوب');
    updates.type = type;
  }
  if (payload.unit !== undefined) {
    const unit = payload.unit.trim();
    if (!unit) throw new Error('الوحدة مطلوبة');
    updates.unit = unit;
  }
  if ('color' in payload) updates.color = payload.color?.trim() || null;
  if ('description' in payload) updates.description = payload.description?.trim() || null;
  if ('notes' in payload) updates.notes = payload.notes?.trim() || null;

  // Handle image update
  if ('imageData' in payload) {
    if (payload.imageData === null) {
      // Remove image
      if (item.image_path) deleteImage(item.image_path);
      updates.image_path = null;
    } else if (payload.imageData && payload.imageMimeType) {
      if (item.image_path) deleteImage(item.image_path);
      updates.image_path = saveImage(payload.imageData, payload.imageMimeType);
    }
  }

  queries.updateStockItem(payload.id, updates);

  const items = queries.getAllActiveItems();
  const updated = items.find((i) => i.id === payload.id);
  if (!updated) {
    // Item might be archived — just find it
    const archived = queries.getArchivedItems().find((i) => i.id === payload.id);
    if (archived) return toSummary(archived);
    throw new Error('الصنف غير موجود');
  }
  return toSummary(updated);
}

export function addInbound(payload: AddInboundPayload): StockItemDetail {
  const item = queries.getItemById(payload.stockItemId);
  if (!item) throw new Error('الصنف غير موجود');
  if (!payload.quantity || payload.quantity <= 0) {
    throw new Error('الكمية يجب أن تكون أكبر من صفر');
  }

  const txDate = new Date(payload.transactionDate);
  if (txDate > new Date()) throw new Error('لا يمكن تسجيل معاملة بتاريخ مستقبلي');

  const now = new Date();
  queries.insertTransaction({
    id: crypto.randomUUID(),
    stock_item_id: payload.stockItemId,
    type: 'inbound',
    quantity: payload.quantity,
    color: payload.color?.trim() || null,
    transaction_date: txDate,
    notes: payload.notes?.trim() || null,
    source_module: null,
    source_reference_id: null,
    created_at: now,
    updated_at: now,
  });

  return getById(payload.stockItemId);
}

export function updateTransaction(payload: UpdateTransactionPayload): StockItemDetail {
  const tx = queries.getTransactionById(payload.id);
  if (!tx) throw new Error('المعاملة غير موجودة');
  if (tx.type === 'consumed') throw new Error('لا يمكن تعديل معاملات الاستهلاك');

  if (payload.quantity !== undefined && payload.quantity <= 0) {
    throw new Error('الكمية يجب أن تكون أكبر من صفر');
  }

  const updates: { quantity?: number; transaction_date?: Date } = {};
  if (payload.quantity !== undefined) updates.quantity = payload.quantity;
  if (payload.transactionDate !== undefined) {
    const d = new Date(payload.transactionDate);
    if (d > new Date()) throw new Error('لا يمكن تسجيل معاملة بتاريخ مستقبلي');
    updates.transaction_date = d;
  }

  queries.updateTransaction(payload.id, updates);
  return getById(tx.stock_item_id);
}

export function archiveItem(id: string): void {
  const item = queries.getItemById(id);
  if (!item) throw new Error('الصنف غير موجود');
  queries.setArchived(id, 1);
}

export function restoreItem(id: string): void {
  const item = queries.getItemById(id);
  if (!item) throw new Error('الصنف غير موجود');
  queries.setArchived(id, 0);
}

export function checkDuplicateName(name: string, excludeId?: string): boolean {
  const existing = queries.findActiveItemByName(name);
  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}
