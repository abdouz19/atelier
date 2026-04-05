const { randomUUID } = require('crypto')

/**
 * @param {Array<{ batches: Array<{ quantity: number, pricePerUnit: number }> }>} materialBatchConsumptions
 * @returns {number}
 */
function computeMaterialsCost(materialBatchConsumptions) {
  let total = 0
  for (const mc of materialBatchConsumptions) {
    for (const batch of mc.batches) {
      total += (batch.quantity ?? 0) * (batch.pricePerUnit ?? 0)
    }
  }
  return Math.round(total * 100) / 100
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{
 *   qcId: string,
 *   employeeId: string,
 *   quantity: number,
 *   pricePerPiece: number,
 *   finitionDate: number,
 *   consumptionEntries?: Array<{ stockItemId: string, color?: string, quantity: number }>,
 *   materialBatchConsumptions?: Array<{ stockItemId: string, color?: string, batches: Array<{ transactionId: string, quantity: number, pricePerUnit: number }> }>
 * }} payload
 */
function createFinitionRecord(db, payload) {
  const { qcId, employeeId, quantity, pricePerPiece, finitionDate, consumptionEntries = [], materialBatchConsumptions = [] } = payload

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

  // Fetch cost_per_piece_after_qc from the linked QC record
  const qcRow = db.prepare('SELECT cost_per_piece_after_qc FROM qc_records WHERE id = ?').get(qcId)
  const costPerPieceAfterQc = qcRow?.cost_per_piece_after_qc ?? 0

  const materialsCost = computeMaterialsCost(materialBatchConsumptions)
  const materialsCostPerPiece = quantity > 0
    ? Math.round((materialsCost / quantity) * 100) / 100
    : 0
  const finalCostPerPiece = Math.round(
    ((costPerPieceAfterQc ?? 0) + pricePerPiece + materialsCostPerPiece) * 100
  ) / 100

  const now = Date.now()
  const id = randomUUID()
  const totalCost = quantity * pricePerPiece

  const insertFinition = db.prepare(`
    INSERT INTO finition_records (id, qc_id, employee_id, quantity, price_per_piece, total_cost, materials_cost, materials_cost_per_piece, final_cost_per_piece, finition_date, is_ready, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `)

  const insertConsumption = db.prepare(`
    INSERT INTO finition_consumption_entries (id, finition_id, stock_item_id, color, quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    insertFinition.run(id, qcId, employeeId, quantity, pricePerPiece, totalCost, materialsCost, materialsCostPerPiece, finalCostPerPiece, finitionDate, now, now)
    for (const entry of consumptionEntries) {
      insertConsumption.run(randomUUID(), id, entry.stockItemId, entry.color ?? null, entry.quantity, now, now)
    }
    if (employeeId && pricePerPiece > 0) {
      db.prepare(`
        INSERT INTO employee_operations (id, employee_id, operation_type, source_module, source_reference_id, operation_date, quantity, price_per_unit, total_amount, notes, created_at, updated_at)
        VALUES (?, ?, 'finition', 'finition', ?, ?, ?, ?, ?, NULL, ?, ?)
      `).run(randomUUID(), employeeId, id, finitionDate, quantity, pricePerPiece, totalCost, now, now)
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
 *   consumptionEntries?: Array<{ stockItemId: string, color?: string, quantity: number }>,
 *   materialBatchConsumptions?: Array<{ stockItemId: string, color?: string, batches: Array<{ transactionId: string, quantity: number, pricePerUnit: number }> }>
 * }} payload
 */
function createFinitionStep(db, payload) {
  const { finitionId, stepName, quantity, employeeId, pricePerPiece, stepDate, consumptionEntries = [], materialBatchConsumptions = [] } = payload

  const finitionRow = db.prepare('SELECT quantity, final_cost_per_piece FROM finition_records WHERE id = ?').get(finitionId)
  if (!finitionRow) throw new Error('سجل التشطيب غير موجود')
  if (quantity < 1) throw new Error('الكمية يجب أن تكون أكبر من صفر')
  if (quantity > finitionRow.quantity) {
    throw new Error(`الكمية (${quantity}) تتجاوز كمية التشطيب (${finitionRow.quantity})`)
  }

  const stepOrderRow = db.prepare(
    'SELECT COALESCE(MAX(step_order), 0) + 1 AS next FROM finition_steps WHERE finition_id = ?'
  ).get(finitionId)
  const stepOrder = stepOrderRow.next

  // Determine incoming cost: use previous step's cost_after_step if exists, else finition.final_cost_per_piece
  let incomingCost = finitionRow.final_cost_per_piece ?? 0
  if (stepOrder > 1) {
    const prevStepRow = db.prepare(
      'SELECT cost_after_step FROM finition_steps WHERE finition_id = ? ORDER BY step_order DESC LIMIT 1'
    ).get(finitionId)
    if (prevStepRow?.cost_after_step != null) {
      incomingCost = prevStepRow.cost_after_step
    }
  }

  const materialsCost = computeMaterialsCost(materialBatchConsumptions)
  const materialsCostPerPiece = quantity > 0
    ? Math.round((materialsCost / quantity) * 100) / 100
    : 0
  const stepPricePerPiece = pricePerPiece ?? 0
  const costAfterStep = Math.round(
    (incomingCost + stepPricePerPiece + materialsCostPerPiece) * 100
  ) / 100

  const now = Date.now()
  const id = randomUUID()
  const totalCost = pricePerPiece != null ? quantity * pricePerPiece : null

  const insertStep = db.prepare(`
    INSERT INTO finition_steps (id, finition_id, step_order, step_name, employee_id, quantity, price_per_piece, total_cost, materials_cost, materials_cost_per_piece, cost_after_step, step_date, is_ready, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `)

  const insertConsumption = db.prepare(`
    INSERT INTO finition_step_consumption_entries (id, step_id, stock_item_id, color, quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    insertStep.run(id, finitionId, stepOrder, stepName, employeeId ?? null, quantity, pricePerPiece ?? null, totalCost, materialsCost, materialsCostPerPiece, costAfterStep, stepDate, now, now)
    for (const entry of consumptionEntries) {
      insertConsumption.run(randomUUID(), id, entry.stockItemId, entry.color ?? null, entry.quantity, now, now)
    }
    if (employeeId && pricePerPiece != null && pricePerPiece > 0 && totalCost != null) {
      db.prepare(`
        INSERT INTO employee_operations (id, employee_id, operation_type, source_module, source_reference_id, operation_date, quantity, price_per_unit, total_amount, notes, created_at, updated_at)
        VALUES (?, ?, 'finition_step', 'finition', ?, ?, ?, ?, ?, NULL, ?, ?)
      `).run(randomUUID(), employeeId, id, stepDate, quantity, pricePerPiece, totalCost, now, now)
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

  // Look up the final cost per piece from the source record
  let finalCostPerPiece = null
  if (sourceType === 'finition') {
    const row = db.prepare('SELECT final_cost_per_piece FROM finition_records WHERE id = ?').get(sourceId)
    finalCostPerPiece = row?.final_cost_per_piece ?? null
  } else {
    const row = db.prepare('SELECT cost_after_step FROM finition_steps WHERE id = ?').get(sourceId)
    finalCostPerPiece = row?.cost_after_step ?? null
  }

  const now = Date.now()
  const id = randomUUID()

  db.transaction(() => {
    db.prepare(`
      INSERT INTO final_stock_entries (id, model_name, part_name, size_label, color, quantity, final_cost_per_piece, source_type, source_id, entry_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, modelName, partName ?? null, sizeLabel, color, quantity, finalCostPerPiece, sourceType, sourceId, entryDate, now, now)

    if (sourceType === 'finition') {
      db.prepare('UPDATE finition_records SET is_ready = 1, updated_at = ? WHERE id = ?').run(now, sourceId)
    } else {
      db.prepare('UPDATE finition_steps SET is_ready = 1, updated_at = ? WHERE id = ?').run(now, sourceId)
    }
  })()

  return { id }
}

module.exports = { createFinitionRecord, createFinitionStep, addToFinalStock }
