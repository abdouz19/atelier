/** @param {import('better-sqlite3').Database} db */
function getReturnBatchesForQc(db) {
  return db.prepare(`
    SELECT
      rr.id AS returnId,
      rr.batch_id AS batchId,
      t.name AS tailorName,
      db2.model_name AS modelName,
      db2.size_label AS sizeLabel,
      db2.color,
      rr.quantity_returned AS quantityReturned,
      COALESCE((SELECT SUM(qr.quantity_reviewed) FROM qc_records qr WHERE qr.return_id = rr.id), 0) AS quantityReviewed,
      rr.quantity_returned - COALESCE((SELECT SUM(qr.quantity_reviewed) FROM qc_records qr WHERE qr.return_id = rr.id), 0) AS quantityAvailable,
      rr.return_date AS returnDate
    FROM return_records rr
    JOIN distribution_batches db2 ON db2.id = rr.batch_id
    JOIN tailors t ON t.id = db2.tailor_id
    WHERE rr.quantity_returned - COALESCE((SELECT SUM(qr.quantity_reviewed) FROM qc_records qr WHERE qr.return_id = rr.id), 0) > 0
    ORDER BY rr.return_date DESC
  `).all()
}

/** @param {import('better-sqlite3').Database} db */
function getQcRecords(db) {
  const rows = db.prepare(`
    SELECT
      qr.id,
      qr.return_id AS returnId,
      t.name AS tailorName,
      db2.model_name AS modelName,
      db2.size_label AS sizeLabel,
      db2.color,
      e.name AS employeeName,
      qr.review_date AS reviewDate,
      qr.quantity_reviewed AS quantityReviewed,
      qr.qty_damaged AS qtyDamaged,
      qr.qty_acceptable AS qtyAcceptable,
      qr.qty_good AS qtyGood,
      qr.qty_very_good AS qtyVeryGood,
      qr.price_per_piece AS pricePerPiece,
      qr.total_cost AS totalCost,
      rr.quantity_returned AS totalReturned,
      COALESCE((SELECT SUM(q2.quantity_reviewed) FROM qc_records q2 WHERE q2.return_id = qr.return_id), 0) AS totalReviewed
    FROM qc_records qr
    JOIN return_records rr ON rr.id = qr.return_id
    JOIN distribution_batches db2 ON db2.id = rr.batch_id
    JOIN tailors t ON t.id = db2.tailor_id
    JOIN employees e ON e.id = qr.employee_id
    ORDER BY qr.review_date DESC
  `).all()

  return rows.map(r => ({
    ...r,
    batchStatus: r.totalReviewed >= r.totalReturned ? 'مكتمل' : 'جزئي',
  }))
}

/** @param {import('better-sqlite3').Database} db */
function getKpis(db) {
  const row = db.prepare(`
    SELECT
      (
        SELECT COALESCE(SUM(rr.quantity_returned), 0) - COALESCE((SELECT SUM(q.quantity_reviewed) FROM qc_records q), 0)
        FROM return_records rr
      ) AS pendingQc,
      COALESCE((SELECT SUM(quantity_reviewed) FROM qc_records), 0) AS totalReviewed,
      COALESCE((SELECT SUM(qty_damaged) FROM qc_records), 0) AS totalDamaged,
      COALESCE((SELECT SUM(qty_acceptable) FROM qc_records), 0) AS totalAcceptable,
      COALESCE((SELECT SUM(qty_good) FROM qc_records), 0) AS totalGood,
      COALESCE((SELECT SUM(qty_very_good) FROM qc_records), 0) AS totalVeryGood,
      COALESCE((SELECT SUM(fse.quantity) FROM final_stock_entries fse), 0) AS readyForStock
  `).get()

  // finitionPending: sum of finitionable per QC record minus already finitioned
  const finitionPendingRow = db.prepare(`
    SELECT COALESCE(SUM(
      (qr.qty_acceptable + qr.qty_good + qr.qty_very_good) -
      COALESCE((SELECT SUM(fr.quantity) FROM finition_records fr WHERE fr.qc_id = qr.id), 0)
    ), 0) AS finitionPending
    FROM qc_records qr
    WHERE (qr.qty_acceptable + qr.qty_good + qr.qty_very_good) -
      COALESCE((SELECT SUM(fr.quantity) FROM finition_records fr WHERE fr.qc_id = qr.id), 0) > 0
  `).get()

  return {
    pendingQc: Math.max(0, row.pendingQc ?? 0),
    totalReviewed: row.totalReviewed,
    totalDamaged: row.totalDamaged,
    totalAcceptable: row.totalAcceptable,
    totalGood: row.totalGood,
    totalVeryGood: row.totalVeryGood,
    finitionPending: finitionPendingRow.finitionPending,
    readyForStock: row.readyForStock,
  }
}

module.exports = { getReturnBatchesForQc, getQcRecords, getKpis }
