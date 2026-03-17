import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { cuttingSessions } from './cutting_session';

export const cuttingPieces = sqliteTable('cutting_pieces', {
  id: text('id').primaryKey(),
  session_id: text('session_id').notNull().references(() => cuttingSessions.id),
  size_label: text('size_label').notNull(),
  part_name: text('part_name'),
  color: text('color'),
  status: text('status').notNull().default('not_distributed'),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});
export type CuttingPiece = typeof cuttingPieces.$inferSelect;
export type NewCuttingPiece = typeof cuttingPieces.$inferInsert;
