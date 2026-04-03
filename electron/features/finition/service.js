const { randomUUID } = require('crypto')

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{
 *   qcId: string,
 *   employeeId: string,
 *   quantity: number,
 *   pricePerPiece: number,
 *   finitionDate: number,
 *   consumptionEntries?: Array<{ stockItemId: string, color?: string, quantity: number }>
 * }} payload
 */
function createFinitionRecord(db, payload) {
  const { qcId, employeeId, quantity, pricePerPiece, finitionDate, consumptionEntries = [] } = payload

  const availableRow = db.prepare(`
    SELECT (qr.quantity_reviewed - qr.qty_damaged) -
      COALESCE((SELECT SUM(fr.quantity) FROM finition_records fr WHERE fr.qc_id = qr.id), 0) AS available
    FROM qc_records qr
    WHERE qr.id = ?
  `).get(qcId)

  if (!availableRow) throw new Error('سجل المراقبة غير موجود')
  if (quantity < 1) throw new Error('الكمية يجب أن تكون أكبر من صفر')
  if (quantity > availableRow.available) {
    throw new Error(`الكمية (${quantity}) تتجاوز المتاح للتشطيب (${availableRow.available})`)
  }

  const now = Date.now()
  const id = randomUUID()
  const totalCost = quantity * pricePerPiece

  const insertFinition = db.prepare(`
    INSERT INTO finition_records (id, qc_id, employee_id, quantity, price_per_piece, total_cost, finition_date, is_ready, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `)

  const insertConsumption = db.prepare(`
    INSERT INTO finition_consumption_entries (id, finition_id, stock_item_id, color, quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    insertFinition.run(id, qcId, employeeId, quantity, pricePerPiece, totalCost, finitionDate, now, now)
    for (const entry of consumptionEntries) {
      insertConsumption.run(randomUUID(), id, entry.stockItemId, entry.color ?? null, entry.quantity, now, now)
    }
  })()

  return { id }
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{
 *   finitionId: string,
 *   stepName: string,
 *   quantity: number,
 *   employeeId?: string,
 *   pricePerPiece?: number,
 *   stepDate: number,
 *   consumptionEntries?: Array<{ stockItemId: string, color?: string, quantity: number }>
 * }} payload
 */
function createFinitionStep(db, payload) {
  const { finitionId, stepName, quantity, employeeId, pricePerPiece, stepDate, consumptionEntries = [] } = payload

  const finitionRow = db.prepare('SELECT quantity FROM finition_records WHERE id = ?').get(finitionId)
  if (!finitionRow) throw new Error('سجل التشطيب غير موجود')
  if (quantity < 1) throw new Error('الكمية يجب أن تكون أكبر من صفر')
  if (quantity > finitionRow.quantity) {
    throw new Error(`الكمية (${quantity}) تتجاوز كمية التشطيب (${finitionRow.quantity})`)
  }

  const stepOrderRow = db.prepare(
    'SELECT COALESCE(MAX(step_order), 0) + 1 AS next FROM finition_steps WHERE finition_id = ?'
  ).get(finitionId)
  const stepOrder = stepOrderRow.next

  const now = Date.now()
  const id = randomUUID()
  const totalCost = pricePerPiece != null ? quantity * pricePerPiece : null

  const insertStep = db.prepare(`
    INSERT INTO finition_steps (id, finition_id, step_order, step_name, employee_id, quantity, price_per_piece, total_cost, step_date, is_ready, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `)

  const insertConsumption = db.prepare(`
    INSERT INTO finition_step_consumption_entries (id, step_id, stock_item_id, color, quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    insertStep.run(id, finitionId, stepOrder, stepName, employeeId ?? null, quantity, pricePerPiece ?? null, totalCost, stepDate, now, now)
    for (const entry of consumptionEntries) {
      insertConsumption.run(randomUUID(), id, entry.stockItemId, entry.color ?? null, entry.quantity, now, now)
    }
  })()

  return { id }
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{
 *   sourceType: 'finition' | 'finition_step',
 *   sourceId: string,
 *   modelName: string,
 *   partName?: string,
 *   sizeLabel: string,
 *   color: string,
 *   quantity: number,
 *   entryDate: number
 * }} payload
 */
function addToFinalStock(db, payload) {
  const { sourceType, sourceId, modelName, partName, sizeLabel, color, quantity, entryDate } = payload

  const now = Date.now()
  const id = randomUUID()

  db.transaction(() => {
    db.prepare(`
      INSERT INTO final_stock_entries (id, model_name, part_name, size_label, color, quantity, source_type, source_id, entry_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, modelName, partName ?? null, sizeLabel, color, quantity, sourceType, sourceId, entryDate, now, now)

    if (sourceType === 'finition') {
      db.prepare('UPDATE finition_records SET is_ready = 1, updated_at = ? WHERE id = ?').run(now, sourceId)
    } else {
      db.prepare('UPDATE finition_steps SET is_ready = 1, updated_at = ? WHERE id = ?').run(now, sourceId)
    }
  })()

  return { id }
}

module.exports = { createFinitionRecord, createFinitionStep, addToFinalStock }
