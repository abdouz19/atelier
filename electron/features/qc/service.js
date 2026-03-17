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
 *   consumptionEntries?: Array<{ stockItemId: string, color?: string, quantity: number }>
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

  const now = Date.now()
  const id = randomUUID()
  const totalCost = quantityReviewed * pricePerPiece

  const insertQc = db.prepare(`
    INSERT INTO qc_records (id, return_id, employee_id, quantity_reviewed, qty_damaged, qty_acceptable, qty_good, qty_very_good, price_per_piece, total_cost, review_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertConsumption = db.prepare(`
    INSERT INTO qc_consumption_entries (id, qc_id, stock_item_id, color, quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    insertQc.run(id, returnId, employeeId, quantityReviewed, qtyDamaged, qtyAcceptable, qtyGood, qtyVeryGood, pricePerPiece, totalCost, reviewDate, now, now)
    for (const entry of consumptionEntries) {
      insertConsumption.run(randomUUID(), id, entry.stockItemId, entry.color ?? null, entry.quantity, now, now)
    }
  })()

  return { id }
}

module.exports = { createQcRecord }
