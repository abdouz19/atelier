import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { stockItems } from './stock_item';

export const stockTransactions = sqliteTable('stock_transactions', {
  id: text('id').primaryKey(),
  stock_item_id: text('stock_item_id').notNull().references(() => stockItems.id),
  type: text('type').notNull(), // 'inbound' | 'consumed'
  quantity: real('quantity').notNull(),
  color: text('color'),
  transaction_date: integer('transaction_date', { mode: 'timestamp_ms' }).notNull(),
  notes: text('notes'),
  source_module: text('source_module'), // 'cutting' | 'distribution' | 'qc' | 'finition'
  source_reference_id: text('source_reference_id'),
  model_name: text('model_name'), // populated for consumed transactions
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type StockTransaction = typeof stockTransactions.$inferSelect;
export type NewStockTransaction = typeof stockTransactions.$inferInsert;
