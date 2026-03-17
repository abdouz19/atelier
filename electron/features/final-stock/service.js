const finalStockQueries = require('./queries')

/**
 * @param {import('better-sqlite3').Database} db
 */
function getKpis(db) {
  return finalStockQueries.getKpis(db)
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ modelName?: string, sizeLabel?: string, color?: string }} filters
 */
function getRows(db, filters) {
  return finalStockQueries.getRows(db, filters)
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ modelName: string, partName: string|null, sizeLabel: string, color: string }} key
 */
function getHistory(db, key) {
  return finalStockQueries.getHistory(db, key)
}

module.exports = { getKpis, getRows, getHistory }
