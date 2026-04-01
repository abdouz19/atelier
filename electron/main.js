const { app, BrowserWindow, ipcMain, protocol, net } = require('electron')
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const argon2 = require('argon2')
const crypto = require('crypto')

const isDev = process.env.NODE_ENV === 'development'

const qcQueries = require('./features/qc/queries')
const qcService = require('./features/qc/service')
const finitionQueries = require('./features/finition/queries')
const finitionService = require('./features/finition/service')
const finalStockService = require('./features/final-stock/service')
const dashboardService = require('./features/dashboard/service')
const piecesService = require('./features/pieces/service')
const settingsQueries = require('./features/settings/queries')
const settingsService = require('./features/settings/service')

/** @type {import('better-sqlite3').Database} */
let db
let currentToken = null

// ─── Database ───────────────────────────────────────────────────────────────

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'atelier.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      avatar_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT UNIQUE NOT NULL,
      last_accessed INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      event_type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      unit TEXT NOT NULL,
      color TEXT,
      image_path TEXT,
      description TEXT,
      notes TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_transactions (
      id TEXT PRIMARY KEY,
      stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
      type TEXT NOT NULL CHECK (type IN ('inbound', 'consumed')),
      quantity REAL NOT NULL CHECK (quantity > 0),
      color TEXT,
      transaction_date INTEGER NOT NULL,
      notes TEXT,
      source_module TEXT,
      source_reference_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stock_tx_item ON stock_transactions(stock_item_id);
    CREATE INDEX IF NOT EXISTS idx_stock_tx_date ON stock_transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_stock_items_archived ON stock_items(is_archived);
    CREATE INDEX IF NOT EXISTS idx_stock_items_type ON stock_items(type);

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      products_sold TEXT,
      notes TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
  `)

  // Extend stock_transactions with supplier/price columns (idempotent)
  for (const col of [
    'supplier_id TEXT REFERENCES suppliers(id)',
    'supplier_name TEXT',
    'price_per_unit REAL',
    'total_price_paid REAL',
  ]) {
    try { db.exec(`ALTER TABLE stock_transactions ADD COLUMN ${col}`) } catch (_) {}
  }
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_stock_tx_supplier ON stock_transactions(supplier_id)') } catch (_) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT,
      notes TEXT,
      photo_path TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

    CREATE TABLE IF NOT EXISTS employee_operations (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      operation_type TEXT NOT NULL,
      source_module TEXT,
      source_reference_id TEXT,
      operation_date INTEGER NOT NULL,
      quantity REAL NOT NULL,
      price_per_unit REAL NOT NULL,
      total_amount REAL NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_employee_ops_employee_date ON employee_operations(employee_id, operation_date);

    CREATE TABLE IF NOT EXISTS employee_payments (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL REFERENCES employees(id),
      amount REAL NOT NULL,
      payment_date INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_employee_payments_employee_date ON employee_payments(employee_id, payment_date);
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS cutting_sessions (
      id TEXT PRIMARY KEY,
      fabric_item_id TEXT NOT NULL REFERENCES stock_items(id),
      fabric_color TEXT NOT NULL,
      model_name TEXT NOT NULL,
      meters_used REAL NOT NULL CHECK (meters_used > 0),
      layers INTEGER NOT NULL CHECK (layers > 0),
      price_per_layer REAL NOT NULL CHECK (price_per_layer > 0),
      session_date INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cutting_sessions_date ON cutting_sessions(session_date);
    CREATE INDEX IF NOT EXISTS idx_cutting_sessions_fabric ON cutting_sessions(fabric_item_id);

    CREATE TABLE IF NOT EXISTS cutting_pieces (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES cutting_sessions(id),
      size_label TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_distributed',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cutting_pieces_session ON cutting_pieces(session_id);
    CREATE INDEX IF NOT EXISTS idx_cutting_pieces_status ON cutting_pieces(status);

    CREATE TABLE IF NOT EXISTS cutting_consumption_entries (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES cutting_sessions(id),
      stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
      color TEXT,
      quantity REAL NOT NULL CHECK (quantity > 0),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cutting_consumption_session ON cutting_consumption_entries(session_id);
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS tailors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tailors_status ON tailors(status);

    CREATE TABLE IF NOT EXISTS tailor_payments (
      id TEXT PRIMARY KEY,
      tailor_id TEXT NOT NULL REFERENCES tailors(id),
      amount REAL NOT NULL CHECK (amount > 0),
      payment_date INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tailor_payments_tailor ON tailor_payments(tailor_id);

    CREATE TABLE IF NOT EXISTS distribution_batches (
      id TEXT PRIMARY KEY,
      tailor_id TEXT NOT NULL REFERENCES tailors(id),
      model_name TEXT NOT NULL,
      size_label TEXT NOT NULL,
      color TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      sewing_price_per_piece REAL NOT NULL CHECK (sewing_price_per_piece > 0),
      total_cost REAL NOT NULL CHECK (total_cost > 0),
      distribution_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_distribution_batches_tailor ON distribution_batches(tailor_id);
    CREATE INDEX IF NOT EXISTS idx_distribution_batches_date ON distribution_batches(distribution_date);

    CREATE TABLE IF NOT EXISTS distribution_piece_links (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES distribution_batches(id),
      piece_id TEXT NOT NULL REFERENCES cutting_pieces(id),
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_dist_piece_links_batch ON distribution_piece_links(batch_id);
    CREATE INDEX IF NOT EXISTS idx_dist_piece_links_piece ON distribution_piece_links(piece_id);

    CREATE TABLE IF NOT EXISTS return_records (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES distribution_batches(id),
      quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
      return_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_return_records_batch ON return_records(batch_id);

    CREATE TABLE IF NOT EXISTS return_consumption_entries (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL REFERENCES return_records(id),
      stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
      color TEXT,
      quantity REAL NOT NULL CHECK (quantity > 0),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_return_consumption_return ON return_consumption_entries(return_id);

    CREATE TABLE IF NOT EXISTS qc_records (
      id TEXT PRIMARY KEY,
      return_id TEXT NOT NULL REFERENCES return_records(id),
      employee_id TEXT NOT NULL REFERENCES employees(id),
      quantity_reviewed INTEGER NOT NULL CHECK (quantity_reviewed > 0),
      qty_damaged INTEGER NOT NULL DEFAULT 0 CHECK (qty_damaged >= 0),
      qty_acceptable INTEGER NOT NULL DEFAULT 0 CHECK (qty_acceptable >= 0),
      qty_good INTEGER NOT NULL DEFAULT 0 CHECK (qty_good >= 0),
      qty_very_good INTEGER NOT NULL DEFAULT 0 CHECK (qty_very_good >= 0),
      price_per_piece REAL NOT NULL CHECK (price_per_piece > 0),
      total_cost REAL NOT NULL CHECK (total_cost > 0),
      review_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_qc_records_return ON qc_records(return_id);
    CREATE INDEX IF NOT EXISTS idx_qc_records_date ON qc_records(review_date);

    CREATE TABLE IF NOT EXISTS qc_consumption_entries (
      id TEXT PRIMARY KEY,
      qc_id TEXT NOT NULL REFERENCES qc_records(id),
      stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
      color TEXT,
      quantity REAL NOT NULL CHECK (quantity > 0),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_qc_consumption_qc ON qc_consumption_entries(qc_id);

    CREATE TABLE IF NOT EXISTS finition_records (
      id TEXT PRIMARY KEY,
      qc_id TEXT NOT NULL REFERENCES qc_records(id),
      employee_id TEXT NOT NULL REFERENCES employees(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      price_per_piece REAL NOT NULL CHECK (price_per_piece > 0),
      total_cost REAL NOT NULL CHECK (total_cost > 0),
      finition_date INTEGER NOT NULL,
      is_ready INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_finition_records_qc ON finition_records(qc_id);
    CREATE INDEX IF NOT EXISTS idx_finition_records_date ON finition_records(finition_date);

    CREATE TABLE IF NOT EXISTS finition_consumption_entries (
      id TEXT PRIMARY KEY,
      finition_id TEXT NOT NULL REFERENCES finition_records(id),
      stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
      color TEXT,
      quantity REAL NOT NULL CHECK (quantity > 0),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_finition_consumption_finition ON finition_consumption_entries(finition_id);

    CREATE TABLE IF NOT EXISTS finition_steps (
      id TEXT PRIMARY KEY,
      finition_id TEXT NOT NULL REFERENCES finition_records(id),
      step_order INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      employee_id TEXT REFERENCES employees(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      price_per_piece REAL,
      total_cost REAL,
      step_date INTEGER NOT NULL,
      is_ready INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_finition_steps_finition ON finition_steps(finition_id);

    CREATE TABLE IF NOT EXISTS finition_step_consumption_entries (
      id TEXT PRIMARY KEY,
      step_id TEXT NOT NULL REFERENCES finition_steps(id),
      stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
      color TEXT,
      quantity REAL NOT NULL CHECK (quantity > 0),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_finition_step_consumption_step ON finition_step_consumption_entries(step_id);

    CREATE TABLE IF NOT EXISTS final_stock_entries (
      id TEXT PRIMARY KEY,
      model_name TEXT NOT NULL,
      size_label TEXT NOT NULL,
      color TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      entry_date INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_final_stock_model ON final_stock_entries(model_name, size_label, color);
    CREATE INDEX IF NOT EXISTS idx_final_stock_source ON final_stock_entries(source_type, source_id);
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS item_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_predefined INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_item_types_active ON item_types(is_active);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_item_types_name ON item_types(LOWER(name));

    CREATE TABLE IF NOT EXISTS colors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_predefined INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_colors_active ON colors(is_active);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_colors_name ON colors(LOWER(name));

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_predefined INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_units_active ON units(is_active);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_units_name ON units(LOWER(name));
  `)

  // Models, Parts, Sizes lookup tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_predefined INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_models_active ON models(is_active);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_models_name ON models(LOWER(name));

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_predefined INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_parts_active ON parts(is_active);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_name ON parts(LOWER(name));

    CREATE TABLE IF NOT EXISTS sizes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_predefined INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sizes_active ON sizes(is_active);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sizes_name ON sizes(LOWER(name));
  `)

  // Add context columns to existing tables (idempotent)
  for (const stmt of [
    'ALTER TABLE cutting_pieces ADD COLUMN part_name TEXT',
    'ALTER TABLE cutting_pieces ADD COLUMN color TEXT',
    'ALTER TABLE employee_operations ADD COLUMN model_name TEXT',
    'ALTER TABLE employee_operations ADD COLUMN part_name TEXT',
    'ALTER TABLE employee_operations ADD COLUMN color TEXT',
    'ALTER TABLE stock_transactions ADD COLUMN model_name TEXT',
    'ALTER TABLE final_stock_entries ADD COLUMN part_name TEXT',
    'ALTER TABLE distribution_batches ADD COLUMN part_name TEXT',
  ]) {
    try { db.exec(stmt) } catch (_) {}
  }

  // App settings table (idempotent)
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // 013-parts-distribution-fix: New aggregate parts tables
  // cutting_parts table — created with old schema (session_id); 014 migration replaces it
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cutting_parts (
        id         TEXT    PRIMARY KEY,
        session_id TEXT    NOT NULL REFERENCES cutting_sessions(id),
        part_name  TEXT    NOT NULL,
        count      INTEGER NOT NULL CHECK (count > 0),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
  } catch (_) {}
  // These indexes reference session_id which may no longer exist after 014 migration — ignore errors
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_cutting_parts_session   ON cutting_parts(session_id)`) } catch (_) {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_cutting_parts_part_name ON cutting_parts(part_name)`) } catch (_) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS distribution_batch_parts (
      id         TEXT    PRIMARY KEY,
      batch_id   TEXT    NOT NULL REFERENCES distribution_batches(id),
      part_name  TEXT    NOT NULL,
      quantity   INTEGER NOT NULL CHECK (quantity > 0),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_dist_batch_parts_batch ON distribution_batch_parts(batch_id);
  `)

  // 014: Per-session parts log (new table — safe to create any time)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cutting_session_parts (
      id         TEXT    PRIMARY KEY,
      session_id TEXT    NOT NULL REFERENCES cutting_sessions(id),
      part_name  TEXT    NOT NULL,
      count      INTEGER NOT NULL CHECK (count > 0),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cutting_session_parts_session ON cutting_session_parts(session_id);
  `)

  // 014: Add size_label to cutting_sessions (idempotent)
  try { db.prepare(`SELECT size_label FROM cutting_sessions LIMIT 1`).get() } catch (_) {
    db.exec(`ALTER TABLE cutting_sessions ADD COLUMN size_label TEXT NOT NULL DEFAULT ''`)
  }

  // 015: Add size_label to cutting_session_parts (idempotent)
  try { db.prepare(`SELECT size_label FROM cutting_session_parts LIMIT 1`).get() } catch (_) {
    db.exec(`ALTER TABLE cutting_session_parts ADD COLUMN size_label TEXT NOT NULL DEFAULT ''`)
  }

  // 018: Session cost fields on cutting_sessions
  try { db.prepare(`SELECT fabric_cost FROM cutting_sessions LIMIT 1`).get() } catch (_) {
    db.exec(`ALTER TABLE cutting_sessions ADD COLUMN fabric_cost REAL`)
  }
  try { db.prepare(`SELECT employee_cost FROM cutting_sessions LIMIT 1`).get() } catch (_) {
    db.exec(`ALTER TABLE cutting_sessions ADD COLUMN employee_cost REAL`)
  }
  try { db.prepare(`SELECT consumed_materials_cost FROM cutting_sessions LIMIT 1`).get() } catch (_) {
    db.exec(`ALTER TABLE cutting_sessions ADD COLUMN consumed_materials_cost REAL`)
  }
  try { db.prepare(`SELECT total_session_cost FROM cutting_sessions LIMIT 1`).get() } catch (_) {
    db.exec(`ALTER TABLE cutting_sessions ADD COLUMN total_session_cost REAL`)
  }

  // 018: Unit cost on cutting_session_parts
  try { db.prepare(`SELECT unit_cost FROM cutting_session_parts LIMIT 1`).get() } catch (_) {
    db.exec(`ALTER TABLE cutting_session_parts ADD COLUMN unit_cost REAL`)
  }

  // 018: Unit cost on cutting_pieces
  try { db.prepare(`SELECT unit_cost FROM cutting_pieces LIMIT 1`).get() } catch (_) {
    db.exec(`ALTER TABLE cutting_pieces ADD COLUMN unit_cost REAL`)
  }

  // 018: Per-batch consumption linkage table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cutting_batch_consumptions (
      id                   TEXT    PRIMARY KEY,
      session_id           TEXT    NOT NULL,
      stock_transaction_id TEXT    NOT NULL,
      stock_item_id        TEXT    NOT NULL,
      color                TEXT,
      quantity             REAL    NOT NULL,
      price_per_unit       REAL    NOT NULL,
      is_fabric            INTEGER NOT NULL DEFAULT 0,
      created_at           INTEGER NOT NULL,
      updated_at           INTEGER NOT NULL
    )
  `)

  // 015: distribution_consumption_entries
  db.exec(`
    CREATE TABLE IF NOT EXISTS distribution_consumption_entries (
      id            TEXT    PRIMARY KEY,
      batch_id      TEXT    NOT NULL REFERENCES distribution_batches(id),
      stock_item_id TEXT    NOT NULL REFERENCES stock_items(id),
      color         TEXT,
      quantity      REAL    NOT NULL CHECK(quantity > 0),
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    )
  `)

  // 014: Migrate cutting_parts → aggregate table (model_name, size_label, color, part_name, count)
  try { db.prepare(`SELECT model_name FROM cutting_parts LIMIT 1`).get() } catch (_) {
    db.pragma('legacy_alter_table = ON')
    db.pragma('foreign_keys = OFF')
    try {
      db.exec(`ALTER TABLE cutting_parts RENAME TO cutting_parts_old`)
      db.exec(`
        CREATE TABLE cutting_parts (
          id         TEXT    PRIMARY KEY,
          model_name TEXT    NOT NULL,
          size_label TEXT    NOT NULL DEFAULT '',
          color      TEXT    NOT NULL DEFAULT '',
          part_name  TEXT    NOT NULL,
          count      INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          UNIQUE(model_name, size_label, color, part_name)
        )
      `)
      // Migrate legacy rows: join sessions to get model_name + fabric_color; size_label defaults to ''
      db.exec(`
        INSERT OR IGNORE INTO cutting_parts (id, model_name, size_label, color, part_name, count, created_at, updated_at)
          SELECT cp.id, cs.model_name, '', cs.fabric_color, cp.part_name, cp.count, cp.created_at, cp.updated_at
          FROM cutting_parts_old cp
          JOIN cutting_sessions cs ON cs.id = cp.session_id
      `)
      db.exec(`DROP TABLE cutting_parts_old`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_cutting_parts_model ON cutting_parts(model_name)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_cutting_parts_combo ON cutting_parts(model_name, size_label, color, part_name)`)
    } finally {
      db.pragma('legacy_alter_table = OFF')
      db.pragma('foreign_keys = ON')
    }
  }

  // 013-parts-distribution-fix: Migrate distribution_batches — add expected_pieces_count, make size_label/color nullable
  try {
    db.prepare(`SELECT expected_pieces_count FROM distribution_batches LIMIT 1`).get()
  } catch (_) {
    // legacy_alter_table = ON prevents SQLite from auto-updating FK references in child tables
    // (e.g. distribution_batch_parts) when we rename distribution_batches → _old.
    // Without this, those FK refs break after we drop _old.
    db.pragma('legacy_alter_table = ON')
    db.pragma('foreign_keys = OFF')
    try {
      db.exec(`ALTER TABLE distribution_batches RENAME TO distribution_batches_old`)
      db.exec(`
        CREATE TABLE distribution_batches (
          id                     TEXT    PRIMARY KEY,
          tailor_id              TEXT    NOT NULL REFERENCES tailors(id),
          model_name             TEXT    NOT NULL,
          size_label             TEXT,
          color                  TEXT,
          part_name              TEXT,
          quantity               INTEGER NOT NULL CHECK (quantity > 0),
          expected_pieces_count  INTEGER NOT NULL DEFAULT 0,
          sewing_price_per_piece REAL    NOT NULL CHECK (sewing_price_per_piece > 0),
          total_cost             REAL    NOT NULL CHECK (total_cost > 0),
          distribution_date      INTEGER NOT NULL,
          created_at             INTEGER NOT NULL,
          updated_at             INTEGER NOT NULL
        )
      `)
      db.exec(`
        INSERT INTO distribution_batches
          SELECT id, tailor_id, model_name, size_label, color, part_name,
                 quantity, 0, sewing_price_per_piece, total_cost,
                 distribution_date, created_at, updated_at
          FROM distribution_batches_old
      `)
      db.exec(`DROP TABLE distribution_batches_old`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_distribution_batches_tailor ON distribution_batches(tailor_id)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_distribution_batches_date   ON distribution_batches(distribution_date)`)
    } finally {
      db.pragma('foreign_keys = ON')
    }
  }

  // Repair tables whose FK to distribution_batches was corrupted by a previous migration run
  // (before legacy_alter_table = ON fix). SQLite auto-updated the FK to distribution_batches_old
  // which was then dropped, breaking any INSERT into these tables.
  {
    const tablesToRepair = [
      {
        name: 'return_consumption_entries',
        brokenRef: 'return_records_broken',
        ddl: `CREATE TABLE return_consumption_entries (
          id            TEXT PRIMARY KEY,
          return_id     TEXT NOT NULL REFERENCES return_records(id),
          stock_item_id TEXT NOT NULL REFERENCES stock_items(id),
          color         TEXT,
          quantity      REAL NOT NULL CHECK (quantity > 0),
          created_at    INTEGER NOT NULL,
          updated_at    INTEGER NOT NULL
        )`,
        index: `CREATE INDEX IF NOT EXISTS idx_return_consumption_return ON return_consumption_entries(return_id)`,
      },
      {
        name: 'qc_records',
        brokenRef: 'return_records_broken',
        ddl: `CREATE TABLE qc_records (
          id               TEXT PRIMARY KEY,
          return_id        TEXT NOT NULL REFERENCES return_records(id),
          employee_id      TEXT NOT NULL REFERENCES employees(id),
          quantity_reviewed INTEGER NOT NULL CHECK (quantity_reviewed > 0),
          qty_damaged      INTEGER NOT NULL DEFAULT 0 CHECK (qty_damaged >= 0),
          qty_acceptable   INTEGER NOT NULL DEFAULT 0 CHECK (qty_acceptable >= 0),
          qty_good         INTEGER NOT NULL DEFAULT 0 CHECK (qty_good >= 0),
          qty_very_good    INTEGER NOT NULL DEFAULT 0 CHECK (qty_very_good >= 0),
          price_per_piece  REAL NOT NULL CHECK (price_per_piece > 0),
          total_cost       REAL NOT NULL CHECK (total_cost > 0),
          review_date      INTEGER NOT NULL,
          created_at       INTEGER NOT NULL,
          updated_at       INTEGER NOT NULL
        )`,
        index: `CREATE INDEX IF NOT EXISTS idx_qc_records_return ON qc_records(return_id); CREATE INDEX IF NOT EXISTS idx_qc_records_date ON qc_records(review_date)`,
      },
      {
        name: 'distribution_batch_parts',
        ddl: `CREATE TABLE distribution_batch_parts (
          id         TEXT    PRIMARY KEY,
          batch_id   TEXT    NOT NULL REFERENCES distribution_batches(id),
          part_name  TEXT    NOT NULL,
          quantity   INTEGER NOT NULL CHECK (quantity > 0),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
        index: `CREATE INDEX IF NOT EXISTS idx_dist_batch_parts_batch ON distribution_batch_parts(batch_id)`,
      },
      {
        name: 'return_records',
        ddl: `CREATE TABLE return_records (
          id                TEXT    PRIMARY KEY,
          batch_id          TEXT    NOT NULL REFERENCES distribution_batches(id),
          quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
          return_date       INTEGER NOT NULL,
          created_at        INTEGER NOT NULL,
          updated_at        INTEGER NOT NULL
        )`,
        index: `CREATE INDEX IF NOT EXISTS idx_return_records_batch ON return_records(batch_id)`,
      },
      {
        name: 'distribution_piece_links',
        ddl: `CREATE TABLE distribution_piece_links (
          id         TEXT PRIMARY KEY,
          batch_id   TEXT NOT NULL REFERENCES distribution_batches(id),
          piece_id   TEXT NOT NULL REFERENCES cutting_pieces(id),
          created_at INTEGER NOT NULL
        )`,
        index: `CREATE INDEX IF NOT EXISTS idx_dist_piece_links_batch ON distribution_piece_links(batch_id); CREATE INDEX IF NOT EXISTS idx_dist_piece_links_piece ON distribution_piece_links(piece_id)`,
      },
    ]
    db.pragma('foreign_keys = OFF')
    db.pragma('legacy_alter_table = ON')
    try {
      for (const t of tablesToRepair) {
        const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(t.name)
        const brokenPattern = t.brokenRef || 'distribution_batches_old'
        if (row && row.sql && row.sql.includes(brokenPattern)) {
          db.exec(`ALTER TABLE ${t.name} RENAME TO ${t.name}_broken`)
          db.exec(t.ddl)
          db.exec(`INSERT INTO ${t.name} SELECT * FROM ${t.name}_broken`)
          db.exec(`DROP TABLE ${t.name}_broken`)
          db.exec(t.index)
        }
      }
    } finally {
      db.pragma('legacy_alter_table = OFF')
      db.pragma('foreign_keys = ON')
    }
  }

  // Seed predefined lookup entries (idempotent — INSERT OR IGNORE on LOWER(name) unique constraint)
  const now = Date.now()
  const predefinedColors = ['أبيض', 'أسود', 'أحمر', 'أزرق', 'أخضر', 'أصفر', 'رمادي', 'بيج']
  for (const colorName of predefinedColors) {
    db.prepare('INSERT OR IGNORE INTO colors (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 1, 1, ?, ?)').run(crypto.randomUUID(), colorName, now, now)
  }
  db.prepare('INSERT OR IGNORE INTO item_types (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 1, 1, ?, ?)').run(crypto.randomUUID(), 'قماش', now, now)
  db.prepare('INSERT OR IGNORE INTO units (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 1, 1, ?, ?)').run(crypto.randomUUID(), 'متر', now, now)

  // Seed existing free-text data as user-created entries (idempotent)
  db.exec(`
    INSERT OR IGNORE INTO item_types (id, name, is_predefined, is_active, created_at, updated_at)
      SELECT hex(randomblob(16)), type, 0, 1, unixepoch()*1000, unixepoch()*1000
      FROM (SELECT DISTINCT type FROM stock_items WHERE type IS NOT NULL AND type != '');

    INSERT OR IGNORE INTO units (id, name, is_predefined, is_active, created_at, updated_at)
      SELECT hex(randomblob(16)), unit, 0, 1, unixepoch()*1000, unixepoch()*1000
      FROM (SELECT DISTINCT unit FROM stock_items WHERE unit IS NOT NULL AND unit != '');

    INSERT OR IGNORE INTO colors (id, name, is_predefined, is_active, created_at, updated_at)
      SELECT hex(randomblob(16)), color_val, 0, 1, unixepoch()*1000, unixepoch()*1000
      FROM (
        SELECT color AS color_val FROM stock_items WHERE color IS NOT NULL AND color != ''
        UNION SELECT fabric_color FROM cutting_sessions WHERE fabric_color IS NOT NULL AND fabric_color != ''
        UNION SELECT color FROM distribution_batches WHERE color IS NOT NULL AND color != ''
      );
  `)
}

async function seedAdminIfEmpty() {
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get()
  if (existing) return

  const hash = await argon2.hash('Admin123!', { type: argon2.argon2id })
  const now = Date.now()
  db.prepare(
    'INSERT INTO users (id, username, password_hash, full_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), 'admin', hash, 'المدير', 'admin', now, now)
}

function writeAuditLog(eventType, userId, metadata) {
  const now = Date.now()
  db.prepare(
    'INSERT INTO audit_logs (id, user_id, event_type, timestamp, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    userId ?? null,
    eventType,
    now,
    metadata ? JSON.stringify(metadata) : null,
    now,
    now
  )
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

function registerIpcHandlers() {
  // auth:login
  ipcMain.handle('auth:login', async (_event, { username, password }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
      if (!user) {
        writeAuditLog('login_failure', null, { username })
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
      }

      const valid = await argon2.verify(user.password_hash, password)
      if (!valid) {
        writeAuditLog('login_failure', user.id, { username })
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }
      }

      const token = crypto.randomUUID()
      const now = Date.now()
      db.prepare(
        'INSERT INTO sessions (id, user_id, token, last_accessed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(crypto.randomUUID(), user.id, token, now, now, now)

      currentToken = token
      writeAuditLog('login_success', user.id)

      const { password_hash, ...safeUser } = user
      return { success: true, data: { user: safeUser, sessionToken: token } }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ غير متوقع' }
    }
  })

  // auth:logout
  ipcMain.handle('auth:logout', async () => {
    try {
      if (currentToken) {
        const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(currentToken)
        if (session) {
          writeAuditLog('logout', session.user_id)
          db.prepare('DELETE FROM sessions WHERE token = ?').run(currentToken)
        }
        currentToken = null
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ غير متوقع' }
    }
  })

  // auth:checkSession
  ipcMain.handle('auth:checkSession', (_event, payload) => {
    try {
      const token = payload?.token ?? currentToken
      if (!token) return { success: false, error: 'لا توجد جلسة نشطة' }

      const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token)
      if (!session) return { success: false, error: 'انتهت صلاحية الجلسة' }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id)
      if (!user) return { success: false, error: 'المستخدم غير موجود' }

      currentToken = token
      const now = Date.now()
      db.prepare('UPDATE sessions SET last_accessed = ?, updated_at = ? WHERE token = ?').run(now, now, token)

      const { password_hash, ...safeUser } = user
      return { success: true, data: { user: safeUser } }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ غير متوقع' }
    }
  })

  // ─── Stock helpers ───────────────────────────────────────────────────────────

  function getStockImagesDir() {
    const dir = path.join(app.getPath('userData'), 'stock-images')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  function resolveImagePath(filename) {
    if (!filename) return null
    const full = path.join(getStockImagesDir(), filename)
    return fs.existsSync(full) ? `app-file://${full}` : null
  }

  function saveImage(base64Data, mimeType) {
    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${crypto.randomUUID()}.${ext}`
    fs.writeFileSync(path.join(getStockImagesDir(), filename), Buffer.from(base64Data, 'base64'))
    return filename
  }

  function deleteImage(filename) {
    if (!filename) return
    try { fs.unlinkSync(path.join(getStockImagesDir(), filename)) } catch (_) {}
  }

  const ITEM_SUMMARY_SQL = `
    SELECT
      si.id, si.name, si.type, si.unit, si.color, si.image_path, si.description,
      COALESCE((
        SELECT SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END)
        FROM stock_transactions WHERE stock_item_id = si.id
      ), 0) AS total_quantity,
      (
        SELECT COUNT(DISTINCT COALESCE(color, '__null__'))
        FROM stock_transactions WHERE stock_item_id = si.id
      ) AS variant_count
    FROM stock_items si
  `

  function mapSummary(i) {
    return {
      id: i.id, name: i.name, type: i.type, unit: i.unit, color: i.color,
      imagePath: resolveImagePath(i.image_path),
      description: i.description,
      totalQuantity: i.total_quantity,
      variantCount: i.variant_count,
      isLow: i.total_quantity <= 0,
    }
  }

  ipcMain.handle('stock:getAll', () => {
    try {
      const items = db.prepare(ITEM_SUMMARY_SQL + ' WHERE si.is_archived = 0 ORDER BY si.name').all()
      return { success: true, data: items.map(mapSummary) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:getArchived', () => {
    try {
      const items = db.prepare(ITEM_SUMMARY_SQL + ' WHERE si.is_archived = 1 ORDER BY si.name').all()
      return { success: true, data: items.map(mapSummary) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:getById', (_event, { id }) => {
    try {
      const item = db.prepare('SELECT * FROM stock_items WHERE id = ?').get(id)
      if (!item) return { success: false, error: 'الصنف غير موجود' }

      const { total: totalQuantity } = db.prepare(
        `SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS total
         FROM stock_transactions WHERE stock_item_id = ?`
      ).get(id)

      const rawVariants = db.prepare(
        `SELECT color, SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END) AS quantity
         FROM stock_transactions WHERE stock_item_id = ? GROUP BY color ORDER BY color`
      ).all(id)

      const variants = rawVariants.length > 0
        ? rawVariants.map(v => ({ color: v.color, quantity: v.quantity, isLow: v.quantity <= 0 }))
        : [{ color: item.color ?? null, quantity: 0, isLow: true }]

      const transactions = db.prepare(
        `SELECT id, type, quantity, color, transaction_date, notes, source_module, source_reference_id,
                model_name, supplier_name, price_per_unit, total_price_paid, created_at
         FROM stock_transactions WHERE stock_item_id = ?
         ORDER BY transaction_date DESC, created_at DESC`
      ).all(id).map(tx => ({
        id: tx.id, type: tx.type, quantity: tx.quantity, color: tx.color,
        transactionDate: tx.transaction_date, notes: tx.notes,
        sourceModule: tx.source_module, sourceReferenceId: tx.source_reference_id,
        modelName: tx.model_name ?? null,
        supplierName: tx.supplier_name ?? null,
        pricePerUnit: tx.price_per_unit ?? null,
        totalPricePaid: tx.total_price_paid ?? null,
        createdAt: tx.created_at,
      }))

      return {
        success: true,
        data: {
          id: item.id, name: item.name, type: item.type, unit: item.unit, color: item.color,
          imagePath: resolveImagePath(item.image_path),
          description: item.description, notes: item.notes,
          isArchived: !!item.is_archived, totalQuantity, variants, transactions,
        }
      }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── Lookups ─────────────────────────────────────────────────────────────────

  ipcMain.handle('lookups:getTypes', () => {
    try {
      const rows = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM item_types WHERE is_active = 1 ORDER BY is_predefined DESC, name ASC').all()
      return { success: true, data: rows }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:getColors', () => {
    try {
      const rows = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM colors WHERE is_active = 1 ORDER BY is_predefined DESC, name ASC').all()
      return { success: true, data: rows }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:getUnits', () => {
    try {
      const rows = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM units WHERE is_active = 1 ORDER BY is_predefined DESC, name ASC').all()
      return { success: true, data: rows }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:createType', (_event, { name }) => {
    try {
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'الاسم مطلوب' }
      const existing = db.prepare('SELECT id FROM item_types WHERE LOWER(name) = LOWER(?)').get(trimmed)
      if (existing) return { success: false, error: 'هذا النوع موجود مسبقاً' }
      const id = crypto.randomUUID()
      const now = Date.now()
      db.prepare('INSERT INTO item_types (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 0, 1, ?, ?)').run(id, trimmed, now, now)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM item_types WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:createColor', (_event, { name }) => {
    try {
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'الاسم مطلوب' }
      const existing = db.prepare('SELECT id FROM colors WHERE LOWER(name) = LOWER(?)').get(trimmed)
      if (existing) return { success: false, error: 'هذا اللون موجود مسبقاً' }
      const id = crypto.randomUUID()
      const now = Date.now()
      db.prepare('INSERT INTO colors (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 0, 1, ?, ?)').run(id, trimmed, now, now)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM colors WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:createUnit', (_event, { name }) => {
    try {
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'الاسم مطلوب' }
      const existing = db.prepare('SELECT id FROM units WHERE LOWER(name) = LOWER(?)').get(trimmed)
      if (existing) return { success: false, error: 'هذه الوحدة موجودة مسبقاً' }
      const id = crypto.randomUUID()
      const now = Date.now()
      db.prepare('INSERT INTO units (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 0, 1, ?, ?)').run(id, trimmed, now, now)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM units WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:updateType', (_event, { id, name }) => {
    try {
      const entry = db.prepare('SELECT * FROM item_types WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'النوع غير موجود' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن تعديل النوع المحدد مسبقاً' }
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'الاسم مطلوب' }
      const conflict = db.prepare('SELECT id FROM item_types WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmed, id)
      if (conflict) return { success: false, error: 'هذا النوع موجود مسبقاً' }
      const now = Date.now()
      db.prepare('UPDATE item_types SET name = ?, updated_at = ? WHERE id = ?').run(trimmed, now, id)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM item_types WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:updateColor', (_event, { id, name }) => {
    try {
      const entry = db.prepare('SELECT * FROM colors WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'اللون غير موجود' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن تعديل اللون المحدد مسبقاً' }
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'الاسم مطلوب' }
      const conflict = db.prepare('SELECT id FROM colors WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmed, id)
      if (conflict) return { success: false, error: 'هذا اللون موجود مسبقاً' }
      const now = Date.now()
      db.prepare('UPDATE colors SET name = ?, updated_at = ? WHERE id = ?').run(trimmed, now, id)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM colors WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:updateUnit', (_event, { id, name }) => {
    try {
      const entry = db.prepare('SELECT * FROM units WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'الوحدة غير موجودة' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن تعديل الوحدة المحددة مسبقاً' }
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'الاسم مطلوب' }
      const conflict = db.prepare('SELECT id FROM units WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmed, id)
      if (conflict) return { success: false, error: 'هذه الوحدة موجودة مسبقاً' }
      const now = Date.now()
      db.prepare('UPDATE units SET name = ?, updated_at = ? WHERE id = ?').run(trimmed, now, id)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM units WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:deleteType', (_event, { id }) => {
    try {
      const entry = db.prepare('SELECT * FROM item_types WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'النوع غير موجود' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن حذف النوع المحدد مسبقاً' }
      db.prepare('UPDATE item_types SET is_active = 0, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:deleteColor', (_event, { id }) => {
    try {
      const entry = db.prepare('SELECT * FROM colors WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'اللون غير موجود' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن حذف اللون المحدد مسبقاً' }
      db.prepare('UPDATE colors SET is_active = 0, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:deleteUnit', (_event, { id }) => {
    try {
      const entry = db.prepare('SELECT * FROM units WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'الوحدة غير موجودة' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن حذف الوحدة المحددة مسبقاً' }
      db.prepare('UPDATE units SET is_active = 0, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── lookups: models ──────────────────────────────────────────────────────

  ipcMain.handle('lookups:getModels', () => {
    try {
      const rows = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM models WHERE is_active = 1 ORDER BY is_predefined DESC, name ASC').all()
      return { success: true, data: rows }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:createModel', (_event, { name }) => {
    try {
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'اسم الموديل مطلوب' }
      const existing = db.prepare('SELECT id FROM models WHERE LOWER(name) = LOWER(?)').get(trimmed)
      if (existing) return { success: false, error: 'هذا الموديل موجود مسبقاً' }
      const id = crypto.randomUUID()
      const now = Date.now()
      db.prepare('INSERT INTO models (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 0, 1, ?, ?)').run(id, trimmed, now, now)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM models WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:updateModel', (_event, { id, name }) => {
    try {
      const entry = db.prepare('SELECT * FROM models WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'الموديل غير موجود' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن تعديل الموديلات المحددة مسبقاً' }
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'اسم الموديل مطلوب' }
      const conflict = db.prepare('SELECT id FROM models WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmed, id)
      if (conflict) return { success: false, error: 'هذا الموديل موجود مسبقاً' }
      db.prepare('UPDATE models SET name = ?, updated_at = ? WHERE id = ?').run(trimmed, Date.now(), id)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM models WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:deleteModel', (_event, { id }) => {
    try {
      const entry = db.prepare('SELECT * FROM models WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'الموديل غير موجود' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن حذف الموديلات المحددة مسبقاً' }
      db.prepare('UPDATE models SET is_active = 0, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── lookups: parts ───────────────────────────────────────────────────────

  ipcMain.handle('lookups:getParts', () => {
    try {
      const rows = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM parts WHERE is_active = 1 ORDER BY is_predefined DESC, name ASC').all()
      return { success: true, data: rows }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:createPart', (_event, { name }) => {
    try {
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'اسم القطعة مطلوب' }
      const existing = db.prepare('SELECT id FROM parts WHERE LOWER(name) = LOWER(?)').get(trimmed)
      if (existing) return { success: false, error: 'هذه القطعة موجودة مسبقاً' }
      const id = crypto.randomUUID()
      const now = Date.now()
      db.prepare('INSERT INTO parts (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 0, 1, ?, ?)').run(id, trimmed, now, now)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM parts WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:updatePart', (_event, { id, name }) => {
    try {
      const entry = db.prepare('SELECT * FROM parts WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'القطعة غير موجودة' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن تعديل القطع المحددة مسبقاً' }
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'اسم القطعة مطلوب' }
      const conflict = db.prepare('SELECT id FROM parts WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmed, id)
      if (conflict) return { success: false, error: 'هذه القطعة موجودة مسبقاً' }
      db.prepare('UPDATE parts SET name = ?, updated_at = ? WHERE id = ?').run(trimmed, Date.now(), id)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM parts WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:deletePart', (_event, { id }) => {
    try {
      const entry = db.prepare('SELECT * FROM parts WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'القطعة غير موجودة' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن حذف القطع المحددة مسبقاً' }
      db.prepare('UPDATE parts SET is_active = 0, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── lookups: sizes ───────────────────────────────────────────────────────

  ipcMain.handle('lookups:getSizes', () => {
    try {
      const rows = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM sizes WHERE is_active = 1 ORDER BY is_predefined DESC, name ASC').all()
      return { success: true, data: rows }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:createSize', (_event, { name }) => {
    try {
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'اسم المقاس مطلوب' }
      const existing = db.prepare('SELECT id FROM sizes WHERE LOWER(name) = LOWER(?)').get(trimmed)
      if (existing) return { success: false, error: 'هذا المقاس موجود مسبقاً' }
      const id = crypto.randomUUID()
      const now = Date.now()
      db.prepare('INSERT INTO sizes (id, name, is_predefined, is_active, created_at, updated_at) VALUES (?, ?, 0, 1, ?, ?)').run(id, trimmed, now, now)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM sizes WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:updateSize', (_event, { id, name }) => {
    try {
      const entry = db.prepare('SELECT * FROM sizes WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'المقاس غير موجود' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن تعديل المقاسات المحددة مسبقاً' }
      const trimmed = (name || '').trim()
      if (!trimmed) return { success: false, error: 'اسم المقاس مطلوب' }
      const conflict = db.prepare('SELECT id FROM sizes WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmed, id)
      if (conflict) return { success: false, error: 'هذا المقاس موجود مسبقاً' }
      db.prepare('UPDATE sizes SET name = ?, updated_at = ? WHERE id = ?').run(trimmed, Date.now(), id)
      const row = db.prepare('SELECT id, name, is_predefined as isPredefined, is_active as isActive, created_at as createdAt FROM sizes WHERE id = ?').get(id)
      return { success: true, data: row }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('lookups:deleteSize', (_event, { id }) => {
    try {
      const entry = db.prepare('SELECT * FROM sizes WHERE id = ?').get(id)
      if (!entry) return { success: false, error: 'المقاس غير موجود' }
      if (entry.is_predefined) return { success: false, error: 'لا يمكن حذف المقاسات المحددة مسبقاً' }
      db.prepare('UPDATE sizes SET is_active = 0, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:create', (_event, payload) => {
    try {
      const { name, type, unit, initialQuantity, color, imageData, imageMimeType, description, notes, supplierId, pricePerUnit, totalPricePaid } = payload
      if (!name?.trim()) return { success: false, error: 'اسم الصنف مطلوب' }
      if (!type?.trim()) return { success: false, error: 'النوع مطلوب' }
      if (!unit?.trim()) return { success: false, error: 'الوحدة مطلوبة' }
      if (!initialQuantity || initialQuantity <= 0) return { success: false, error: 'الكمية يجب أن تكون أكبر من صفر' }
      if (supplierId && !pricePerUnit) return { success: false, error: 'السعر مطلوب عند اختيار مورد' }
      if (pricePerUnit !== undefined && pricePerUnit <= 0) return { success: false, error: 'السعر يجب أن يكون أكبر من صفر' }

      let supplierName = null
      if (supplierId) {
        const s = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplierId)
        supplierName = s ? s.name : null
      }
      const resolvedTotal = totalPricePaid ?? (supplierId && pricePerUnit ? initialQuantity * pricePerUnit : null)

      const imagePath = (imageData && imageMimeType) ? saveImage(imageData, imageMimeType) : null
      const id = crypto.randomUUID()
      const now = Date.now()

      db.prepare(
        'INSERT INTO stock_items (id, name, type, unit, color, image_path, description, notes, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
      ).run(id, name.trim(), type.trim(), unit.trim(), color || null, imagePath, description || null, notes || null, now, now)

      db.prepare(
        'INSERT INTO stock_transactions (id, stock_item_id, type, quantity, color, transaction_date, notes, supplier_id, supplier_name, price_per_unit, total_price_paid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(crypto.randomUUID(), id, 'inbound', initialQuantity, color || null, now, null, supplierId || null, supplierName, pricePerUnit || null, resolvedTotal, now, now)

      return { success: true, data: { id } }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:update', (_event, payload) => {
    try {
      const { id, name, type, unit, color, imageData, imageMimeType, description, notes } = payload
      const item = db.prepare('SELECT * FROM stock_items WHERE id = ?').get(id)
      if (!item) return { success: false, error: 'الصنف غير موجود' }

      let imagePath = item.image_path
      if (imageData === null) {
        deleteImage(item.image_path)
        imagePath = null
      } else if (imageData && imageMimeType) {
        deleteImage(item.image_path)
        imagePath = saveImage(imageData, imageMimeType)
      }

      const now = Date.now()
      db.prepare(
        'UPDATE stock_items SET name = ?, type = ?, unit = ?, color = ?, image_path = ?, description = ?, notes = ?, updated_at = ? WHERE id = ?'
      ).run(
        name ?? item.name, type ?? item.type, unit ?? item.unit,
        color !== undefined ? (color || null) : item.color,
        imagePath,
        description !== undefined ? (description || null) : item.description,
        notes !== undefined ? (notes || null) : item.notes,
        now, id
      )
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:addInbound', (_event, payload) => {
    try {
      const { stockItemId, quantity, color, transactionDate, notes, supplierId, pricePerUnit, totalPricePaid } = payload
      if (!quantity || quantity <= 0) return { success: false, error: 'الكمية يجب أن تكون أكبر من صفر' }
      if (!transactionDate) return { success: false, error: 'التاريخ مطلوب' }
      if (transactionDate > Date.now() + 60000) return { success: false, error: 'لا يمكن تسجيل معاملة بتاريخ مستقبلي' }
      const item = db.prepare('SELECT id FROM stock_items WHERE id = ? AND is_archived = 0').get(stockItemId)
      if (!item) return { success: false, error: 'الصنف غير موجود أو مؤرشف' }

      if (!supplierId) return { success: false, error: 'المورد مطلوب' }
      if (!pricePerUnit || pricePerUnit <= 0) return { success: false, error: 'سعر الوحدة مطلوب' }
      if (!totalPricePaid || totalPricePaid <= 0) return { success: false, error: 'الإجمالي مطلوب' }

      let supplierName = null
      if (supplierId) {
        const s = db.prepare('SELECT name FROM suppliers WHERE id = ? AND is_deleted = 0').get(supplierId)
        if (!s) return { success: false, error: 'المورد غير موجود' }
        supplierName = s.name
      }
      const resolvedTotal = totalPricePaid

      const now = Date.now()
      db.prepare(
        'INSERT INTO stock_transactions (id, stock_item_id, type, quantity, color, transaction_date, notes, supplier_id, supplier_name, price_per_unit, total_price_paid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(crypto.randomUUID(), stockItemId, 'inbound', quantity, color || null, transactionDate, notes || null, supplierId || null, supplierName, pricePerUnit || null, resolvedTotal, now, now)

      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:updateTransaction', (_event, payload) => {
    try {
      const { id, quantity, transactionDate, supplierId, pricePerUnit, totalPricePaid } = payload
      const tx = db.prepare('SELECT * FROM stock_transactions WHERE id = ?').get(id)
      if (!tx) return { success: false, error: 'المعاملة غير موجودة' }
      if (tx.type !== 'inbound') return { success: false, error: 'لا يمكن تعديل معاملات الاستهلاك' }
      if (quantity !== undefined && quantity <= 0) return { success: false, error: 'الكمية يجب أن تكون أكبر من صفر' }
      if (transactionDate !== undefined && transactionDate > Date.now() + 60000) return { success: false, error: 'لا يمكن تسجيل معاملة بتاريخ مستقبلي' }

      // Determine new supplierId (null = remove, undefined = keep existing)
      const newSupplierId = supplierId !== undefined ? (supplierId || null) : tx.supplier_id
      if (newSupplierId && pricePerUnit === null) return { success: false, error: 'السعر مطلوب عند اختيار مورد' }
      if (newSupplierId && pricePerUnit === undefined && !tx.price_per_unit) return { success: false, error: 'السعر مطلوب عند اختيار مورد' }

      let supplierName = tx.supplier_name
      if (supplierId !== undefined) {
        supplierName = null
        if (supplierId) {
          const s = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplierId)
          supplierName = s ? s.name : null
        }
      }

      const newPricePerUnit = pricePerUnit !== undefined ? (pricePerUnit || null) : tx.price_per_unit
      const newTotalPricePaid = totalPricePaid !== undefined ? (totalPricePaid || null) : tx.total_price_paid

      db.prepare(
        'UPDATE stock_transactions SET quantity = ?, transaction_date = ?, supplier_id = ?, supplier_name = ?, price_per_unit = ?, total_price_paid = ?, updated_at = ? WHERE id = ?'
      ).run(
        quantity ?? tx.quantity,
        transactionDate ?? tx.transaction_date,
        newSupplierId,
        supplierName,
        newPricePerUnit,
        newTotalPricePaid,
        Date.now(),
        id
      )
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:checkDuplicate', (_event, { name, excludeId }) => {
    try {
      const existing = excludeId
        ? db.prepare('SELECT id FROM stock_items WHERE name = ? AND id != ? LIMIT 1').get(name, excludeId)
        : db.prepare('SELECT id FROM stock_items WHERE name = ? LIMIT 1').get(name)
      return { success: true, data: !!existing }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:archive', (_event, { id }) => {
    try {
      const item = db.prepare('SELECT id FROM stock_items WHERE id = ?').get(id)
      if (!item) return { success: false, error: 'الصنف غير موجود' }
      db.prepare('UPDATE stock_items SET is_archived = 1, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('stock:restore', (_event, { id }) => {
    try {
      const item = db.prepare('SELECT id FROM stock_items WHERE id = ?').get(id)
      if (!item) return { success: false, error: 'الصنف غير موجود' }
      db.prepare('UPDATE stock_items SET is_archived = 0, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── Suppliers ───────────────────────────────────────────────────────────────

  ipcMain.handle('suppliers:getAll', () => {
    try {
      const rows = db.prepare(
        'SELECT id, name, phone, address, products_sold, notes, is_deleted FROM suppliers WHERE is_deleted = 0 ORDER BY name'
      ).all()
      return {
        success: true,
        data: rows.map(s => ({
          id: s.id, name: s.name, phone: s.phone, address: s.address,
          productsSold: s.products_sold, notes: s.notes, isDeleted: false,
        })),
      }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('suppliers:getById', (_event, { id }) => {
    try {
      const s = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id)
      if (!s) return { success: false, error: 'المورد غير موجود' }

      const purchases = db.prepare(`
        SELECT
          st.id AS transaction_id,
          st.stock_item_id,
          si.name AS stock_item_name,
          st.quantity,
          si.unit,
          st.color,
          st.price_per_unit,
          st.total_price_paid,
          st.transaction_date
        FROM stock_transactions st
        JOIN stock_items si ON si.id = st.stock_item_id
        WHERE st.supplier_id = ? AND st.price_per_unit IS NOT NULL
        ORDER BY st.transaction_date DESC
      `).all(id)

      const totalSpent = purchases.reduce((sum, p) => sum + (p.total_price_paid ?? 0), 0)

      return {
        success: true,
        data: {
          id: s.id, name: s.name, phone: s.phone, address: s.address,
          productsSold: s.products_sold, notes: s.notes, isDeleted: !!s.is_deleted,
          totalSpent,
          purchases: purchases.map(p => ({
            transactionId: p.transaction_id,
            stockItemId: p.stock_item_id,
            stockItemName: p.stock_item_name,
            quantity: p.quantity,
            unit: p.unit,
            color: p.color,
            pricePerUnit: p.price_per_unit,
            totalPricePaid: p.total_price_paid,
            transactionDate: p.transaction_date,
          })),
        },
      }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('suppliers:create', (_event, payload) => {
    try {
      const { name, phone, address, productsSold, notes } = payload
      if (!name?.trim()) return { success: false, error: 'اسم المورد مطلوب' }
      const id = crypto.randomUUID()
      const now = Date.now()
      db.prepare(
        'INSERT INTO suppliers (id, name, phone, address, products_sold, notes, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)'
      ).run(id, name.trim(), phone || null, address || null, productsSold || null, notes || null, now, now)
      return {
        success: true,
        data: { id, name: name.trim(), phone: phone || null, address: address || null, productsSold: productsSold || null, notes: notes || null, isDeleted: false },
      }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('suppliers:update', (_event, payload) => {
    try {
      const { id, name, phone, address, productsSold, notes } = payload
      const s = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id)
      if (!s) return { success: false, error: 'المورد غير موجود' }
      if (name !== undefined && !name?.trim()) return { success: false, error: 'اسم المورد مطلوب' }
      const now = Date.now()
      db.prepare(
        'UPDATE suppliers SET name = ?, phone = ?, address = ?, products_sold = ?, notes = ?, updated_at = ? WHERE id = ?'
      ).run(
        name !== undefined ? name.trim() : s.name,
        phone !== undefined ? (phone || null) : s.phone,
        address !== undefined ? (address || null) : s.address,
        productsSold !== undefined ? (productsSold || null) : s.products_sold,
        notes !== undefined ? (notes || null) : s.notes,
        now, id
      )
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('suppliers:delete', (_event, { id }) => {
    try {
      const s = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(id)
      if (!s) return { success: false, error: 'المورد غير موجود' }
      db.prepare('UPDATE suppliers SET is_deleted = 1, updated_at = ? WHERE id = ?').run(Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── Employee helpers ─────────────────────────────────────────────────────

  function getEmployeePhotosDir() {
    const dir = path.join(app.getPath('userData'), 'employee-photos')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  function saveEmployeePhoto(base64Data, mimeType) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(mimeType)) throw new Error('نوع الصورة غير مدعوم. يُسمح فقط بـ JPG أو PNG أو WEBP')
    const ext = mimeType.split('/')[1].replace('jpeg', 'jpg')
    const filename = `${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(base64Data, 'base64')
    if (buffer.byteLength > 5 * 1024 * 1024) throw new Error('حجم الصورة يتجاوز 5 ميغابايت')
    fs.writeFileSync(path.join(getEmployeePhotosDir(), filename), buffer)
    return filename
  }

  function deleteEmployeePhoto(filename) {
    try { fs.unlinkSync(path.join(getEmployeePhotosDir(), filename)) } catch (_) {}
  }

  function resolveEmployeePhotoPath(filename) {
    if (!filename) return null
    const full = path.join(getEmployeePhotosDir(), filename)
    return fs.existsSync(full) ? `app-file://${full}` : null
  }

  function buildEmployeeSummary(row) {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone ?? null,
      role: row.role ?? null,
      photoPath: resolveEmployeePhotoPath(row.photo_path ?? null),
      status: row.status,
      balanceDue: row.balance_due ?? 0,
    }
  }

  function buildEmployeeDetail(id) {
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
    if (!emp) throw new Error('الموظف غير موجود')
    const ops = db.prepare(
      'SELECT * FROM employee_operations WHERE employee_id = ? ORDER BY operation_date DESC'
    ).all(id)
    const payments = db.prepare(
      'SELECT * FROM employee_payments WHERE employee_id = ? ORDER BY payment_date DESC'
    ).all(id)
    const agg = db.prepare(`
      SELECT
        COALESCE((SELECT SUM(total_amount) FROM employee_operations WHERE employee_id = ?), 0) AS total_earned,
        COALESCE((SELECT SUM(amount) FROM employee_payments WHERE employee_id = ?), 0) AS total_paid
    `).get(id, id)

    const TYPE_ORDER = ['cutting', 'distribution', 'qc', 'finition', 'custom']
    const groupMap = {}
    for (const op of ops) {
      if (!groupMap[op.operation_type]) groupMap[op.operation_type] = []
      groupMap[op.operation_type].push({
        id: op.id,
        operationType: op.operation_type,
        sourceModule: op.source_module ?? null,
        sourceReferenceId: op.source_reference_id ?? null,
        operationDate: op.operation_date,
        quantity: op.quantity,
        pricePerUnit: op.price_per_unit,
        totalAmount: op.total_amount,
        modelName: op.model_name ?? null,
        color: op.color ?? null,
        notes: op.notes ?? null,
      })
    }
    const operationGroups = TYPE_ORDER.filter(t => groupMap[t]).map(t => ({
      type: t,
      count: groupMap[t].length,
      subtotal: groupMap[t].reduce((s, o) => s + o.totalAmount, 0),
      operations: groupMap[t],
    }))

    return {
      id: emp.id,
      name: emp.name,
      phone: emp.phone ?? null,
      role: emp.role ?? null,
      notes: emp.notes ?? null,
      photoPath: resolveEmployeePhotoPath(emp.photo_path),
      status: emp.status,
      totalEarned: agg.total_earned,
      totalPaid: agg.total_paid,
      balanceDue: agg.total_earned - agg.total_paid,
      operationGroups,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        paymentDate: p.payment_date,
        notes: p.notes ?? null,
      })),
    }
  }

  // ─── employees:getAll ─────────────────────────────────────────────────────

  ipcMain.handle('employees:getAll', () => {
    try {
      const rows = db.prepare(`
        SELECT e.*,
          COALESCE((SELECT SUM(total_amount) FROM employee_operations WHERE employee_id = e.id), 0)
          - COALESCE((SELECT SUM(amount) FROM employee_payments WHERE employee_id = e.id), 0) AS balance_due
        FROM employees e
        ORDER BY e.name ASC
      `).all()
      return { success: true, data: rows.map(buildEmployeeSummary) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('employees:getById', (_event, { id }) => {
    try {
      return { success: true, data: buildEmployeeDetail(id) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('employees:create', (_event, payload) => {
    try {
      const name = payload.name?.trim()
      if (!name) throw new Error('اسم الموظف مطلوب')
      let photoPath = null
      if (payload.photoData && payload.photoMimeType) {
        photoPath = saveEmployeePhoto(payload.photoData, payload.photoMimeType)
      }
      const id = crypto.randomUUID()
      const now = Date.now()
      db.prepare(
        'INSERT INTO employees (id, name, phone, role, notes, photo_path, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, name, payload.phone ?? null, payload.role ?? null, payload.notes ?? null, photoPath, 'active', now, now)
      const row = db.prepare(`
        SELECT e.*,
          COALESCE((SELECT SUM(total_amount) FROM employee_operations WHERE employee_id = e.id), 0)
          - COALESCE((SELECT SUM(amount) FROM employee_payments WHERE employee_id = e.id), 0) AS balance_due
        FROM employees e WHERE e.id = ?
      `).get(id)
      return { success: true, data: buildEmployeeSummary(row) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('employees:update', (_event, payload) => {
    try {
      const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(payload.id)
      if (!emp) throw new Error('الموظف غير موجود')
      const now = Date.now()
      const updates = []
      const values = []
      if (payload.name !== undefined) {
        const n = payload.name.trim()
        if (!n) throw new Error('اسم الموظف مطلوب')
        updates.push('name = ?'); values.push(n)
      }
      if ('phone' in payload) { updates.push('phone = ?'); values.push(payload.phone ?? null) }
      if ('role' in payload) { updates.push('role = ?'); values.push(payload.role ?? null) }
      if ('notes' in payload) { updates.push('notes = ?'); values.push(payload.notes ?? null) }
      if ('photoData' in payload) {
        if (payload.photoData === null) {
          if (emp.photo_path) deleteEmployeePhoto(emp.photo_path)
          updates.push('photo_path = ?'); values.push(null)
        } else if (payload.photoData && payload.photoMimeType) {
          if (emp.photo_path) deleteEmployeePhoto(emp.photo_path)
          const newPath = saveEmployeePhoto(payload.photoData, payload.photoMimeType)
          updates.push('photo_path = ?'); values.push(newPath)
        }
      }
      if (updates.length > 0) {
        updates.push('updated_at = ?'); values.push(now)
        values.push(payload.id)
        db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      }
      const row = db.prepare(`
        SELECT e.*,
          COALESCE((SELECT SUM(total_amount) FROM employee_operations WHERE employee_id = e.id), 0)
          - COALESCE((SELECT SUM(amount) FROM employee_payments WHERE employee_id = e.id), 0) AS balance_due
        FROM employees e WHERE e.id = ?
      `).get(payload.id)
      return { success: true, data: buildEmployeeSummary(row) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('employees:setStatus', (_event, { id, status }) => {
    try {
      const emp = db.prepare('SELECT id FROM employees WHERE id = ?').get(id)
      if (!emp) throw new Error('الموظف غير موجود')
      db.prepare('UPDATE employees SET status = ?, updated_at = ? WHERE id = ?').run(status, Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('employees:addOperation', (_event, payload) => {
    try {
      const emp = db.prepare('SELECT id FROM employees WHERE id = ?').get(payload.employeeId)
      if (!emp) throw new Error('الموظف غير موجود')
      if (payload.quantity <= 0) throw new Error('الكمية يجب أن تكون أكبر من صفر')
      if (payload.pricePerUnit < 0) throw new Error('سعر الوحدة لا يمكن أن يكون سالباً')
      const allowed = ['cutting', 'distribution', 'qc', 'finition', 'custom']
      if (!allowed.includes(payload.operationType)) throw new Error('نوع العملية غير صحيح')
      const now = Date.now()
      db.prepare(
        'INSERT INTO employee_operations (id, employee_id, operation_type, source_module, source_reference_id, operation_date, quantity, price_per_unit, total_amount, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        crypto.randomUUID(), payload.employeeId, payload.operationType,
        null, null, payload.operationDate,
        payload.quantity, payload.pricePerUnit, payload.quantity * payload.pricePerUnit,
        payload.notes ?? null, now, now
      )
      return { success: true, data: buildEmployeeDetail(payload.employeeId) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('employees:addPayment', (_event, payload) => {
    try {
      const emp = db.prepare('SELECT id FROM employees WHERE id = ?').get(payload.employeeId)
      if (!emp) throw new Error('الموظف غير موجود')
      if (payload.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر')
      const now = Date.now()
      db.prepare(
        'INSERT INTO employee_payments (id, employee_id, amount, payment_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(crypto.randomUUID(), payload.employeeId, payload.amount, payload.paymentDate, payload.notes ?? null, now, now)
      return { success: true, data: buildEmployeeDetail(payload.employeeId) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('employees:updatePayment', (_event, payload) => {
    try {
      if (payload.amount !== undefined && payload.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر')
      const existing = db.prepare('SELECT employee_id FROM employee_payments WHERE id = ?').get(payload.id)
      if (!existing) throw new Error('الدفعة غير موجودة')
      const updates = []
      const values = []
      if (payload.amount !== undefined) { updates.push('amount = ?'); values.push(payload.amount) }
      if (payload.paymentDate !== undefined) { updates.push('payment_date = ?'); values.push(payload.paymentDate) }
      if ('notes' in payload) { updates.push('notes = ?'); values.push(payload.notes ?? null) }
      if (updates.length > 0) {
        updates.push('updated_at = ?'); values.push(Date.now())
        values.push(payload.id)
        db.prepare(`UPDATE employee_payments SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      }
      return { success: true, data: buildEmployeeDetail(existing.employee_id) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('employees:deletePayment', (_event, { id }) => {
    try {
      const existing = db.prepare('SELECT employee_id FROM employee_payments WHERE id = ?').get(id)
      if (!existing) throw new Error('الدفعة غير موجودة')
      db.prepare('DELETE FROM employee_payments WHERE id = ?').run(id)
      return { success: true, data: buildEmployeeDetail(existing.employee_id) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── Tailor helpers ───────────────────────────────────────────────────────

  function buildTailorSummary(id) {
    const tailor = db.prepare('SELECT * FROM tailors WHERE id = ?').get(id)
    if (!tailor) throw new Error('الخياط غير موجود')
    const agg = db.prepare(`
      SELECT
        COALESCE((SELECT SUM(total_cost) FROM distribution_batches WHERE tailor_id = ?), 0) AS total_earned,
        COALESCE((SELECT SUM(amount) FROM tailor_payments WHERE tailor_id = ?), 0) AS total_paid
    `).get(id, id)
    return {
      id: tailor.id, name: tailor.name, phone: tailor.phone ?? null,
      notes: tailor.notes ?? null, status: tailor.status,
      totalEarned: agg.total_earned, totalPaid: agg.total_paid,
      balanceDue: agg.total_earned - agg.total_paid,
    }
  }

  function buildTailorDetail(id) {
    const tailor = db.prepare('SELECT * FROM tailors WHERE id = ?').get(id)
    if (!tailor) throw new Error('الخياط غير موجود')
    const agg = db.prepare(`
      SELECT
        COALESCE((SELECT SUM(total_cost) FROM distribution_batches WHERE tailor_id = ?), 0) AS total_earned,
        COALESCE((SELECT SUM(amount) FROM tailor_payments WHERE tailor_id = ?), 0) AS total_paid
    `).get(id, id)
    const batches = db.prepare(
      'SELECT * FROM distribution_batches WHERE tailor_id = ? ORDER BY distribution_date DESC'
    ).all(id)
    const payments = db.prepare(
      'SELECT * FROM tailor_payments WHERE tailor_id = ? ORDER BY payment_date DESC'
    ).all(id)
    return {
      id: tailor.id, name: tailor.name, phone: tailor.phone ?? null,
      notes: tailor.notes ?? null, status: tailor.status,
      totalEarned: agg.total_earned, totalPaid: agg.total_paid,
      balanceDue: agg.total_earned - agg.total_paid,
      sewingTransactions: batches.map(b => ({
        batchId: b.id, modelName: b.model_name, sizeLabel: b.size_label, color: b.color,
        quantity: b.quantity, sewingPricePerPiece: b.sewing_price_per_piece,
        totalCost: b.total_cost, distributionDate: b.distribution_date,
      })),
      payments: payments.map(p => ({
        id: p.id, amount: p.amount, paymentDate: p.payment_date, notes: p.notes ?? null,
      })),
    }
  }

  // ─── tailors:getAll ───────────────────────────────────────────────────────

  ipcMain.handle('tailors:getAll', () => {
    try {
      const rows = db.prepare(`
        SELECT t.*,
          COALESCE((SELECT SUM(total_cost) FROM distribution_batches WHERE tailor_id = t.id), 0) AS total_earned,
          COALESCE((SELECT SUM(amount) FROM tailor_payments WHERE tailor_id = t.id), 0) AS total_paid
        FROM tailors t ORDER BY t.name ASC
      `).all()
      return { success: true, data: rows.map(t => ({
        id: t.id, name: t.name, phone: t.phone ?? null, notes: t.notes ?? null, status: t.status,
        totalEarned: t.total_earned, totalPaid: t.total_paid, balanceDue: t.total_earned - t.total_paid,
      })) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('tailors:getById', (_event, { id }) => {
    try { return { success: true, data: buildTailorDetail(id) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('tailors:create', (_event, payload) => {
    try {
      const name = payload.name?.trim()
      if (!name) throw new Error('اسم الخياط مطلوب')
      const id = crypto.randomUUID(); const now = Date.now()
      db.prepare(
        'INSERT INTO tailors (id, name, phone, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, name, payload.phone ?? null, payload.notes ?? null, 'active', now, now)
      return { success: true, data: buildTailorSummary(id) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('tailors:update', (_event, payload) => {
    try {
      const tailor = db.prepare('SELECT id FROM tailors WHERE id = ?').get(payload.id)
      if (!tailor) throw new Error('الخياط غير موجود')
      const updates = []; const values = []
      if (payload.name !== undefined) {
        const n = payload.name.trim(); if (!n) throw new Error('اسم الخياط مطلوب')
        updates.push('name = ?'); values.push(n)
      }
      if ('phone' in payload) { updates.push('phone = ?'); values.push(payload.phone ?? null) }
      if ('notes' in payload) { updates.push('notes = ?'); values.push(payload.notes ?? null) }
      if (updates.length > 0) {
        updates.push('updated_at = ?'); values.push(Date.now()); values.push(payload.id)
        db.prepare(`UPDATE tailors SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      }
      return { success: true, data: buildTailorSummary(payload.id) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('tailors:setStatus', (_event, { id, status }) => {
    try {
      const tailor = db.prepare('SELECT id FROM tailors WHERE id = ?').get(id)
      if (!tailor) throw new Error('الخياط غير موجود')
      db.prepare('UPDATE tailors SET status = ?, updated_at = ? WHERE id = ?').run(status, Date.now(), id)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('tailors:addPayment', (_event, payload) => {
    try {
      const tailor = db.prepare('SELECT id FROM tailors WHERE id = ?').get(payload.tailorId)
      if (!tailor) throw new Error('الخياط غير موجود')
      if (payload.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر')
      const now = Date.now()
      db.prepare(
        'INSERT INTO tailor_payments (id, tailor_id, amount, payment_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(crypto.randomUUID(), payload.tailorId, payload.amount, payload.paymentDate, payload.notes ?? null, now, now)
      return { success: true, data: buildTailorDetail(payload.tailorId) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('tailors:updatePayment', (_event, payload) => {
    try {
      if (payload.amount !== undefined && payload.amount <= 0) throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر')
      const existing = db.prepare('SELECT tailor_id FROM tailor_payments WHERE id = ?').get(payload.id)
      if (!existing) throw new Error('الدفعة غير موجودة')
      const updates = []; const values = []
      if (payload.amount !== undefined) { updates.push('amount = ?'); values.push(payload.amount) }
      if (payload.paymentDate !== undefined) { updates.push('payment_date = ?'); values.push(payload.paymentDate) }
      if ('notes' in payload) { updates.push('notes = ?'); values.push(payload.notes ?? null) }
      if (updates.length > 0) {
        updates.push('updated_at = ?'); values.push(Date.now()); values.push(payload.id)
        db.prepare(`UPDATE tailor_payments SET ${updates.join(', ')} WHERE id = ?`).run(...values)
      }
      return { success: true, data: buildTailorDetail(existing.tailor_id) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('tailors:deletePayment', (_event, { id }) => {
    try {
      const existing = db.prepare('SELECT tailor_id FROM tailor_payments WHERE id = ?').get(id)
      if (!existing) throw new Error('الدفعة غير موجودة')
      db.prepare('DELETE FROM tailor_payments WHERE id = ?').run(id)
      return { success: true, data: buildTailorDetail(existing.tailor_id) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // cutting:getKpis
  ipcMain.handle('cutting:getKpis', () => {
    try {
      const row = db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM cutting_sessions) AS total_sessions,
          (SELECT COALESCE(SUM(count), 0) FROM cutting_parts) AS total_parts_produced,
          (SELECT COALESCE(SUM(quantity), 0) FROM distribution_batch_parts) AS total_distributed,
          (SELECT COALESCE(SUM(meters_used), 0) FROM cutting_sessions) AS total_meters,
          (SELECT COALESCE(SUM(total_amount), 0) FROM employee_operations WHERE operation_type = 'cutting') AS total_cost
      `).get();
      return { success: true, data: {
        totalSessions: row.total_sessions,
        totalPartsProduced: row.total_parts_produced,
        totalPartsAvailable: row.total_parts_produced - row.total_distributed,
        totalMetersConsumed: row.total_meters,
        totalCostPaid: row.total_cost,
      }};
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getAll
  ipcMain.handle('cutting:getAll', () => {
    try {
      const sessions = db.prepare(`
        SELECT cs.id, cs.session_date, cs.model_name, cs.size_label, cs.meters_used, cs.fabric_color,
          si.name AS fabric_name,
          COALESCE(
            (SELECT SUM(csp.count) FROM cutting_session_parts csp WHERE csp.session_id = cs.id),
            (SELECT COUNT(*) FROM cutting_pieces WHERE session_id = cs.id),
            0
          ) AS total_pieces,
          (SELECT COALESCE(SUM(total_amount), 0) FROM employee_operations WHERE source_module = 'cutting' AND source_reference_id = cs.id) AS total_cost
        FROM cutting_sessions cs
        JOIN stock_items si ON si.id = cs.fabric_item_id
        ORDER BY cs.session_date DESC
      `).all();
      const result = sessions.map(s => {
        const emps = db.prepare(`
          SELECT e.name FROM employee_operations eo JOIN employees e ON e.id = eo.employee_id
          WHERE eo.source_module = 'cutting' AND eo.source_reference_id = ?
        `).all(s.id);
        return {
          id: s.id,
          sessionDate: s.session_date,
          fabricName: s.fabric_name,
          fabricColor: s.fabric_color,
          modelName: s.model_name,
          sizeLabel: s.size_label ?? '',
          metersUsed: s.meters_used,
          totalPieces: s.total_pieces,
          employeeNames: emps.map(e => e.name),
          totalCost: s.total_cost,
        };
      });
      return { success: true, data: result };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getById
  ipcMain.handle('cutting:getById', (_event, { id }) => {
    try {
      const s = db.prepare(`
        SELECT cs.*, si.name AS fabric_name
        FROM cutting_sessions cs JOIN stock_items si ON si.id = cs.fabric_item_id
        WHERE cs.id = ?
      `).get(id);
      if (!s) return { success: false, error: 'جلسة القص غير موجودة' };
      const employees = db.prepare(`
        SELECT e.id, e.name, eo.total_amount AS earnings
        FROM employee_operations eo JOIN employees e ON e.id = eo.employee_id
        WHERE eo.source_module = 'cutting' AND eo.source_reference_id = ?
      `).all(id);
      const parts = db.prepare(`
        SELECT part_name, count FROM cutting_session_parts WHERE session_id = ? ORDER BY part_name
      `).all(id);
      const consumption = db.prepare(`
        SELECT cce.stock_item_id, cce.color, cce.quantity, si.name AS stock_item_name
        FROM cutting_consumption_entries cce JOIN stock_items si ON si.id = cce.stock_item_id
        WHERE cce.session_id = ?
      `).all(id);
      const totalCost = employees.reduce((sum, e) => sum + e.earnings, 0);
      return { success: true, data: {
        id: s.id,
        sessionDate: s.session_date,
        fabricItemId: s.fabric_item_id,
        fabricName: s.fabric_name,
        fabricColor: s.fabric_color,
        modelName: s.model_name,
        sizeLabel: s.size_label ?? '',
        metersUsed: s.meters_used,
        layers: s.layers,
        pricePerLayer: s.price_per_layer,
        notes: s.notes ?? null,
        totalCost,
        fabricCost: s.fabric_cost ?? null,
        employeeCost: s.employee_cost ?? null,
        consumedMaterialsCost: s.consumed_materials_cost ?? null,
        totalSessionCost: s.total_session_cost ?? null,
        employees: employees.map(e => ({ id: e.id, name: e.name, earnings: e.earnings })),
        parts: parts.map(p => ({ partName: p.part_name, count: p.count })),
        consumptionEntries: consumption.map(c => ({
          stockItemId: c.stock_item_id,
          stockItemName: c.stock_item_name,
          color: c.color ?? null,
          quantity: c.quantity,
        })),
      }};
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getFabrics
  ipcMain.handle('cutting:getFabrics', () => {
    try {
      const fabrics = db.prepare(`SELECT id, name FROM stock_items WHERE type = 'قماش' AND is_archived = 0 ORDER BY name`).all();
      const result = fabrics.map(f => {
        const colors = db.prepare(`
          SELECT color, SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END) AS available
          FROM stock_transactions WHERE stock_item_id = ? AND color IS NOT NULL
          GROUP BY color HAVING available > 0 ORDER BY color
        `).all(f.id);
        return { id: f.id, name: f.name, colors: colors.map(c => ({ color: c.color, available: c.available })) };
      });
      return { success: true, data: result };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getFabricColors
  ipcMain.handle('cutting:getFabricColors', (_event, { fabricItemId }) => {
    try {
      const colors = db.prepare(`
        SELECT color, SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END) AS available
        FROM stock_transactions WHERE stock_item_id = ? AND color IS NOT NULL
        GROUP BY color HAVING available > 0 ORDER BY color
      `).all(fabricItemId);
      return { success: true, data: colors.map(c => ({ color: c.color, available: c.available })) };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getNonFabricItems
  ipcMain.handle('cutting:getNonFabricItems', () => {
    try {
      const items = db.prepare(`SELECT id, name, unit FROM stock_items WHERE type != 'قماش' AND is_archived = 0 ORDER BY name`).all();
      const result = items.map(item => {
        const colorRows = db.prepare(`
          SELECT color, SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END) AS available
          FROM stock_transactions WHERE stock_item_id = ? AND color IS NOT NULL
          GROUP BY color HAVING available > 0
        `).all(item.id);
        const totalColorless = db.prepare(`
          SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS available
          FROM stock_transactions WHERE stock_item_id = ? AND color IS NULL
        `).get(item.id);
        const totalAvailable = colorRows.reduce((s, c) => s + c.available, 0) + (totalColorless?.available ?? 0);
        return {
          id: item.id, name: item.name, unit: item.unit,
          colors: colorRows.map(c => ({ color: c.color, available: c.available })),
          totalAvailable,
        };
      });
      return { success: true, data: result };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getModelSuggestions
  ipcMain.handle('cutting:getModelSuggestions', () => {
    try {
      const rows = db.prepare(`SELECT DISTINCT model_name FROM cutting_sessions ORDER BY model_name`).all();
      return { success: true, data: rows.map(r => r.model_name) };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getPartSuggestions
  ipcMain.handle('cutting:getPartSuggestions', (_event, { modelName }) => {
    try {
      const rows = db.prepare(`
        SELECT DISTINCT part_name FROM cutting_parts WHERE model_name = ? ORDER BY part_name
      `).all(modelName);
      return { success: true, data: rows.map(r => r.part_name) };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getPartsInventory
  ipcMain.handle('cutting:getPartsInventory', () => {
    try {
      const rows = db.prepare(`
        SELECT
          cp.model_name,
          cp.size_label,
          cp.color,
          cp.part_name,
          cp.count AS total_produced,
          COALESCE(dist.net_distributed, 0) AS total_distributed,
          cp.count - COALESCE(dist.net_distributed, 0) AS available_count
        FROM cutting_parts cp
        LEFT JOIN (
          SELECT
            dbp.part_name,
            db2.model_name,
            COALESCE(db2.size_label, '') AS size_label,
            COALESCE(db2.color, '') AS color,
            SUM(
              CAST(dbp.quantity AS REAL)
              * (1.0 - COALESCE(
                  (SELECT CAST(SUM(rr.quantity_returned) AS REAL) / db2.quantity
                   FROM return_records rr WHERE rr.batch_id = db2.id),
                  0.0
                ))
            ) AS net_distributed
          FROM distribution_batch_parts dbp
          JOIN distribution_batches db2 ON db2.id = dbp.batch_id
          GROUP BY dbp.part_name, db2.model_name, db2.size_label, db2.color
        ) dist ON dist.part_name = cp.part_name
              AND dist.model_name = cp.model_name
              AND dist.size_label = COALESCE(cp.size_label, '')
              AND dist.color = COALESCE(cp.color, '')
        ORDER BY cp.model_name, cp.size_label, cp.color, cp.part_name
      `).all();
      return { success: true, data: rows.map(r => ({
        modelName: r.model_name,
        sizeLabel: r.size_label ?? '',
        color: r.color ?? '',
        partName: r.part_name,
        totalProduced: r.total_produced,
        totalDistributed: Math.round(r.total_distributed),
        availableCount: Math.round(r.available_count),
      })) };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getAvailableSizesForModel
  ipcMain.handle('cutting:getAvailableSizesForModel', (_event, { modelName }) => {
    try {
      const rows = db.prepare(`
        SELECT DISTINCT size_label FROM cutting_parts
        WHERE model_name = ? AND size_label != '' AND count > 0
        ORDER BY size_label
      `).all(modelName);
      return { success: true, data: rows.map(r => r.size_label) };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getAvailableColorsForModelSize
  ipcMain.handle('cutting:getAvailableColorsForModelSize', (_event, { modelName, sizeLabel }) => {
    try {
      const rows = db.prepare(`
        SELECT DISTINCT color FROM cutting_parts
        WHERE model_name = ? AND size_label = ? AND color != '' AND count > 0
        ORDER BY color
      `).all(modelName, sizeLabel);
      return { success: true, data: rows.map(r => r.color) };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getFabricBatches (018-session-cost-distribution)
  ipcMain.handle('cutting:getFabricBatches', (_event, { stockItemId, color }) => {
    try {
      const rows = db.prepare(`
        SELECT
          st.id                                                                    AS transaction_id,
          st.transaction_date,
          COALESCE(st.price_per_unit, 0)                                          AS price_per_meter,
          st.quantity                                                              AS original_quantity,
          st.supplier_name,
          (st.quantity - COALESCE((
            SELECT SUM(cbc.quantity)
            FROM cutting_batch_consumptions cbc
            WHERE cbc.stock_transaction_id = st.id
          ), 0))                                                                   AS available_quantity
        FROM stock_transactions st
        WHERE st.stock_item_id = ? AND st.color = ? AND st.type = 'inbound'
        ORDER BY st.transaction_date DESC
      `).all(stockItemId, color);
      return {
        success: true,
        data: rows.map(r => ({
          transactionId: r.transaction_id,
          transactionDate: r.transaction_date,
          pricePerMeter: r.price_per_meter,
          originalQuantity: r.original_quantity,
          availableQuantity: Math.max(0, r.available_quantity),
          supplierName: r.supplier_name ?? null,
        })),
      };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:getMaterialBatches (018-session-cost-distribution)
  ipcMain.handle('cutting:getMaterialBatches', (_event, { stockItemId, color }) => {
    try {
      const hasColor = color !== null && color !== undefined && color !== '';
      const rows = hasColor
        ? db.prepare(`
            SELECT
              st.id                                                                    AS transaction_id,
              st.transaction_date,
              COALESCE(st.price_per_unit, 0)                                          AS price_per_unit,
              si.unit,
              st.quantity                                                              AS original_quantity,
              st.supplier_name,
              (st.quantity - COALESCE((
                SELECT SUM(cbc.quantity)
                FROM cutting_batch_consumptions cbc
                WHERE cbc.stock_transaction_id = st.id
              ), 0))                                                                   AS available_quantity
            FROM stock_transactions st
            JOIN stock_items si ON si.id = st.stock_item_id
            WHERE st.stock_item_id = ? AND st.color = ? AND st.type = 'inbound'
            ORDER BY st.transaction_date DESC
          `).all(stockItemId, color)
        : db.prepare(`
            SELECT
              st.id                                                                    AS transaction_id,
              st.transaction_date,
              COALESCE(st.price_per_unit, 0)                                          AS price_per_unit,
              si.unit,
              st.quantity                                                              AS original_quantity,
              st.supplier_name,
              (st.quantity - COALESCE((
                SELECT SUM(cbc.quantity)
                FROM cutting_batch_consumptions cbc
                WHERE cbc.stock_transaction_id = st.id
              ), 0))                                                                   AS available_quantity
            FROM stock_transactions st
            JOIN stock_items si ON si.id = st.stock_item_id
            WHERE st.stock_item_id = ? AND st.type = 'inbound'
            ORDER BY st.transaction_date DESC
          `).all(stockItemId);
      return {
        success: true,
        data: rows.map(r => ({
          transactionId: r.transaction_id,
          transactionDate: r.transaction_date,
          pricePerUnit: r.price_per_unit,
          unit: r.unit ?? '',
          originalQuantity: r.original_quantity,
          availableQuantity: Math.max(0, r.available_quantity),
          supplierName: r.supplier_name ?? null,
        })),
      };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // cutting:create
  ipcMain.handle('cutting:create', (_event, payload) => {
    try {
      const {
        fabricItemId, fabricColor, modelName, metersUsed, employeeIds, layers, pricePerLayer,
        sessionDate, notes, parts: partRows, consumptionRows,
        // 018-session-cost-distribution
        fabricBatchConsumptions, materialBatchConsumptions,
        fabricCost, employeeCost, consumedMaterialsCost, totalSessionCost, partCosts,
      } = payload;

      if (!partRows || partRows.length === 0) return { success: false, error: 'يجب إضافة جزء واحد على الأقل' };
      if (partRows.some((r) => !r.partName || !r.sizeLabel || r.count < 1)) return { success: false, error: 'كل جزء يجب أن يحتوي على اسم ومقاس وعدد صحيح أكبر من صفر' };

      const createSession = db.transaction(() => {
        const now = Date.now();

        // Validate fabric availability
        const fabricAvail = db.prepare(`
          SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS available
          FROM stock_transactions WHERE stock_item_id = ? AND color = ?
        `).get(fabricItemId, fabricColor);
        if (!fabricAvail || fabricAvail.available < metersUsed) {
          throw new Error(`الكمية المتاحة من القماش (${fabricAvail?.available ?? 0} م) أقل من المطلوب (${metersUsed} م)`);
        }

        // Validate fabric batch quantities (server-side re-check)
        for (const fb of (fabricBatchConsumptions || [])) {
          if (!fb.transactionId || !fb.quantity) continue;
          const batchRow = db.prepare(`
            SELECT st.quantity - COALESCE((SELECT SUM(cbc.quantity) FROM cutting_batch_consumptions cbc WHERE cbc.stock_transaction_id = st.id), 0) AS available
            FROM stock_transactions st WHERE st.id = ?
          `).get(fb.transactionId);
          if (!batchRow || batchRow.available < fb.quantity) {
            throw new Error(`الكمية المطلوبة من إحدى دفعات القماش تتجاوز المتاح`);
          }
        }

        // Validate each consumption entry
        for (const row of (consumptionRows || [])) {
          const avail = row.color
            ? db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS available FROM stock_transactions WHERE stock_item_id = ? AND color = ?`).get(row.stockItemId, row.color)
            : db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS available FROM stock_transactions WHERE stock_item_id = ? AND color IS NULL`).get(row.stockItemId);
          if (!avail || avail.available < row.quantity) {
            const item = db.prepare('SELECT name FROM stock_items WHERE id = ?').get(row.stockItemId);
            throw new Error(`الكمية المتاحة من "${item?.name ?? row.stockItemId}" غير كافية`);
          }
        }

        // Validate material batch quantities (server-side re-check)
        for (const mc of (materialBatchConsumptions || [])) {
          for (const mb of (mc.batches || [])) {
            if (!mb.transactionId || !mb.quantity) continue;
            const batchRow = db.prepare(`
              SELECT st.quantity - COALESCE((SELECT SUM(cbc.quantity) FROM cutting_batch_consumptions cbc WHERE cbc.stock_transaction_id = st.id), 0) AS available
              FROM stock_transactions st WHERE st.id = ?
            `).get(mb.transactionId);
            if (!batchRow || batchRow.available < mb.quantity) {
              throw new Error(`الكمية المطلوبة من إحدى دفعات المواد المستهلكة تتجاوز المتاح`);
            }
          }
        }

        // Validate employees
        for (const empId of employeeIds) {
          const emp = db.prepare('SELECT id FROM employees WHERE id = ? AND status = ?').get(empId, 'active');
          if (!emp) throw new Error(`الموظف غير موجود أو غير نشط`);
        }

        const sessionId = crypto.randomUUID();

        // 1. Insert cutting_sessions with cost fields
        db.prepare(`
          INSERT INTO cutting_sessions (id, fabric_item_id, fabric_color, model_name, size_label, meters_used, layers, price_per_layer, session_date, notes, fabric_cost, employee_cost, consumed_materials_cost, total_session_cost, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          sessionId, fabricItemId, fabricColor, modelName, '', metersUsed, layers, pricePerLayer,
          sessionDate, notes ?? null,
          fabricCost ?? null, employeeCost ?? null, consumedMaterialsCost ?? null, totalSessionCost ?? null,
          now, now
        );

        // 2a. Insert per-session log into cutting_session_parts (with unit_cost per row)
        const insertSessionPart = db.prepare(`INSERT INTO cutting_session_parts (id, session_id, part_name, size_label, count, unit_cost, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        const partCostMap = {};
        for (const pc of (partCosts || [])) {
          partCostMap[`${pc.partName}||${pc.sizeLabel}`] = pc.unitCost;
        }
        for (const row of partRows) {
          const unitCost = partCostMap[`${row.partName}||${row.sizeLabel}`] ?? null;
          insertSessionPart.run(crypto.randomUUID(), sessionId, row.partName, row.sizeLabel, row.count, unitCost, now, now);
        }

        // 2b. Upsert into cutting_parts aggregate
        const upsertPart = db.prepare(`
          INSERT INTO cutting_parts (id, model_name, size_label, color, part_name, count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(model_name, size_label, color, part_name)
          DO UPDATE SET count = count + excluded.count, updated_at = excluded.updated_at
        `);
        for (const row of partRows) {
          upsertPart.run(crypto.randomUUID(), modelName, row.sizeLabel, fabricColor, row.partName, row.count, now, now);
        }

        // 3. Fabric deduction (stock_transactions consumed, total meters)
        db.prepare(`INSERT INTO stock_transactions (id, stock_item_id, type, quantity, color, transaction_date, source_module, source_reference_id, model_name, created_at, updated_at) VALUES (?, ?, 'consumed', ?, ?, ?, 'cutting', ?, ?, ?, ?)`
        ).run(crypto.randomUUID(), fabricItemId, metersUsed, fabricColor, sessionDate, sessionId, modelName, now, now);

        // 3b. Insert cutting_batch_consumptions for fabric batches
        const insertBatchConsumption = db.prepare(`
          INSERT INTO cutting_batch_consumptions (id, session_id, stock_transaction_id, stock_item_id, color, quantity, price_per_unit, is_fabric, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const fb of (fabricBatchConsumptions || [])) {
          if (!fb.transactionId || !fb.quantity) continue;
          insertBatchConsumption.run(
            crypto.randomUUID(), sessionId, fb.transactionId, fabricItemId, fabricColor,
            fb.quantity, fb.pricePerUnit ?? 0, 1, now, now
          );
        }

        // 4. Non-fabric consumption entries + stock_transactions
        for (const row of (consumptionRows || [])) {
          db.prepare(`INSERT INTO cutting_consumption_entries (id, session_id, stock_item_id, color, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(crypto.randomUUID(), sessionId, row.stockItemId, row.color ?? null, row.quantity, now, now);
          db.prepare(`INSERT INTO stock_transactions (id, stock_item_id, type, quantity, color, transaction_date, source_module, source_reference_id, model_name, created_at, updated_at) VALUES (?, ?, 'consumed', ?, ?, ?, 'cutting', ?, ?, ?, ?)`
          ).run(crypto.randomUUID(), row.stockItemId, row.quantity, row.color ?? null, sessionDate, sessionId, modelName, now, now);
        }

        // 4b. Insert cutting_batch_consumptions for material batches
        for (const mc of (materialBatchConsumptions || [])) {
          for (const mb of (mc.batches || [])) {
            if (!mb.transactionId || !mb.quantity) continue;
            insertBatchConsumption.run(
              crypto.randomUUID(), sessionId, mb.transactionId, mc.stockItemId, mc.color ?? null,
              mb.quantity, mb.pricePerUnit ?? 0, 0, now, now
            );
          }
        }

        // 5. Employee operations
        const earnings = layers * pricePerLayer;
        for (const empId of employeeIds) {
          db.prepare(`INSERT INTO employee_operations (id, employee_id, operation_type, source_module, source_reference_id, operation_date, quantity, price_per_unit, total_amount, model_name, color, notes, created_at, updated_at) VALUES (?, ?, 'cutting', 'cutting', ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
          ).run(crypto.randomUUID(), empId, sessionId, sessionDate, layers, pricePerLayer, earnings, modelName, fabricColor, now, now);
        }

        // Return summary
        const fabricItem = db.prepare('SELECT name FROM stock_items WHERE id = ?').get(fabricItemId);
        const empNames = employeeIds.map(id => db.prepare('SELECT name FROM employees WHERE id = ?').get(id)?.name ?? '');
        const totalPieces = partRows.reduce((s, r) => s + r.count, 0);
        return {
          id: sessionId,
          sessionDate,
          fabricName: fabricItem?.name ?? '',
          fabricColor,
          modelName,
          sizeLabel: '',
          metersUsed,
          totalPieces,
          employeeNames: empNames,
          totalCost: totalSessionCost ?? (earnings * employeeIds.length),
        };
      });

      const result = createSession();
      return { success: true, data: result };
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' }; }
  })

  // ─── distribution:getKpis ─────────────────────────────────────────────────

  ipcMain.handle('distribution:getKpis', () => {
    try {
      const row = db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM cutting_pieces WHERE status = 'distributed') AS pieces_in_dist,
          (SELECT COUNT(*) FROM cutting_pieces WHERE status = 'returned') AS pieces_returned,
          (SELECT COUNT(DISTINCT db.tailor_id)
           FROM distribution_batches db
           WHERE (db.quantity - COALESCE((SELECT SUM(rr.quantity_returned) FROM return_records rr WHERE rr.batch_id = db.id), 0)) > 0
          ) AS tailors_active,
          (SELECT COALESCE(SUM(total_cost), 0) FROM distribution_batches) AS total_cost,
          (SELECT COALESCE(SUM(total_cost), 0) FROM distribution_batches)
          - (SELECT COALESCE(SUM(amount), 0) FROM tailor_payments) AS unsettled_cost
      `).get()
      return { success: true, data: {
        piecesInDistribution: row.pieces_in_dist,
        piecesReturned: row.pieces_returned,
        piecesNotYetReturned: row.pieces_in_dist,
        tailorsWithActiveDist: row.tailors_active,
        totalSewingCost: row.total_cost,
        totalUnsettledCost: row.unsettled_cost,
      }}
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:getSummary', () => {
    try {
      const tailorIds = db.prepare(
        'SELECT DISTINCT tailor_id FROM distribution_batches'
      ).all().map(r => r.tailor_id)
      const result = tailorIds.map(tid => {
        const tailor = db.prepare('SELECT id, name FROM tailors WHERE id = ?').get(tid)
        const inDist = db.prepare(`
          SELECT COUNT(*) AS cnt FROM cutting_pieces cp
          JOIN distribution_piece_links dpl ON dpl.piece_id = cp.id
          JOIN distribution_batches dbatch ON dbatch.id = dpl.batch_id
          WHERE dbatch.tailor_id = ? AND cp.status = 'distributed'
        `).get(tid)
        const returned = db.prepare(`
          SELECT COUNT(*) AS cnt FROM cutting_pieces cp
          JOIN distribution_piece_links dpl ON dpl.piece_id = cp.id
          JOIN distribution_batches dbatch ON dbatch.id = dpl.batch_id
          WHERE dbatch.tailor_id = ? AND cp.status = 'returned'
        `).get(tid)
        const earned = db.prepare(
          'SELECT COALESCE(SUM(total_cost), 0) AS total FROM distribution_batches WHERE tailor_id = ?'
        ).get(tid)
        const paid = db.prepare(
          'SELECT COALESCE(SUM(amount), 0) AS total FROM tailor_payments WHERE tailor_id = ?'
        ).get(tid)
        return {
          tailorId: tid, tailorName: tailor?.name ?? '',
          piecesInDistribution: inDist.cnt, piecesReturned: returned.cnt, piecesNotYetReturned: inDist.cnt,
          totalEarned: earned.total, settledAmount: paid.total, remainingBalance: earned.total - paid.total,
        }
      })
      result.sort((a, b) => b.piecesInDistribution - a.piecesInDistribution)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:getDetailByTailor', (_event, { tailorId }) => {
    try {
      const tailor = db.prepare('SELECT id, name FROM tailors WHERE id = ?').get(tailorId)
      if (!tailor) throw new Error('الخياط غير موجود')
      const batches = db.prepare(
        'SELECT * FROM distribution_batches WHERE tailor_id = ? ORDER BY distribution_date DESC'
      ).all(tailorId)
      const result = batches.map(b => {
        const retTotal = db.prepare(
          'SELECT COALESCE(SUM(quantity_returned), 0) AS total FROM return_records WHERE batch_id = ?'
        ).get(b.id)
        const returns = db.prepare(
          'SELECT * FROM return_records WHERE batch_id = ? ORDER BY return_date DESC'
        ).all(b.id)
        const returnRows = returns.map(r => {
          const consumption = db.prepare(`
            SELECT rce.color, rce.quantity, si.name AS item_name
            FROM return_consumption_entries rce
            JOIN stock_items si ON si.id = rce.stock_item_id
            WHERE rce.return_id = ?
          `).all(r.id)
          return {
            id: r.id, quantityReturned: r.quantity_returned, returnDate: r.return_date,
            consumptionEntries: consumption.map(c => ({ stockItemName: c.item_name, color: c.color ?? null, quantity: c.quantity })),
          }
        })
        const batchParts = db.prepare(`SELECT part_name, quantity FROM distribution_batch_parts WHERE batch_id = ? ORDER BY part_name`).all(b.id)
        return {
          id: b.id, modelName: b.model_name, sizeLabel: b.size_label ?? null, color: b.color ?? null,
          quantity: b.quantity, expectedPiecesCount: b.expected_pieces_count ?? 0,
          remainingQuantity: b.quantity - retTotal.total,
          sewingPricePerPiece: b.sewing_price_per_piece, totalCost: b.total_cost,
          distributionDate: b.distribution_date,
          parts: batchParts.map(p => ({ partName: p.part_name, quantity: p.quantity })),
          returns: returnRows,
        }
      })
      return { success: true, data: { tailorId: tailor.id, tailorName: tailor.name, batches: result } }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:getActiveTailors', () => {
    try {
      const rows = db.prepare(`SELECT id, name FROM tailors WHERE status = 'active' ORDER BY name`).all()
      return { success: true, data: rows.map(t => ({ id: t.id, name: t.name })) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:getAvailablePartsForModel', (_event, { modelName, sizeLabel, color }) => {
    try {
      const rows = db.prepare(`
        SELECT
          cp.part_name,
          cp.count AS total_produced,
          COALESCE(SUM(
            CAST(dbp.quantity AS REAL)
            * (1.0 - COALESCE(
                (SELECT CAST(SUM(rr.quantity_returned) AS REAL) / db2.quantity
                 FROM return_records rr WHERE rr.batch_id = db2.id),
                0.0
              ))
          ), 0) AS total_distributed
        FROM cutting_parts cp
        LEFT JOIN distribution_batch_parts dbp ON dbp.part_name = cp.part_name
        LEFT JOIN distribution_batches db2 ON db2.id = dbp.batch_id
          AND db2.model_name = cp.model_name
          AND db2.size_label = cp.size_label
          AND db2.color = cp.color
        WHERE cp.model_name = ? AND cp.size_label = ? AND cp.color = ?
        GROUP BY cp.part_name
        HAVING (cp.count - COALESCE(SUM(
          CAST(dbp.quantity AS REAL)
          * (1.0 - COALESCE(
              (SELECT CAST(SUM(rr.quantity_returned) AS REAL) / db2.quantity
               FROM return_records rr WHERE rr.batch_id = db2.id),
              0.0
            ))
        ), 0)) > 0
        ORDER BY cp.part_name
      `).all(modelName, sizeLabel ?? '', color ?? '')
      return { success: true, data: rows.map(r => ({
        partName: r.part_name,
        availableCount: Math.round(r.total_produced - r.total_distributed),
      })) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:getModelSuggestions', () => {
    try {
      const rows = db.prepare(`SELECT DISTINCT model_name FROM cutting_sessions ORDER BY model_name`).all()
      return { success: true, data: rows.map(r => r.model_name) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:getSizeSuggestions', () => {
    try {
      const rows = db.prepare(`SELECT DISTINCT size_label FROM cutting_pieces ORDER BY size_label`).all()
      return { success: true, data: rows.map(r => r.size_label) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:getBatchesForTailor', (_event, { tailorId }) => {
    try {
      const batches = db.prepare(`
        SELECT db.*,
          db.quantity - COALESCE((SELECT SUM(rr.quantity_returned) FROM return_records rr WHERE rr.batch_id = db.id), 0) AS remaining
        FROM distribution_batches db
        WHERE db.tailor_id = ?
        ORDER BY db.distribution_date DESC
      `).all(tailorId)
      const active = batches.filter(b => b.remaining > 0)
      return { success: true, data: active.map(b => {
        const batchParts = db.prepare(`SELECT part_name, quantity FROM distribution_batch_parts WHERE batch_id = ? ORDER BY part_name`).all(b.id)
        return {
          id: b.id, modelName: b.model_name, sizeLabel: b.size_label ?? null, color: b.color ?? null,
          quantityDistributed: b.quantity, expectedPiecesCount: b.expected_pieces_count ?? 0,
          remainingQuantity: b.remaining, distributionDate: b.distribution_date,
          parts: batchParts.map(p => ({ partName: p.part_name, quantity: p.quantity })),
        }
      }) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:distribute', (_event, payload) => {
    try {
      const distribute = db.transaction((p) => {
        const now = Date.now()
        const tailor = db.prepare(`SELECT id FROM tailors WHERE id = ? AND status = 'active'`).get(p.tailorId)
        if (!tailor) throw new Error('الخياط غير موجود أو غير نشط')
        if (!p.parts || p.parts.length === 0) throw new Error('يجب تحديد الأجزاء')
        if (!p.expectedPiecesCount || p.expectedPiecesCount < 1) throw new Error('عدد القطع المتوقعة يجب أن يكون أكبر من صفر')

        const sizeLabel = p.sizeLabel ?? ''
        const color = p.color ?? ''

        // Validate each part against available inventory
        for (const part of p.parts) {
          const availRow = db.prepare(`
            SELECT
              cp.count - COALESCE(SUM(
                CAST(dbp2.quantity AS REAL)
                * (1.0 - COALESCE(
                    (SELECT CAST(SUM(rr.quantity_returned) AS REAL) / db3.quantity
                     FROM return_records rr WHERE rr.batch_id = db3.id),
                    0.0
                  ))
              ), 0) AS available
            FROM cutting_parts cp
            LEFT JOIN distribution_batch_parts dbp2 ON dbp2.part_name = cp.part_name
            LEFT JOIN distribution_batches db3 ON db3.id = dbp2.batch_id
              AND db3.model_name = cp.model_name
              AND db3.size_label = cp.size_label
              AND db3.color = cp.color
            WHERE cp.model_name = ? AND cp.size_label = ? AND cp.color = ? AND cp.part_name = ?
            GROUP BY cp.id
          `).get(p.modelName, sizeLabel, color, part.partName)
          const available = Math.round(availRow?.available ?? 0)
          if (part.quantity > available) {
            throw new Error(`الكمية المطلوبة من "${part.partName}" (${part.quantity}) أكبر من المتاح (${available})`)
          }
        }

        const totalQuantity = p.parts.reduce((s, r) => s + r.quantity, 0)
        const totalCost = p.expectedPiecesCount * p.sewingPricePerPiece
        const batchId = crypto.randomUUID()

        db.prepare(`
          INSERT INTO distribution_batches (id, tailor_id, model_name, size_label, color, part_name, quantity, expected_pieces_count, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
        `).run(batchId, p.tailorId, p.modelName, sizeLabel || null, color || null, totalQuantity, p.expectedPiecesCount, p.sewingPricePerPiece, totalCost, p.distributionDate, now, now)

        const insertBatchPart = db.prepare(`INSERT INTO distribution_batch_parts (id, batch_id, part_name, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
        for (const part of p.parts) {
          insertBatchPart.run(crypto.randomUUID(), batchId, part.partName, part.quantity, now, now)
        }

        // Validate and insert consumed materials
        for (const row of (p.consumptionRows || [])) {
          const avail = row.color
            ? db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS available FROM stock_transactions WHERE stock_item_id = ? AND color = ?`).get(row.stockItemId, row.color)
            : db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS available FROM stock_transactions WHERE stock_item_id = ? AND color IS NULL`).get(row.stockItemId)
          if (!avail || avail.available < row.quantity) {
            const item = db.prepare('SELECT name FROM stock_items WHERE id = ?').get(row.stockItemId)
            throw new Error(`الكمية المتاحة من "${item?.name ?? row.stockItemId}" غير كافية`)
          }
          db.prepare(`INSERT INTO distribution_consumption_entries (id, batch_id, stock_item_id, color, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(crypto.randomUUID(), batchId, row.stockItemId, row.color ?? null, row.quantity, now, now)
          db.prepare(`INSERT INTO stock_transactions (id, stock_item_id, type, quantity, color, transaction_date, source_module, source_reference_id, model_name, created_at, updated_at) VALUES (?, ?, 'consumed', ?, ?, ?, 'distribution', ?, ?, ?, ?)`
          ).run(crypto.randomUUID(), row.stockItemId, row.quantity, row.color ?? null, p.distributionDate, batchId, p.modelName ?? null, now, now)
        }

        const agg = db.prepare(`SELECT COALESCE(SUM(total_cost), 0) AS total_earned FROM distribution_batches WHERE tailor_id = ?`).get(p.tailorId)
        const paid = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM tailor_payments WHERE tailor_id = ?`).get(p.tailorId)
        const tailorRow = db.prepare('SELECT name FROM tailors WHERE id = ?').get(p.tailorId)
        return {
          
          tailorId: p.tailorId, tailorName: tailorRow.name,
          piecesInDistribution: 0, piecesReturned: 0, piecesNotYetReturned: 0,
          totalEarned: agg.total_earned, settledAmount: paid.total, remainingBalance: agg.total_earned - paid.total,
        }
      })
      return { success: true, data: distribute(payload) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('distribution:return', (_event, payload) => {
    try {
      const returnPieces = db.transaction((p) => {
        const now = Date.now()
        const batch = db.prepare('SELECT * FROM distribution_batches WHERE id = ?').get(p.batchId)
        if (!batch) throw new Error('دفعة التوزيع غير موجودة')
        const retSoFar = db.prepare(
          'SELECT COALESCE(SUM(quantity_returned), 0) AS total FROM return_records WHERE batch_id = ?'
        ).get(p.batchId)
        const remaining = batch.quantity - retSoFar.total
        if (p.quantityReturned < 1) throw new Error('يجب إرجاع قطعة واحدة على الأقل')
        if (p.quantityReturned > remaining) throw new Error(`الكمية المرتجعة (${p.quantityReturned}) تتجاوز المتبقي (${remaining})`)
        for (const row of (p.consumptionRows || [])) {
          const avail = row.color
            ? db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS available FROM stock_transactions WHERE stock_item_id = ? AND color = ?`).get(row.stockItemId, row.color)
            : db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='inbound' THEN quantity ELSE -quantity END), 0) AS available FROM stock_transactions WHERE stock_item_id = ? AND color IS NULL`).get(row.stockItemId)
          if (!avail || avail.available < row.quantity) {
            const item = db.prepare('SELECT name FROM stock_items WHERE id = ?').get(row.stockItemId)
            throw new Error(`الكمية المتاحة من "${item?.name ?? row.stockItemId}" غير كافية`)
          }
        }
        const returnId = crypto.randomUUID()
        db.prepare(
          'INSERT INTO return_records (id, batch_id, quantity_returned, return_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(returnId, p.batchId, p.quantityReturned, p.returnDate, now, now)
        // Only update cutting_pieces status for legacy batches (those with distribution_piece_links)
        const pieceRows = db.prepare(`
          SELECT cp.id FROM cutting_pieces cp
          JOIN distribution_piece_links dpl ON dpl.piece_id = cp.id
          WHERE dpl.batch_id = ? AND cp.status = 'distributed'
          LIMIT ?
        `).all(p.batchId, p.quantityReturned)
        const pieceIds = pieceRows.map(r => r.id)
        if (pieceIds.length > 0) {
          db.prepare(`UPDATE cutting_pieces SET status = 'returned', updated_at = ? WHERE id IN (${pieceIds.map(() => '?').join(',')})`)
            .run(now, ...pieceIds)
        }
        for (const row of (p.consumptionRows || [])) {
          db.prepare(`INSERT INTO return_consumption_entries (id, return_id, stock_item_id, color, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(crypto.randomUUID(), returnId, row.stockItemId, row.color ?? null, row.quantity, now, now)
          db.prepare(`INSERT INTO stock_transactions (id, stock_item_id, type, quantity, color, transaction_date, source_module, source_reference_id, created_at, updated_at) VALUES (?, ?, 'consumed', ?, ?, ?, 'distribution', ?, ?, ?)`)
            .run(crypto.randomUUID(), row.stockItemId, row.quantity, row.color ?? null, p.returnDate, returnId, now, now)
        }
        const tailorId = batch.tailor_id
        const inDist = db.prepare(`
          SELECT COUNT(*) AS cnt FROM cutting_pieces cp
          JOIN distribution_piece_links dpl ON dpl.piece_id = cp.id
          JOIN distribution_batches dbatch ON dbatch.id = dpl.batch_id
          WHERE dbatch.tailor_id = ? AND cp.status = 'distributed'
        `).get(tailorId)
        const retCount = db.prepare(`
          SELECT COUNT(*) AS cnt FROM cutting_pieces cp
          JOIN distribution_piece_links dpl ON dpl.piece_id = cp.id
          JOIN distribution_batches dbatch ON dbatch.id = dpl.batch_id
          WHERE dbatch.tailor_id = ? AND cp.status = 'returned'
        `).get(tailorId)
        const agg = db.prepare(`SELECT COALESCE(SUM(total_cost), 0) AS total_earned FROM distribution_batches WHERE tailor_id = ?`).get(tailorId)
        const paid = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM tailor_payments WHERE tailor_id = ?`).get(tailorId)
        const tailorRow = db.prepare('SELECT name FROM tailors WHERE id = ?').get(tailorId)
        return {
          tailorId, tailorName: tailorRow.name,
          piecesInDistribution: inDist.cnt, piecesReturned: retCount.cnt, piecesNotYetReturned: inDist.cnt,
          totalEarned: agg.total_earned, settledAmount: paid.total, remainingBalance: agg.total_earned - paid.total,
        }
      })
      return { success: true, data: returnPieces(payload) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── QC handlers ──────────────────────────────────────────────────────────

  ipcMain.handle('qc:getKpis', () => {
    try {
      return { success: true, data: qcQueries.getKpis(db) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('qc:getReturnBatchesForQc', () => {
    try {
      return { success: true, data: qcQueries.getReturnBatchesForQc(db) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('qc:getRecords', () => {
    try {
      return { success: true, data: qcQueries.getQcRecords(db) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('qc:create', (_event, payload) => {
    try {
      const result = qcService.createQcRecord(db, payload)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // ─── Finition handlers ────────────────────────────────────────────────────

  ipcMain.handle('finition:getQcRecordsForFinition', () => {
    try {
      return { success: true, data: finitionQueries.getQcRecordsForFinition(db) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('finition:getRecords', () => {
    try {
      return { success: true, data: finitionQueries.getFinitionRecords(db) }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('finition:create', (_event, payload) => {
    try {
      const result = finitionService.createFinitionRecord(db, payload)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('finition:createStep', (_event, payload) => {
    try {
      const result = finitionService.createFinitionStep(db, payload)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('finition:addToFinalStock', (_event, payload) => {
    try {
      const result = finitionService.addToFinalStock(db, payload)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('final-stock:getKpis', () => {
    try {
      const result = finalStockService.getKpis(db)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('final-stock:getRows', (_event, payload) => {
    try {
      const result = finalStockService.getRows(db, payload ?? {})
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  ipcMain.handle('final-stock:getHistory', (_event, payload) => {
    try {
      const result = finalStockService.getHistory(db, payload)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // dashboard:getSnapshotData
  ipcMain.handle('dashboard:getSnapshotData', () => {
    try {
      const result = dashboardService.getSnapshotData(db)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // dashboard:getPeriodKpis
  ipcMain.handle('dashboard:getPeriodKpis', (_event, payload) => {
    try {
      const result = dashboardService.getPeriodKpis(db, payload)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // dashboard:getChartData
  ipcMain.handle('dashboard:getChartData', (_event, payload) => {
    try {
      const result = dashboardService.getChartData(db, payload)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // distribution:getAvailabilityForModel
  ipcMain.handle('distribution:getAvailabilityForModel', (_event, payload) => {
    try {
      const result = piecesService.getAvailabilityForModel(db, payload.modelName)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // pieces:getAvailability
  ipcMain.handle('pieces:getAvailability', (_event, payload) => {
    try {
      const result = piecesService.getAvailability(db, payload ?? {})
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // pieces:getLowStockThreshold
  ipcMain.handle('pieces:getLowStockThreshold', () => {
    try {
      const result = piecesService.getLowStockThreshold(db)
      return { success: true, data: result }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // pieces:setLowStockThreshold
  ipcMain.handle('pieces:setLowStockThreshold', (_event, payload) => {
    try {
      piecesService.setLowStockThreshold(db, payload.threshold)
      return { success: true, data: null }
    } catch (err) { return { success: false, error: err.message ?? 'حدث خطأ' } }
  })

  // user:changePassword
  ipcMain.handle('user:changePassword', async (_event, { userId, currentPassword, newPassword }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
      if (!user) return { success: false, error: 'المستخدم غير موجود' }

      const valid = await argon2.verify(user.password_hash, currentPassword)
      if (!valid) return { success: false, error: 'كلمة المرور الحالية غير صحيحة' }

      const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
      if (!complexityRegex.test(newPassword)) {
        return {
          success: false,
          error: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم',
        }
      }

      const newHash = await argon2.hash(newPassword, { type: argon2.argon2id })
      const now = Date.now()
      db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, userId)
      writeAuditLog('password_change', userId)

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ غير متوقع' }
    }
  })

  // ─── Settings: appearance ─────────────────────────────────────────────────

  // Synchronous — called from preload before renderer starts
  ipcMain.on('settings:getAppearanceSync', (event) => {
    try {
      event.returnValue = settingsQueries.getAppearanceSettings(db)
    } catch (err) {
      event.returnValue = { theme: 'system', primaryColor: 'blue' }
    }
  })

  ipcMain.handle('settings:getAppearance', () => {
    try {
      return { success: true, data: settingsQueries.getAppearanceSettings(db) }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ' }
    }
  })

  ipcMain.handle('settings:setAppearance', (_event, payload) => {
    try {
      settingsService.validateAppearanceSettings(payload)
      settingsQueries.setAppearanceSettings(db, payload)
      return { success: true, data: null }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ' }
    }
  })

  ipcMain.handle('settings:getLogo', () => {
    try {
      return { success: true, data: settingsQueries.getLogo(db) }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ' }
    }
  })

  ipcMain.handle('settings:setLogo', (_event, { dataUrl }) => {
    try {
      settingsService.validateLogoUpload(dataUrl)
      settingsQueries.setLogo(db, dataUrl)
      return { success: true, data: null }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ' }
    }
  })

  ipcMain.handle('settings:removeLogo', () => {
    try {
      settingsQueries.removeLogo(db)
      return { success: true, data: null }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ' }
    }
  })

  ipcMain.handle('settings:resetToDefaults', () => {
    try {
      const defaults = settingsQueries.resetAppearanceToDefaults(db)
      return { success: true, data: defaults }
    } catch (err) {
      return { success: false, error: err.message ?? 'حدث خطأ' }
    }
  })
}

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:3000')
  } else {
    // Next.js exports to frontend/out/ — load from there in production
    win.loadFile(path.join(__dirname, '../frontend/out/index.html'))
  }
}

// ─── App lifecycle ───────────────────────────────────────────────────────────

protocol.registerSchemesAsPrivileged([
  { scheme: 'app-file', privileges: { secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
])

app.whenReady().then(async () => {
  protocol.handle('app-file', (request) => {
    const filePath = decodeURIComponent(request.url.slice('app-file://'.length))
    return net.fetch('file://' + filePath)
  })

  initDB()
  await seedAdminIfEmpty()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
