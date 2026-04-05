const { randomUUID } = require('crypto')

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{
 *   returnId: string,
 *   employeeId: string,
 *   quantityReviewed: number,
 *   qtyDamaged: number,
 *   qtyAcceptable: number,
 *   qtyGood: number,
 *   qtyVeryGood: number,
 *   pricePerPiece: number,
 *   reviewDate: number,
 *   consumptionEntries?: Array<{ stockItemId: string, color?: string, quantity: number }>,
 *   materialBatchConsumptions?: Array<{ stockItemId: string, color?: string, batches: Array<{ transactionId: string, quantity: number, pricePerUnit: number }> }>
 * }} payload
 */
function createQcRecord(db, payload) {
  const {
    returnId,
    employeeId,
    quantityReviewed,
    qtyDamaged,
    qtyAcceptable,
    qtyGood,
    qtyVeryGood,
    pricePerPiece,
    reviewDate,
    consumptionEntries = [],
    materialBatchConsumptions = [],
  } = payload

  const gradeSum = qtyDamaged + qtyAcceptable + qtyGood + qtyVeryGood
  if (gradeSum > quantityReviewed) {
    throw new Error(`Grade sum (${gradeSum}) exceeds quantity reviewed (${quantityReviewed})`)
  }

  const availableRow = db.prepare(`
    SELECT rr.quantity_returned - COALESCE((SELECT SUM(qr.quantity_reviewed) FROM qc_records qr WHERE qr.return_id = rr.id), 0) AS available
    FROM return_records rr
    WHERE rr.id = ?
  `).get(returnId)

  if (!availableRow) throw new Error('Return record not found')
  if (quantityReviewed > availableRow.available) {
    throw new Error(`Quantity reviewed (${quantityReviewed}) exceeds available (${availableRow.available})`)
  }

  // Fetch cost_per_final_item from the linked distribution batch
  const batchRow = db.prepare(`
    SELECT db2.cost_per_final_item
    FROM return_records rr
    JOIN distribution_batches db2 ON db2.id = rr.batch_id
    WHERE rr.id = ?
  `).get(returnId)
  const costPerFinalItem = batchRow?.cost_per_final_item ?? 0

  // Compute materials cost from batch consumptions
  let materialsCost = 0
  for (const mc of materialBatchConsumptions) {
    for (const batch of mc.batches) {
      materialsCost += (batch.quantity ?? 0) * (batch.pricePerUnit ?? 0)
    }
  }
  materialsCost = Math.round(materialsCost * 100) / 100

  const materialsCostPerPiece = quantityReviewed > 0
    ? Math.round((materialsCost / quantityReviewed) * 100) / 100
    : 0

  const costPerPieceAfterQc = Math.round(
    ((costPerFinalItem ?? 0) + pricePerPiece + materialsCostPerPiece) * 100
  ) / 100

  const now = Date.now()
  const id = randomUUID()
  const totalCost = quantityReviewed * pricePerPiece

  const insertQc = db.prepare(`
    INSERT INTO qc_records (id, return_id, employee_id, quantity_reviewed, qty_damaged, qty_acceptable, qty_good, qty_very_good, price_per_piece, total_cost, materials_cost, materials_cost_per_piece, cost_per_piece_after_qc, review_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertConsumption = db.prepare(`
    INSERT INTO qc_consumption_entries (id, qc_id, stock_item_id, color, quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    insertQc.run(id, returnId, employeeId, quantityReviewed, qtyDamaged, qtyAcceptable, qtyGood, qtyVeryGood, pricePerPiece, totalCost, materialsCost, materialsCostPerPiece, costPerPieceAfterQc, reviewDate, now, now)
    for (const entry of consumptionEntries) {
      insertConsumption.run(randomUUID(), id, entry.stockItemId, entry.color ?? null, entry.quantity, now, now)
    }
    if (employeeId && pricePerPiece > 0) {
      db.prepare(`
        INSERT INTO employee_operations (id, employee_id, operation_type, source_module, source_reference_id, operation_date, quantity, price_per_unit, total_amount, notes, created_at, updated_at)
        VALUES (?, ?, 'qc', 'qc', ?, ?, ?, ?, ?, NULL, ?, ?)
      `).run(randomUUID(), employeeId, id, reviewDate, quantityReviewed, pricePerPiece, totalCost, now, now)
    }
  })()

  return { id }
}

module.exports = { createQcRecord }
