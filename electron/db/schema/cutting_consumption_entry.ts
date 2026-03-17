import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { cuttingSessions } from './cutting_session';
import { stockItems } from './stock_item';

export const cuttingConsumptionEntries = sqliteTable('cutting_consumption_entries', {
  id: text('id').primaryKey(),
  session_id: text('session_id').notNull().references(() => cuttingSessions.id),
  stock_item_id: text('stock_item_id').notNull().references(() => stockItems.id),
  color: text('color'),
  quantity: real('quantity').notNull(),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});
export type CuttingConsumptionEntry = typeof cuttingConsumptionEntries.$inferSelect;
export type NewCuttingConsumptionEntry = typeof cuttingConsumptionEntries.$inferInsert;
