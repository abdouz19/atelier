import { eq, sql, asc, desc } from 'drizzle-orm';
import { db } from '../../db/index';
import { stockItems, type StockItem, type NewStockItem } from '../../db/schema/stock_item';
import { stockTransactions, type StockTransaction, type NewStockTransaction } from '../../db/schema/stock_transaction';

export interface StockItemWithStats extends StockItem {
  total_quantity: number;
  variant_count: number;
}

// ── Items ──────────────────────────────────────────────────────────────────────

export function getAllActiveItems(): StockItemWithStats[] {
  return db
    .select({
      id: stockItems.id,
      name: stockItems.name,
      type: stockItems.type,
      unit: stockItems.unit,
      color: stockItems.color,
      image_path: stockItems.image_path,
      description: stockItems.description,
      notes: stockItems.notes,
      is_archived: stockItems.is_archived,
      created_at: stockItems.created_at,
      updated_at: stockItems.updated_at,
      total_quantity: sql<number>`COALESCE((
        SELECT SUM(CASE WHEN type = 'inbound' THEN quantity ELSE -quantity END)
        FROM stock_transactions WHERE stock_item_id = ${stockItems.id}
      ), 0)`,
      variant_count: sql<number>`COALESCE((
        SELECT COUNT(DISTINCT COALESCE(color, '__nocolor__'))
        FROM stock_transactions WHERE stock_item_id = ${stockItems.id}
      ), 1)`,
    })
    .from(stockItems)
    .where(eq(stockItems.is_archived, 0))
    .orderBy(asc(stockItems.name))
    .all();
}

export function getArchivedItems(): StockItemWithStats[] {
  return db
    .select({
      id: stockItems.id,
      name: stockItems.name,
      type: stockItems.type,
      unit: stockItems.unit,
      color: stockItems.color,
      image_path: stockItems.image_path,
      description: stockItems.description,
      notes: stockItems.notes,
      is_archived: stockItems.is_archived,
      created_at: stockItems.created_at,
      updated_at: stockItems.updated_at,
      total_quantity: sql<number>`COALESCE((
        SELECT SUM(CASE WHEN type = 'inbound' THEN quantity ELSE -quantity END)
        FROM stock_transactions WHERE stock_item_id = ${stockItems.id}
      ), 0)`,
      variant_count: sql<number>`COALESCE((
        SELECT COUNT(DISTINCT COALESCE(color, '__nocolor__'))
        FROM stock_transactions WHERE stock_item_id = ${stockItems.id}
      ), 1)`,
    })
    .from(stockItems)
    .where(eq(stockItems.is_archived, 1))
    .orderBy(asc(stockItems.name))
    .all();
}

export function getItemById(id: string): StockItem | undefined {
  return db.select().from(stockItems).where(eq(stockItems.id, id)).get();
}

export function insertStockItem(data: NewStockItem): StockItem {
  const now = new Date();
  db.insert(stockItems).values({ ...data, created_at: now, updated_at: now }).run();
  return db.select().from(stockItems).where(eq(stockItems.id, data.id!)).get()!;
}

export function updateStockItem(id: string, data: Partial<Omit<StockItem, 'id' | 'created_at'>>): void {
  db.update(stockItems)
    .set({ ...data, updated_at: new Date() })
    .where(eq(stockItems.id, id))
    .run();
}

export function setArchived(id: string, value: 0 | 1): void {
  db.update(stockItems)
    .set({ is_archived: value, updated_at: new Date() })
    .where(eq(stockItems.id, id))
    .run();
}

export function getDistinctTypes(): string[] {
  const rows = db
    .selectDistinct({ type: stockItems.type })
    .from(stockItems)
    .orderBy(asc(stockItems.type))
    .all();
  return rows.map((r) => r.type);
}

export function getDistinctUnits(): string[] {
  const rows = db
    .selectDistinct({ unit: stockItems.unit })
    .from(stockItems)
    .orderBy(asc(stockItems.unit))
    .all();
  return rows.map((r) => r.unit);
}

// ── Transactions ───────────────────────────────────────────────────────────────

export interface ColorVariantRow {
  color: string | null;
  quantity: number;
}

export function getVariantsForItem(stockItemId: string): ColorVariantRow[] {
  return db
    .select({
      color: stockTransactions.color,
      quantity: sql<number>`SUM(CASE WHEN type = 'inbound' THEN quantity ELSE -quantity END)`,
    })
    .from(stockTransactions)
    .where(eq(stockTransactions.stock_item_id, stockItemId))
    .groupBy(stockTransactions.color)
    .orderBy(asc(stockTransactions.color))
    .all();
}

export function getTransactionsForItem(stockItemId: string): StockTransaction[] {
  return db
    .select()
    .from(stockTransactions)
    .where(eq(stockTransactions.stock_item_id, stockItemId))
    .orderBy(desc(stockTransactions.transaction_date), desc(stockTransactions.created_at))
    .all();
}

export function insertTransaction(data: NewStockTransaction): StockTransaction {
  const now = new Date();
  db.insert(stockTransactions).values({ ...data, created_at: now, updated_at: now }).run();
  return db.select().from(stockTransactions).where(eq(stockTransactions.id, data.id!)).get()!;
}

export function updateTransaction(
  id: string,
  data: { quantity?: number; transaction_date?: Date },
): void {
  db.update(stockTransactions)
    .set({ ...data, updated_at: new Date() })
    .where(eq(stockTransactions.id, id))
    .run();
}

export function getTransactionById(id: string): StockTransaction | undefined {
  return db.select().from(stockTransactions).where(eq(stockTransactions.id, id)).get();
}

export function findActiveItemByName(name: string): StockItem | undefined {
  return db
    .select()
    .from(stockItems)
    .where(sql`LOWER(${stockItems.name}) = LOWER(${name}) AND ${stockItems.is_archived} = 0`)
    .get();
}
