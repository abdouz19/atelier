/**
 * Pieces availability queries.
 */

/**
 * Get availability for a single model — (part, size, color) combinations with not_distributed count.
 * @param {import('better-sqlite3').Database} db
 * @param {string} modelName
 */
function getAvailabilityForModel(db, modelName) {
  return db.prepare(`
    SELECT
      cp.part_name,
      cp.size_label,
      cs.fabric_color AS color,
      SUM(CASE WHEN cp.status = 'not_distributed' THEN 1 ELSE 0 END) AS not_distributed_count
    FROM cutting_pieces cp
    JOIN cutting_sessions cs ON cs.id = cp.session_id
    WHERE cs.model_name = ?
    GROUP BY cp.part_name, cp.size_label, cs.fabric_color
    ORDER BY not_distributed_count DESC, cp.part_name, cp.size_label, cs.fabric_color
  `).all(modelName).map(r => ({
    partName: r.part_name,
    sizeLabel: r.size_label,
    color: r.color,
    notDistributedCount: r.not_distributed_count,
  }))
}

/**
 * Get full availability breakdown for all (model, part, size, color) combinations with optional filters.
 * @param {import('better-sqlite3').Database} db
 * @param {{ modelName?: string, sizeLabel?: string, color?: string }} filters
 */
function getAvailability(db, filters = {}) {
  const modelName = filters.modelName || null
  const sizeLabel = filters.sizeLabel || null
  const color = filters.color || null

  return db.prepare(`
    SELECT
      cs.model_name,
      cp.part_name,
      cp.size_label,
      cs.fabric_color AS color,
      COUNT(*) AS total_produced,
      SUM(CASE WHEN cp.status = 'not_distributed' THEN 1 ELSE 0 END) AS not_distributed,
      SUM(CASE WHEN cp.status = 'distributed' THEN 1 ELSE 0 END) AS in_distribution,
      SUM(CASE WHEN cp.status = 'returned' THEN 1 ELSE 0 END) AS returned
    FROM cutting_pieces cp
    JOIN cutting_sessions cs ON cs.id = cp.session_id
    WHERE (? IS NULL OR cs.model_name = ?)
      AND (? IS NULL OR cp.size_label = ?)
      AND (? IS NULL OR cs.fabric_color = ?)
    GROUP BY cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
    ORDER BY cs.model_name ASC, cp.part_name ASC, cp.size_label ASC, cs.fabric_color ASC
  `).all(modelName, modelName, sizeLabel, sizeLabel, color, color).map(r => ({
    modelName: r.model_name,
    partName: r.part_name,
    sizeLabel: r.size_label,
    color: r.color,
    totalProduced: r.total_produced,
    notDistributed: r.not_distributed,
    inDistribution: r.in_distribution,
    returned: r.returned,
  }))
}

/**
 * Get the low-stock threshold from app_settings. Inserts default of 5 if not present.
 * @param {import('better-sqlite3').Database} db
 */
function getLowStockThreshold(db) {
  db.prepare(`INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('low_stock_threshold', '5', ?)`).run(Date.now())
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'low_stock_threshold'`).get()
  return { threshold: parseInt(row.value, 10) }
}

/**
 * Set the low-stock threshold in app_settings.
 * @param {import('better-sqlite3').Database} db
 * @param {number} threshold
 */
function setLowStockThreshold(db, threshold) {
  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new Error('الحد الأدنى يجب أن يكون صفراً أو أكثر')
  }
  db.prepare(`INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('low_stock_threshold', ?, ?)`).run(String(threshold), Date.now())
}

/**
 * Get counts of zero-stock and low-stock combinations.
 * @param {import('better-sqlite3').Database} db
 * @param {number} threshold
 */
function getZeroAndLowStockCounts(db, threshold) {
  const rows = db.prepare(`
    SELECT
      SUM(CASE WHEN cp.status = 'not_distributed' THEN 1 ELSE 0 END) AS not_distributed
    FROM cutting_pieces cp
    JOIN cutting_sessions cs ON cs.id = cp.session_id
    GROUP BY cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
  `).all()

  let zeroCount = 0
  let lowCount = 0
  for (const row of rows) {
    if (row.not_distributed === 0) zeroCount++
    else if (row.not_distributed > 0 && row.not_distributed <= threshold) lowCount++
  }
  return { zeroStockCombosCount: zeroCount, lowStockCombosCount: lowCount }
}

/**
 * Get top-10 critical combinations (lowest not_distributed count).
 * @param {import('better-sqlite3').Database} db
 */
function getCriticalCombinations(db) {
  return db.prepare(`
    SELECT
      cs.model_name,
      cp.part_name,
      cp.size_label,
      cs.fabric_color AS color,
      SUM(CASE WHEN cp.status = 'not_distributed' THEN 1 ELSE 0 END) AS not_distributed
    FROM cutting_pieces cp
    JOIN cutting_sessions cs ON cs.id = cp.session_id
    GROUP BY cs.model_name, cp.part_name, cp.size_label, cs.fabric_color
    ORDER BY not_distributed ASC
    LIMIT 10
  `).all().map(r => ({
    modelName: r.model_name,
    partName: r.part_name,
    sizeLabel: r.size_label,
    color: r.color,
    notDistributed: r.not_distributed,
  }))
}

module.exports = {
  getAvailabilityForModel,
  getAvailability,
  getLowStockThreshold,
  setLowStockThreshold,
  getZeroAndLowStockCounts,
  getCriticalCombinations,
}
