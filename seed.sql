-- ============================================================
-- Atelier Seed Script: Rich data for pieces availability demo
-- ============================================================
-- Run: sqlite3 "/Users/macbook/Library/Application Support/atelier/atelier.db" < seed.sql

BEGIN TRANSACTION;

-- ============================================================
-- 1. Fix existing cutting_pieces: assign color from session
-- ============================================================
UPDATE cutting_pieces
SET color = (
  SELECT fabric_color FROM cutting_sessions WHERE cutting_sessions.id = cutting_pieces.session_id
)
WHERE color IS NULL OR color = '';

-- ============================================================
-- 2. Add more cutting sessions (past months for chart data)
-- ============================================================

-- Stock item IDs
-- قماش قطني: 2cd9b069-11ad-4f74-899c-988b4d4b073a
-- قماش صوف:  691f0af6-4fb7-40f4-a1a6-d9d850f7d2e1
-- قماش جينز: 94fe368d-09b0-46d6-b7f7-7901c27973f5

-- Session 3 months ago: قميص كلاسيكي أسود
INSERT OR IGNORE INTO cutting_sessions (id, fabric_item_id, fabric_color, model_name, meters_used, layers, price_per_layer, session_date, created_at, updated_at)
VALUES (
  'seed-cs-001', '2cd9b069-11ad-4f74-899c-988b4d4b073a',
  'أسود', 'قميص كلاسيكي', 15.0, 10, 500.0,
  strftime('%s','now','-3 months')*1000,
  strftime('%s','now','-3 months')*1000,
  strftime('%s','now','-3 months')*1000
);

-- Session 2 months ago: بنطال رسمي أزرق
INSERT OR IGNORE INTO cutting_sessions (id, fabric_item_id, fabric_color, model_name, meters_used, layers, price_per_layer, session_date, created_at, updated_at)
VALUES (
  'seed-cs-002', '94fe368d-09b0-46d6-b7f7-7901c27973f5',
  'أزرق', 'بنطال رسمي', 12.0, 8, 600.0,
  strftime('%s','now','-2 months')*1000,
  strftime('%s','now','-2 months')*1000,
  strftime('%s','now','-2 months')*1000
);

-- Session 1 month ago: فستان سهرة أحمر
INSERT OR IGNORE INTO cutting_sessions (id, fabric_item_id, fabric_color, model_name, meters_used, layers, price_per_layer, session_date, created_at, updated_at)
VALUES (
  'seed-cs-003', '2cd9b069-11ad-4f74-899c-988b4d4b073a',
  'أحمر', 'فستان سهرة', 10.0, 6, 700.0,
  strftime('%s','now','-1 month')*1000,
  strftime('%s','now','-1 month')*1000,
  strftime('%s','now','-1 month')*1000
);

-- Session 1 month ago: جاكيت شتوي أسود
INSERT OR IGNORE INTO cutting_sessions (id, fabric_item_id, fabric_color, model_name, meters_used, layers, price_per_layer, session_date, created_at, updated_at)
VALUES (
  'seed-cs-004', '691f0af6-4fb7-40f4-a1a6-d9d850f7d2e1',
  'أسود', 'جاكيت شتوي', 18.0, 12, 800.0,
  strftime('%s','now','-1 month')*1000,
  strftime('%s','now','-1 month')*1000,
  strftime('%s','now','-1 month')*1000
);

-- Session this month: قميص كلاسيكي أحمر
INSERT OR IGNORE INTO cutting_sessions (id, fabric_item_id, fabric_color, model_name, meters_used, layers, price_per_layer, session_date, created_at, updated_at)
VALUES (
  'seed-cs-005', '2cd9b069-11ad-4f74-899c-988b4d4b073a',
  'أحمر', 'قميص كلاسيكي', 14.0, 9, 500.0,
  strftime('%s','now','-5 days')*1000,
  strftime('%s','now','-5 days')*1000,
  strftime('%s','now','-5 days')*1000
);

-- ============================================================
-- 3. Add cutting pieces for new sessions
-- ============================================================

-- قميص كلاسيكي / أسود — session seed-cs-001
-- أمامي: S×8, M×12, L×10, XL×6  (36 total)
-- خلفي:  S×8, M×10, L×8,  XL×4  (30 total)
-- كم:    S×8, M×10, L×8,  XL×4  (30 total)
-- ياقة:  S×6, M×8,  L×6,  XL×4  (24 total)

-- أمامي S (8)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-s-1','seed-cs-001','أمامي','S','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-s-2','seed-cs-001','أمامي','S','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-s-3','seed-cs-001','أمامي','S','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-s-4','seed-cs-001','أمامي','S','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-s-5','seed-cs-001','أمامي','S','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-s-6','seed-cs-001','أمامي','S','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-s-7','seed-cs-001','أمامي','S','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-s-8','seed-cs-001','أمامي','S','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- أمامي M (12)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-1','seed-cs-001','أمامي','M','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-2','seed-cs-001','أمامي','M','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-3','seed-cs-001','أمامي','M','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-4','seed-cs-001','أمامي','M','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-5','seed-cs-001','أمامي','M','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-6','seed-cs-001','أمامي','M','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-7','seed-cs-001','أمامي','M','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-8','seed-cs-001','أمامي','M','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-9','seed-cs-001','أمامي','M','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-10','seed-cs-001','أمامي','M','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-11','seed-cs-001','أمامي','M','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-m-12','seed-cs-001','أمامي','M','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- أمامي L (10)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-1','seed-cs-001','أمامي','L','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-2','seed-cs-001','أمامي','L','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-3','seed-cs-001','أمامي','L','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-4','seed-cs-001','أمامي','L','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-5','seed-cs-001','أمامي','L','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-6','seed-cs-001','أمامي','L','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-7','seed-cs-001','أمامي','L','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-8','seed-cs-001','أمامي','L','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-9','seed-cs-001','أمامي','L','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-l-10','seed-cs-001','أمامي','L','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- أمامي XL (6) — zero not_distributed (all distributed or returned)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-xl-1','seed-cs-001','أمامي','XL','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-xl-2','seed-cs-001','أمامي','XL','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-xl-3','seed-cs-001','أمامي','XL','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-xl-4','seed-cs-001','أمامي','XL','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-xl-5','seed-cs-001','أمامي','XL','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-a-xl-6','seed-cs-001','أمامي','XL','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- خلفي S (8)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-b-s-1','seed-cs-001','خلفي','S','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-b-s-2','seed-cs-001','خلفي','S','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-b-s-3','seed-cs-001','خلفي','S','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-b-s-4','seed-cs-001','خلفي','S','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-b-s-5','seed-cs-001','خلفي','S','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-b-s-6','seed-cs-001','خلفي','S','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-b-s-7','seed-cs-001','خلفي','S','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-b-s-8','seed-cs-001','خلفي','S','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- كم M (10) — low stock: only 3 not_distributed
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-1','seed-cs-001','كم','M','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-2','seed-cs-001','كم','M','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-3','seed-cs-001','كم','M','أسود','not_distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-4','seed-cs-001','كم','M','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-5','seed-cs-001','كم','M','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-6','seed-cs-001','كم','M','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-7','seed-cs-001','كم','M','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-8','seed-cs-001','كم','M','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-9','seed-cs-001','كم','M','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-k-m-10','seed-cs-001','كم','M','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- ياقة L (6) — ZERO not_distributed
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-y-l-1','seed-cs-001','ياقة','L','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-y-l-2','seed-cs-001','ياقة','L','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-y-l-3','seed-cs-001','ياقة','L','أسود','distributed',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-y-l-4','seed-cs-001','ياقة','L','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-y-l-5','seed-cs-001','ياقة','L','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-001-y-l-6','seed-cs-001','ياقة','L','أسود','returned',strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- ============================================================
-- بنطال رسمي / أزرق — session seed-cs-002
-- ============================================================
-- أمامي S/M/L/XL, خلفي S/M/L/XL
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-1','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-2','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-3','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-4','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-5','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-6','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-7','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-8','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-9','seed-cs-002','أمامي','S','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-10','seed-cs-002','أمامي','S','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-11','seed-cs-002','أمامي','S','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-s-12','seed-cs-002','أمامي','S','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);

-- أمامي M (8)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-m-1','seed-cs-002','أمامي','M','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-m-2','seed-cs-002','أمامي','M','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-m-3','seed-cs-002','أمامي','M','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-m-4','seed-cs-002','أمامي','M','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-m-5','seed-cs-002','أمامي','M','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-m-6','seed-cs-002','أمامي','M','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-m-7','seed-cs-002','أمامي','M','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-m-8','seed-cs-002','أمامي','M','أزرق','returned',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);

-- أمامي L (6) — low stock: 2 not_distributed
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-l-1','seed-cs-002','أمامي','L','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-l-2','seed-cs-002','أمامي','L','أزرق','not_distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-l-3','seed-cs-002','أمامي','L','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-l-4','seed-cs-002','أمامي','L','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-l-5','seed-cs-002','أمامي','L','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-a-l-6','seed-cs-002','أمامي','L','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);

-- خلفي S/M — zero (all distributed)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-b-s-1','seed-cs-002','خلفي','S','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-b-s-2','seed-cs-002','خلفي','S','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-b-s-3','seed-cs-002','خلفي','S','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-b-s-4','seed-cs-002','خلفي','S','أزرق','returned',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-b-m-1','seed-cs-002','خلفي','M','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-b-m-2','seed-cs-002','خلفي','M','أزرق','distributed',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-002-b-m-3','seed-cs-002','خلفي','M','أزرق','returned',strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);

-- ============================================================
-- فستان سهرة / أحمر — session seed-cs-003 (low stock focus)
-- ============================================================
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-1','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-2','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-3','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-4','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-5','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-6','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-7','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-8','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-9','seed-cs-003','أمامي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-s-10','seed-cs-003','أمامي','S','أحمر','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- أمامي M (low: 4)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-m-1','seed-cs-003','أمامي','M','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-m-2','seed-cs-003','أمامي','M','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-m-3','seed-cs-003','أمامي','M','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-m-4','seed-cs-003','أمامي','M','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-m-5','seed-cs-003','أمامي','M','أحمر','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-m-6','seed-cs-003','أمامي','M','أحمر','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-m-7','seed-cs-003','أمامي','M','أحمر','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-a-m-8','seed-cs-003','أمامي','M','أحمر','returned',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- خلفي S (5 not_distributed — low)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-s-1','seed-cs-003','خلفي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-s-2','seed-cs-003','خلفي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-s-3','seed-cs-003','خلفي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-s-4','seed-cs-003','خلفي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-s-5','seed-cs-003','خلفي','S','أحمر','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-s-6','seed-cs-003','خلفي','S','أحمر','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-s-7','seed-cs-003','خلفي','S','أحمر','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- خلفي M (0 not_distributed — ZERO/red)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-m-1','seed-cs-003','خلفي','M','أحمر','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-m-2','seed-cs-003','خلفي','M','أحمر','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-m-3','seed-cs-003','خلفي','M','أحمر','returned',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-003-b-m-4','seed-cs-003','خلفي','M','أحمر','returned',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- ============================================================
-- جاكيت شتوي / أسود — session seed-cs-004
-- ============================================================
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-1','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-2','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-3','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-4','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-5','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-6','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-7','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-8','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-9','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-10','seed-cs-004','أمامي','M','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-11','seed-cs-004','أمامي','M','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-m-12','seed-cs-004','أمامي','M','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- أمامي L (15 not_distributed — good)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-1','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-2','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-3','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-4','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-5','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-6','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-7','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-8','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-9','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-10','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-11','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-12','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-13','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-14','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-15','seed-cs-004','أمامي','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-16','seed-cs-004','أمامي','L','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-a-l-17','seed-cs-004','أمامي','L','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- كم L (3 not_distributed — low)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-k-l-1','seed-cs-004','كم','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-k-l-2','seed-cs-004','كم','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-k-l-3','seed-cs-004','كم','L','أسود','not_distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-k-l-4','seed-cs-004','كم','L','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-k-l-5','seed-cs-004','كم','L','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-k-l-6','seed-cs-004','كم','L','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-k-l-7','seed-cs-004','كم','L','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- ياقة XL (0 not_distributed — ZERO/red)
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-y-xl-1','seed-cs-004','ياقة','XL','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-y-xl-2','seed-cs-004','ياقة','XL','أسود','distributed',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-004-y-xl-3','seed-cs-004','ياقة','XL','أسود','returned',strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- ============================================================
-- قميص كلاسيكي / أحمر — session seed-cs-005 (fresh, all not_distributed)
-- ============================================================
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-s-1','seed-cs-005','أمامي','S','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-s-2','seed-cs-005','أمامي','S','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-s-3','seed-cs-005','أمامي','S','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-s-4','seed-cs-005','أمامي','S','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-s-5','seed-cs-005','أمامي','S','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-m-1','seed-cs-005','أمامي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-m-2','seed-cs-005','أمامي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-m-3','seed-cs-005','أمامي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-m-4','seed-cs-005','أمامي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-m-5','seed-cs-005','أمامي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-m-6','seed-cs-005','أمامي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-m-7','seed-cs-005','أمامي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-l-1','seed-cs-005','أمامي','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-l-2','seed-cs-005','أمامي','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-l-3','seed-cs-005','أمامي','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-l-4','seed-cs-005','أمامي','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-a-l-5','seed-cs-005','أمامي','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-s-1','seed-cs-005','خلفي','S','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-s-2','seed-cs-005','خلفي','S','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-s-3','seed-cs-005','خلفي','S','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-m-1','seed-cs-005','خلفي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-m-2','seed-cs-005','خلفي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-m-3','seed-cs-005','خلفي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-m-4','seed-cs-005','خلفي','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-l-1','seed-cs-005','خلفي','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-b-l-2','seed-cs-005','خلفي','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-k-m-1','seed-cs-005','كم','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-k-m-2','seed-cs-005','كم','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-k-m-3','seed-cs-005','كم','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-k-m-4','seed-cs-005','كم','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-k-l-1','seed-cs-005','كم','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-k-l-2','seed-cs-005','كم','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-k-l-3','seed-cs-005','كم','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-y-m-1','seed-cs-005','ياقة','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-y-m-2','seed-cs-005','ياقة','M','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-y-l-1','seed-cs-005','ياقة','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);
INSERT OR IGNORE INTO cutting_pieces (id, session_id, part_name, size_label, color, status, created_at, updated_at) VALUES ('cp-005-y-l-2','seed-cs-005','ياقة','L','أحمر','not_distributed',strftime('%s','now','-5 days')*1000,strftime('%s','now','-5 days')*1000);

-- ============================================================
-- 4. Additional distribution batches (past months for chart)
-- ============================================================
-- Tailors: أحمد=c529cf8f, مريم=5ff1861f, يوسف=567d7829, سارة=eb26ac58

-- 3 months ago distributions
INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-001','c529cf8f-a98b-4fdd-a390-2619bd659545','قميص كلاسيكي','أمامي','M','أسود',5,320.0,1600.0,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-002','5ff1861f-8a63-41d1-9686-dc6d4c833208','قميص كلاسيكي','أمامي','L','أسود',3,320.0,960.0,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-003','567d7829-b618-4aca-bdc0-2cd953ec2f54','قميص كلاسيكي','خلفي','S','أسود',3,300.0,900.0,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- 2 months ago
INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-004','c529cf8f-a98b-4fdd-a390-2619bd659545','بنطال رسمي','أمامي','S','أزرق',3,400.0,1200.0,strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-005','5ff1861f-8a63-41d1-9686-dc6d4c833208','بنطال رسمي','أمامي','M','أزرق',2,400.0,800.0,strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-006','eb26ac58-0377-4d09-bb28-d26930ed12a6','بنطال رسمي','خلفي','S','أزرق',4,380.0,1520.0,strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-007','567d7829-b618-4aca-bdc0-2cd953ec2f54','بنطال رسمي','خلفي','M','أزرق',2,380.0,760.0,strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000,strftime('%s','now','-2 months')*1000);

-- 1 month ago
INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-008','c529cf8f-a98b-4fdd-a390-2619bd659545','فستان سهرة','أمامي','M','أحمر',3,450.0,1350.0,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-009','5ff1861f-8a63-41d1-9686-dc6d4c833208','فستان سهرة','أمامي','S','أحمر',1,450.0,450.0,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-010','eb26ac58-0377-4d09-bb28-d26930ed12a6','فستان سهرة','خلفي','S','أحمر',2,420.0,840.0,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-011','c529cf8f-a98b-4fdd-a390-2619bd659545','جاكيت شتوي','أمامي','M','أسود',2,500.0,1000.0,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-012','567d7829-b618-4aca-bdc0-2cd953ec2f54','جاكيت شتوي','أمامي','L','أسود',2,500.0,1000.0,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-013','eb26ac58-0377-4d09-bb28-d26930ed12a6','جاكيت شتوي','كم','L','أسود',4,480.0,1920.0,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-014','c529cf8f-a98b-4fdd-a390-2619bd659545','جاكيت شتوي','ياقة','XL','أسود',3,460.0,1380.0,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000,strftime('%s','now','-1 month')*1000);

-- ياقة L أسود — ZERO (3 distributed from new session pieces)
INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-015','5ff1861f-8a63-41d1-9686-dc6d4c833208','قميص كلاسيكي','ياقة','L','أسود',3,300.0,900.0,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- أمامي XL أسود — ZERO (3 distributed)
INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-016','567d7829-b618-4aca-bdc0-2cd953ec2f54','قميص كلاسيكي','أمامي','XL','أسود',3,320.0,960.0,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000,strftime('%s','now','-3 months')*1000);

-- This week distributions (for current month chart)
INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-017','c529cf8f-a98b-4fdd-a390-2619bd659545','فستان سهرة','خلفي','M','أحمر',2,420.0,840.0,strftime('%s','now','-2 days')*1000,strftime('%s','now','-2 days')*1000,strftime('%s','now','-2 days')*1000);

INSERT OR IGNORE INTO distribution_batches (id, tailor_id, model_name, part_name, size_label, color, quantity, sewing_price_per_piece, total_cost, distribution_date, created_at, updated_at)
VALUES ('seed-db-018','5ff1861f-8a63-41d1-9686-dc6d4c833208','فستان سهرة','أمامي','L','أزرق',7,450.0,3150.0,strftime('%s','now','-2 days')*1000,strftime('%s','now','-2 days')*1000,strftime('%s','now','-2 days')*1000);

-- ============================================================
-- 5. Mark pieces as distributed to match new distribution_batches
-- ============================================================
-- seed-db-001: قميص كلاسيكي أمامي M أسود — 5 pieces (cp-001-a-m-6..10)
-- already inserted as distributed above

-- ============================================================
-- 6. Ensure app_settings threshold is set
-- ============================================================
INSERT OR REPLACE INTO app_settings (key, value, updated_at)
VALUES ('low_stock_threshold', '8', strftime('%s','now')*1000);

COMMIT;
