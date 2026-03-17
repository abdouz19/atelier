import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const distribution_batches = sqliteTable('distribution_batches', {
  id: text('id').primaryKey(),
  tailor_id: text('tailor_id').notNull(),
  model_name: text('model_name').notNull(),
  size_label: text('size_label').notNull(),
  color: text('color').notNull(),
  quantity: integer('quantity').notNull(),
  sewing_price_per_piece: real('sewing_price_per_piece').notNull(),
  total_cost: real('total_cost').notNull(),
  distribution_date: integer('distribution_date').notNull(),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export type DistributionBatch = typeof distribution_batches.$inferSelect;
export type NewDistributionBatch = typeof distribution_batches.$inferInsert;
