import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role'),
  notes: text('notes'),
  photo_path: text('photo_path'),
  status: text('status').notNull().default('active'), // 'active' | 'inactive'
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
