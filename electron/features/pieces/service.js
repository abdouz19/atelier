const queries = require('./queries')

/**
 * @param {import('better-sqlite3').Database} db
 * @param {string} modelName
 */
function getAvailabilityForModel(db, modelName) {
  return queries.getAvailabilityForModel(db, modelName)
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {object} filters
 */
function getAvailability(db, filters) {
  return queries.getAvailability(db, filters)
}

/**
 * @param {import('better-sqlite3').Database} db
 */
function getLowStockThreshold(db) {
  return queries.getLowStockThreshold(db)
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {number} threshold
 */
function setLowStockThreshold(db, threshold) {
  return queries.setLowStockThreshold(db, threshold)
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {number} threshold
 */
function getZeroAndLowStockCounts(db, threshold) {
  return queries.getZeroAndLowStockCounts(db, threshold)
}

/**
 * @param {import('better-sqlite3').Database} db
 */
function getCriticalCombinations(db) {
  return queries.getCriticalCombinations(db)
}

module.exports = {
  getAvailabilityForModel,
  getAvailability,
  getLowStockThreshold,
  setLowStockThreshold,
  getZeroAndLowStockCounts,
  getCriticalCombinations,
}
