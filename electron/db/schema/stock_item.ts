import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const stockItems = sqliteTable('stock_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  unit: text('unit').notNull(),
  color: text('color'),
  image_path: text('image_path'),
  description: text('description'),
  notes: text('notes'),
  is_archived: integer('is_archived').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type StockItem = typeof stockItems.$inferSelect;
export type NewStockItem = typeof stockItems.$inferInsert;
