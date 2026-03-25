import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { cuttingSessions } from './cutting_session';

// Reference-only schema — not executed at runtime. Actual table managed by electron/main.js.
export const cuttingSessionParts = sqliteTable('cutting_session_parts', {
  id: text('id').primaryKey(),
  session_id: text('session_id').notNull().references(() => cuttingSessions.id),
  part_name: text('part_name').notNull(),
  count: integer('count').notNull(),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

export type CuttingSessionPart = typeof cuttingSessionParts.$inferSelect;
export type NewCuttingSessionPart = typeof cuttingSessionParts.$inferInsert;
