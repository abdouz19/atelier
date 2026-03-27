/**
 * App appearance settings queries.
 * All settings stored in the app_settings key/value table.
 */

const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_COLORS = ['blue', 'indigo', 'emerald', 'rose', 'amber', 'slate'];

const DEFAULTS = {
  appearance_theme: 'system',
  appearance_primary_color: 'blue',
  appearance_logo: '',
};

/**
 * Get appearance settings (theme + primaryColor).
 * @param {import('better-sqlite3').Database} db
 * @returns {{ theme: string, primaryColor: string }}
 */
function getAppearanceSettings(db) {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (key !== 'appearance_logo') {
      db.prepare(
        `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)`
      ).run(key, value, Date.now());
    }
  }
  const theme = db.prepare(`SELECT value FROM app_settings WHERE key = 'appearance_theme'`).get();
  const color = db.prepare(`SELECT value FROM app_settings WHERE key = 'appearance_primary_color'`).get();
  return {
    theme: theme ? theme.value : DEFAULTS.appearance_theme,
    primaryColor: color ? color.value : DEFAULTS.appearance_primary_color,
  };
}

/**
 * Set appearance settings (theme + primaryColor).
 * @param {import('better-sqlite3').Database} db
 * @param {{ theme: string, primaryColor: string }} settings
 */
function setAppearanceSettings(db, { theme, primaryColor }) {
  const now = Date.now();
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('appearance_theme', ?, ?)`
  ).run(theme, now);
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('appearance_primary_color', ?, ?)`
  ).run(primaryColor, now);
}

/**
 * Get logo (base64 data URL or null).
 * @param {import('better-sqlite3').Database} db
 * @returns {{ logo: string | null }}
 */
function getLogo(db) {
  const row = db.prepare(`SELECT value FROM app_settings WHERE key = 'appearance_logo'`).get();
  return { logo: row && row.value ? row.value : null };
}

/**
 * Set logo (base64 data URL).
 * @param {import('better-sqlite3').Database} db
 * @param {string} dataUrl
 */
function setLogo(db, dataUrl) {
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('appearance_logo', ?, ?)`
  ).run(dataUrl, Date.now());
}

/**
 * Remove logo (set value to empty string).
 * @param {import('better-sqlite3').Database} db
 */
function removeLogo(db) {
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('appearance_logo', '', ?)`
  ).run(Date.now());
}

/**
 * Reset all appearance settings to defaults.
 * @param {import('better-sqlite3').Database} db
 * @returns {{ theme: string, primaryColor: string, logo: null }}
 */
function resetAppearanceToDefaults(db) {
  const now = Date.now();
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('appearance_theme', ?, ?)`
  ).run(DEFAULTS.appearance_theme, now);
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('appearance_primary_color', ?, ?)`
  ).run(DEFAULTS.appearance_primary_color, now);
  db.prepare(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('appearance_logo', '', ?)`
  ).run(now);
  return { theme: DEFAULTS.appearance_theme, primaryColor: DEFAULTS.appearance_primary_color, logo: null };
}

module.exports = {
  getAppearanceSettings,
  setAppearanceSettings,
  getLogo,
  setLogo,
  removeLogo,
  resetAppearanceToDefaults,
  VALID_THEMES,
  VALID_COLORS,
};
