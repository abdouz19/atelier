// Reference-only Drizzle schema — NOT executed at runtime
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const finalStockEntries = sqliteTable('final_stock_entries', {
  id: text('id').primaryKey(),
  modelName: text('model_name').notNull(),
  sizeLabel: text('size_label').notNull(),
  color: text('color').notNull(),
  quantity: integer('quantity').notNull(),
  sourceType: text('source_type').notNull(), // 'finition' | 'finition_step'
  sourceId: text('source_id').notNull(),
  entryDate: integer('entry_date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
