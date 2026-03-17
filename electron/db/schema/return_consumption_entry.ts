import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const return_consumption_entries = sqliteTable('return_consumption_entries', {
  id: text('id').primaryKey(),
  return_id: text('return_id').notNull(),
  stock_item_id: text('stock_item_id').notNull(),
  color: text('color'),
  quantity: real('quantity').notNull(),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export type ReturnConsumptionEntry = typeof return_consumption_entries.$inferSelect;
export type NewReturnConsumptionEntry = typeof return_consumption_entries.$inferInsert;
