import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Reference-only schema — not executed at runtime. DB is managed by electron/main.js.
export const itemTypes = sqliteTable('item_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isPredefined: integer('is_predefined').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
