/** @param {import('better-sqlite3').Database} db */
function getQcRecordsForFinition(db) {
  const rows = db.prepare(`
    SELECT
      qr.id AS qcId,
      qr.return_id AS returnId,
      t.name AS tailorName,
      db2.model_name AS modelName,
      db2.size_label AS sizeLabel,
      db2.color,
      qr.review_date AS reviewDate,
      (qr.qty_acceptable + qr.qty_good + qr.qty_very_good) AS finitionableTotal,
      COALESCE((SELECT SUM(fr.quantity) FROM finition_records fr WHERE fr.qc_id = qr.id), 0) AS finitionedSoFar
    FROM qc_records qr
    JOIN return_records rr ON rr.id = qr.return_id
    JOIN distribution_batches db2 ON db2.id = rr.batch_id
    JOIN tailors t ON t.id = db2.tailor_id
    WHERE (qr.qty_acceptable + qr.qty_good + qr.qty_very_good) -
      COALESCE((SELECT SUM(fr.quantity) FROM finition_records fr WHERE fr.qc_id = qr.id), 0) > 0
    ORDER BY qr.review_date DESC
  `).all()

  return rows.map(r => ({
    ...r,
    finitionableRemaining: r.finitionableTotal - r.finitionedSoFar,
  }))
}

/** @param {import('better-sqlite3').Database} db */
function getFinitionRecords(db) {
  const records = db.prepare(`
    SELECT
      fr.id,
      fr.qc_id AS qcId,
      db2.model_name AS modelName,
      db2.size_label AS sizeLabel,
      db2.color,
      e.name AS employeeName,
      fr.finition_date AS finitionDate,
      fr.quantity,
      fr.price_per_piece AS pricePerPiece,
      fr.total_cost AS totalCost,
      fr.is_ready AS isReady
    FROM finition_records fr
    JOIN qc_records qr ON qr.id = fr.qc_id
    JOIN return_records rr ON rr.id = qr.return_id
    JOIN distribution_batches db2 ON db2.id = rr.batch_id
    JOIN employees e ON e.id = fr.employee_id
    ORDER BY fr.finition_date DESC
  `).all()

  const stepsStmt = db.prepare(`
    SELECT
      fs.id,
      fs.finition_id AS finitionId,
      fs.step_order AS stepOrder,
      fs.step_name AS stepName,
      e.name AS employeeName,
      fs.quantity,
      fs.step_date AS stepDate,
      fs.is_ready AS isReady
    FROM finition_steps fs
    LEFT JOIN employees e ON e.id = fs.employee_id
    WHERE fs.finition_id = ?
    ORDER BY fs.step_order ASC
  `)

  return records.map(r => ({
    ...r,
    isReady: r.isReady === 1,
    steps: stepsStmt.all(r.id).map(s => ({ ...s, isReady: s.isReady === 1 })),
  }))
}

module.exports = { getQcRecordsForFinition, getFinitionRecords }
