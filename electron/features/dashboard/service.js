const queries = require('./queries')
const piecesQueries = require('../pieces/queries')

/**
 * @param {import('better-sqlite3').Database} db
 */
function getSnapshotData(db) {
  const kpis = queries.getSnapshotKpis(db)
  const pipeline = queries.getPipelineStages(db, kpis)
  const activity = queries.getActivityFeed(db)
  const { threshold } = piecesQueries.getLowStockThreshold(db)
  const stockCounts = piecesQueries.getZeroAndLowStockCounts(db, threshold)
  const criticalCombinations = piecesQueries.getCriticalCombinations(db)
  return {
    kpis: { ...kpis, ...stockCounts },
    pipeline,
    activity,
    criticalCombinations,
  }
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ startDate: number, endDate: number }} payload
 */
function getPeriodKpis(db, payload) {
  return queries.getPeriodKpis(db, payload)
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {{ startDate: number, endDate: number, modelName?: string }} payload
 */
function getChartData(db, payload) {
  return queries.getChartData(db, payload)
}

module.exports = { getSnapshotData, getPeriodKpis, getChartData }
