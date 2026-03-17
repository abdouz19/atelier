/**
 * @param {import('better-sqlite3').Database} db
 * @returns {{ totalPieces: number, totalDistinctModels: number, totalDistinctSizeColorCombos: number }}
 */
function getKpis(db) {
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(quantity), 0) AS total_pieces,
      COUNT(DISTINCT model_name) AS total_distinct_models,
      COUNT(DISTINCT size_label || '|' || color) AS total_distinct_size_color_combos
    FROM final_stock_entries
  `).get()

  return {
    totalPieces: row.total_pieces,
    totalDistinctModels: row.total_distinct_models,
    totalDistinctSizeColorCombos: row.total_distinct_size_color_combos,
  }
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ modelName?: string, sizeLabel?: string, color?: string }} filters
 * @returns {Array<{ modelName: string, partName: string|null, sizeLabel: string, color: string, currentQuantity: number, lastUpdatedDate: number }>}
 */
function getRows(db, filters) {
  const { modelName, sizeLabel, color } = filters ?? {}

  const rows = db.prepare(`
    SELECT
      model_name,
      part_name,
      size_label,
      color,
      SUM(quantity) AS current_quantity,
      MAX(entry_date) AS last_updated_date
    FROM final_stock_entries
    WHERE (? IS NULL OR model_name = ?)
      AND (? IS NULL OR size_label = ?)
      AND (? IS NULL OR color = ?)
    GROUP BY model_name, part_name, size_label, color
    ORDER BY model_name, part_name, size_label, color
  `).all(
    modelName || null, modelName || null,
    sizeLabel || null, sizeLabel || null,
    color || null, color || null,
  )

  return rows.map(r => ({
    modelName: r.model_name,
    partName: r.part_name ?? null,
    sizeLabel: r.size_label,
    color: r.color,
    currentQuantity: r.current_quantity,
    lastUpdatedDate: r.last_updated_date,
  }))
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ modelName: string, partName: string|null, sizeLabel: string, color: string }} key
 * @returns {Array<{ id: string, sourceType: string, sourceId: string, quantityAdded: number, entryDate: number }>}
 */
function getHistory(db, key) {
  const { modelName, partName, sizeLabel, color } = key

  const rows = db.prepare(`
    SELECT id, source_type, source_id, quantity, entry_date
    FROM final_stock_entries
    WHERE model_name = ?
      AND part_name IS ?
      AND size_label = ?
      AND color = ?
    ORDER BY entry_date ASC
  `).all(modelName, partName ?? null, sizeLabel, color)

  return rows.map(r => ({
    id: r.id,
    sourceType: r.source_type,
    sourceId: r.source_id,
    quantityAdded: r.quantity,
    entryDate: r.entry_date,
  }))
}

module.exports = { getKpis, getRows, getHistory }
