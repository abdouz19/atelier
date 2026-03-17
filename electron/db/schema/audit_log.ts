import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './user';

export type AuditEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_change';

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  user_id: text('user_id').references(() => users.id),
  event_type: text('event_type').$type<AuditEventType>().notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  metadata: text('metadata'),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
