import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { distribution_batches } from './distribution_batch';

export const distributionBatchParts = sqliteTable('distribution_batch_parts', {
  id: text('id').primaryKey(),
  batch_id: text('batch_id').notNull().references(() => distribution_batches.id),
  part_name: text('part_name').notNull(),
  quantity: integer('quantity').notNull(),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export type DistributionBatchPart = typeof distributionBatchParts.$inferSelect;
export type NewDistributionBatchPart = typeof distributionBatchParts.$inferInsert;
