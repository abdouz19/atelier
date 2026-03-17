/**
 * Dashboard queries — all read-only, computed from existing production tables.
 */

/**
 * Snapshot KPIs — live state, never date-filtered.
 * @param {import('better-sqlite3').Database} db
 */
function getSnapshotKpis(db) {
  // Fabric items: stock_items WHERE unit='متر'
  const fabricRows = db.prepare(`
    SELECT
      si.id,
      si.name,
      COALESCE(SUM(CASE WHEN st.type = 'inbound' THEN st.quantity ELSE -st.quantity END), 0) AS available_meters
    FROM stock_items si
    LEFT JOIN stock_transactions st ON st.stock_item_id = si.id
    WHERE si.unit = 'متر' AND si.is_archived = 0
    GROUP BY si.id, si.name
    ORDER BY si.name
  `).all()

  const fabricItems = fabricRows.map(r => ({
    name: r.name,
    availableMeters: r.available_meters,
  }))

  // Zero-stock non-fabric items
  const zeroStockRow = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM (
      SELECT
        si.id,
        COALESCE(SUM(CASE WHEN st.type = 'inbound' THEN st.quantity ELSE -st.quantity END), 0) AS available_qty
      FROM stock_items si
      LEFT JOIN stock_transactions st ON st.stock_item_id = si.id
      WHERE si.unit != 'متر' AND si.is_archived = 0
      GROUP BY si.id
      HAVING available_qty <= 0
    )
  `).get()

  // Pipeline stages 1–2: cutting_pieces
  const piecesNotDistributed = db.prepare(
    `SELECT COUNT(*) AS cnt FROM cutting_pieces WHERE status = 'not_distributed'`
  ).get().cnt

  const piecesInDistribution = db.prepare(
    `SELECT COUNT(*) AS cnt FROM cutting_pieces WHERE status = 'distributed'`
  ).get().cnt

  // Pipeline stage 3: returned awaiting QC
  const qcPendingRow = db.prepare(`
    SELECT
      COALESCE(SUM(rr.quantity_returned), 0) - COALESCE(SUM(qr.quantity_reviewed), 0) AS pending
    FROM return_records rr
    LEFT JOIN qc_records qr ON qr.return_id = rr.id
  `).get()

  // Pipeline stage 4: QC complete, awaiting finition
  const finitionPendingRow = db.prepare(`
    SELECT
      COALESCE(SUM(qr.qty_acceptable + qr.qty_good + qr.qty_very_good), 0)
        - COALESCE(SUM(fr.quantity), 0) AS pending
    FROM qc_records qr
    LEFT JOIN finition_records fr ON fr.qc_id = qr.id
  `).get()

  // Pipeline stage 5: in finition (not yet ready)
  const piecesInFinitionRow = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) AS cnt FROM finition_records WHERE is_ready = 0
  `).get()

  // Pipeline stage 6: final stock
  const piecesInFinalStockRow = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) AS cnt FROM final_stock_entries
  `).get()

  // Active tailors with pending distributions
  const activeTailorsRow = db.prepare(`
    SELECT COUNT(DISTINCT db.tailor_id) AS cnt
    FROM distribution_batches db
    WHERE db.id IN (
      SELECT DISTINCT dpl.batch_id
      FROM distribution_piece_links dpl
      JOIN cutting_pieces cp ON cp.id = dpl.piece_id
      WHERE cp.status = 'distributed'
    )
  `).get()

  return {
    fabricItems,
    zeroStockNonFabricCount: zeroStockRow.cnt,
    piecesNotDistributed,
    piecesInDistribution,
    piecesAwaitingQc: Math.max(0, qcPendingRow.pending),
    piecesAwaitingFinition: Math.max(0, finitionPendingRow.pending),
    piecesInFinition: piecesInFinitionRow.cnt,
    piecesInFinalStock: piecesInFinalStockRow.cnt,
    activeTailorsWithPendingDistributions: activeTailorsRow.cnt,
  }
}

/**
 * Pipeline stages array (6 items, always present even if count = 0).
 * @param {import('better-sqlite3').Database} db
 * @returns {Array<{ label: string, count: number, href: string }>}
 */
function getPipelineStages(db, kpis) {
  return [
    { label: 'غير موزعة', count: kpis.piecesNotDistributed, href: '/cutting' },
    { label: 'في التوزيع', count: kpis.piecesInDistribution, href: '/distribution' },
    { label: 'مُعادة — بانتظار مراقبة', count: kpis.piecesAwaitingQc, href: '/distribution' },
    { label: 'جاهزة للتشطيب', count: kpis.piecesAwaitingFinition, href: '/qc' },
    { label: 'في التشطيب', count: kpis.piecesInFinition, href: '/qc' },
    { label: 'المخزون النهائي', count: kpis.piecesInFinalStock, href: '/final-stock' },
  ]
}

/**
 * Activity feed — last 20 operations across all operation types.
 * @param {import('better-sqlite3').Database} db
 * @returns {Array<{ id: string, type: string, modelName: string|null, eventDate: number }>}
 */
function getActivityFeed(db) {
  const rows = db.prepare(`
    SELECT 'cutting_session' AS type, cs.id, cs.model_name, cs.session_date AS event_date
    FROM cutting_sessions cs
    UNION ALL
    SELECT 'distribution', db.id, db.model_name, db.distribution_date
    FROM distribution_batches db
    UNION ALL
    SELECT 'return', rr.id, db.model_name, rr.return_date
    FROM return_records rr JOIN distribution_batches db ON db.id = rr.batch_id
    UNION ALL
    SELECT 'qc', qr.id, db.model_name, qr.review_date
    FROM qc_records qr
      JOIN return_records rr ON rr.id = qr.return_id
      JOIN distribution_batches db ON db.id = rr.batch_id
    UNION ALL
    SELECT 'finition', fr.id, db.model_name, fr.finition_date
    FROM finition_records fr
      JOIN qc_records qr ON qr.id = fr.qc_id
      JOIN return_records rr ON rr.id = qr.return_id
      JOIN distribution_batches db ON db.id = rr.batch_id
    UNION ALL
    SELECT 'final_stock', fse.id, fse.model_name, fse.entry_date
    FROM final_stock_entries fse
    ORDER BY event_date DESC LIMIT 20
  `).all()

  return rows.map(r => ({
    id: String(r.id),
    type: r.type,
    modelName: r.model_name ?? null,
    eventDate: r.event_date,
  }))
}

/**
 * Period KPIs — scoped by date range.
 * @param {import('better-sqlite3').Database} db
 * @param {{ startDate: number, endDate: number }} params
 */
function getPeriodKpis(db, { startDate, endDate }) {
  // Employee debt — NOT date-scoped (current state), positive balances only
  const debtRow = db.prepare(`
    SELECT COALESCE(SUM(balance), 0) AS total_debt
    FROM (
      SELECT
        e.id,
        COALESCE(SUM(eo.total_amount), 0) - COALESCE(SUM(ep.amount), 0) AS balance
      FROM employees e
      LEFT JOIN employee_operations eo ON eo.employee_id = e.id
      LEFT JOIN employee_payments ep ON ep.employee_id = e.id
      WHERE e.status = 'active'
      GROUP BY e.id
      HAVING balance > 0
    )
  `).get()

  // Purchases — date-scoped
  const purchasesRow = db.prepare(`
    SELECT COALESCE(SUM(total_price_paid), 0) AS total_purchases
    FROM stock_transactions
    WHERE type = 'inbound'
      AND total_price_paid IS NOT NULL
      AND transaction_date >= ?
      AND transaction_date <= ?
  `).get(startDate, endDate)

  return {
    totalEmployeeDebt: debtRow.total_debt,
    totalPurchases: purchasesRow.total_purchases,
  }
}

/**
 * Chart data — monthly production (12 months), top tailors (5), top models (5),
 * fabric consumption (6 months), employee debt.
 * @param {import('better-sqlite3').Database} db
 * @param {{ startDate: number, endDate: number, modelName?: string }} params
 */
function getChartData(db, { startDate, endDate, modelName }) {
  const model = modelName || null

  // 12-month start: 12 months ago from today (ms)
  const twelveMonthsAgo = Date.now() - 365 * 24 * 60 * 60 * 1000
  const sixMonthsAgo = Date.now() - 183 * 24 * 60 * 60 * 1000

  // Monthly production
  const productionRows = db.prepare(`
    SELECT
      strftime('%Y-%m', datetime(fse.entry_date / 1000, 'unixepoch')) AS month,
      SUM(fse.quantity) AS pieces
    FROM final_stock_entries fse
    WHERE fse.entry_date >= ?
      AND (? IS NULL OR fse.model_name = ?)
    GROUP BY month
    ORDER BY month ASC
  `).all(twelveMonthsAgo, model, model)

  const monthlyProduction = productionRows.map(r => ({
    month: r.month,
    pieces: r.pieces,
  }))

  // Top 5 tailors by returns
  const tailorRows = db.prepare(`
    SELECT t.name, SUM(rr.quantity_returned) AS returned
    FROM return_records rr
      JOIN distribution_batches db ON db.id = rr.batch_id
      JOIN tailors t ON t.id = db.tailor_id
    WHERE rr.return_date >= ? AND rr.return_date <= ?
      AND (? IS NULL OR db.model_name = ?)
    GROUP BY t.id, t.name
    ORDER BY returned DESC
    LIMIT 5
  `).all(startDate, endDate, model, model)

  const topTailors = tailorRows.map(r => ({
    name: r.name,
    returned: r.returned,
  }))

  // Top 5 models by final stock (not date/model filtered)
  const modelRows = db.prepare(`
    SELECT model_name, SUM(quantity) AS pieces
    FROM final_stock_entries
    GROUP BY model_name
    ORDER BY pieces DESC
    LIMIT 5
  `).all()

  const topModels = modelRows.map(r => ({
    modelName: r.model_name,
    pieces: r.pieces,
  }))

  // Fabric consumption (6 months) — raw rows, client pivots
  const fabricRows = db.prepare(`
    SELECT
      si.name AS fabric_name,
      strftime('%Y-%m', datetime(st.transaction_date / 1000, 'unixepoch')) AS month,
      SUM(st.quantity) AS meters_consumed
    FROM stock_transactions st
      JOIN stock_items si ON si.id = st.stock_item_id
    WHERE st.type = 'consumed'
      AND si.unit = 'متر'
      AND st.transaction_date >= ?
    GROUP BY si.id, month
    ORDER BY month ASC, si.name ASC
  `).all(sixMonthsAgo)

  const fabricConsumption = fabricRows.map(r => ({
    fabricName: r.fabric_name,
    month: r.month,
    metersConsumed: r.meters_consumed,
  }))

  // Employee debt chart (current state, positive only)
  const debtRows = db.prepare(`
    SELECT e.name,
      COALESCE(SUM(eo.total_amount), 0) - COALESCE(SUM(ep.amount), 0) AS balance
    FROM employees e
    LEFT JOIN employee_operations eo ON eo.employee_id = e.id
    LEFT JOIN employee_payments ep ON ep.employee_id = e.id
    WHERE e.status = 'active'
    GROUP BY e.id, e.name
    HAVING balance > 0
    ORDER BY balance DESC
  `).all()

  const employeeDebt = debtRows.map(r => ({
    name: r.name,
    balance: r.balance,
  }))

  // Monthly distributed (12 months, same model filter)
  const distributedRows = db.prepare(`
    SELECT
      strftime('%Y-%m', datetime(db.distribution_date / 1000, 'unixepoch')) AS month,
      SUM(db.quantity) AS distributed
    FROM distribution_batches db
    WHERE db.distribution_date >= ?
      AND (? IS NULL OR db.model_name = ?)
    GROUP BY month
    ORDER BY month ASC
  `).all(twelveMonthsAgo, model, model)

  const monthlyDistributed = distributedRows.map(r => ({
    month: r.month,
    distributed: r.distributed,
  }))

  return {
    monthlyProduction,
    monthlyDistributed,
    topTailors,
    topModels,
    fabricConsumption,
    employeeDebt,
  }
}

module.exports = {
  getSnapshotKpis,
  getPipelineStages,
  getActivityFeed,
  getPeriodKpis,
  getChartData,
}
