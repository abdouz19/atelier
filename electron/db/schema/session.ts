import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './user';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').unique().notNull(),
  last_accessed: integer('last_accessed', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date()),
  expires_at: integer('expires_at', { mode: 'timestamp_ms' }),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
