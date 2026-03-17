import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { stockItems } from './stock_item';

export const cuttingSessions = sqliteTable('cutting_sessions', {
  id: text('id').primaryKey(),
  fabric_item_id: text('fabric_item_id').notNull().references(() => stockItems.id),
  fabric_color: text('fabric_color').notNull(),
  model_name: text('model_name').notNull(),
  meters_used: real('meters_used').notNull(),
  layers: integer('layers').notNull(),
  price_per_layer: real('price_per_layer').notNull(),
  session_date: integer('session_date').notNull(),
  notes: text('notes'),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});
export type CuttingSession = typeof cuttingSessions.$inferSelect;
export type NewCuttingSession = typeof cuttingSessions.$inferInsert;
