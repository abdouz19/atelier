import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const distribution_piece_links = sqliteTable('distribution_piece_links', {
  id: text('id').primaryKey(),
  batch_id: text('batch_id').notNull(),
  piece_id: text('piece_id').notNull(),
  created_at: integer('created_at').notNull(),
});

export type DistributionPieceLink = typeof distribution_piece_links.$inferSelect;
export type NewDistributionPieceLink = typeof distribution_piece_links.$inferInsert;
