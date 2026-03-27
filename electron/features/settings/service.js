/**
 * App appearance settings service — validation only.
 */

const { VALID_THEMES, VALID_COLORS } = require('./queries');

/**
 * Validate appearance settings payload.
 * @param {{ theme: unknown, primaryColor: unknown }} payload
 * @throws {Error} if invalid
 */
function validateAppearanceSettings({ theme, primaryColor }) {
  if (!VALID_THEMES.includes(theme)) {
    throw new Error(`قيمة المظهر غير صالحة: ${theme}`);
  }
  if (!VALID_COLORS.includes(primaryColor)) {
    throw new Error(`قيمة اللون غير صالحة: ${primaryColor}`);
  }
}

/**
 * Validate logo upload payload.
 * @param {string} dataUrl - base64 data URL
 * @throws {Error} if format or size is invalid
 */
function validateLogoUpload(dataUrl) {
  const ACCEPTED_PREFIXES = [
    'data:image/png;base64,',
    'data:image/jpeg;base64,',
    'data:image/svg+xml;base64,',
  ];
  const hasValidPrefix = ACCEPTED_PREFIXES.some((p) => dataUrl.startsWith(p));
  if (!hasValidPrefix) {
    throw new Error('نوع الملف غير مدعوم. يُقبل فقط: PNG، JPG، SVG');
  }

  // Estimate decoded byte size from base64 body length
  const commaIdx = dataUrl.indexOf(',');
  const base64Body = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const decodedBytes = Math.ceil(base64Body.length * 0.75);
  const MAX_BYTES = 2 * 1024 * 1024; // 2MB
  if (decodedBytes > MAX_BYTES) {
    throw new Error('حجم الملف يتجاوز الحد المسموح به (2 ميغابايت)');
  }
}

module.exports = { validateAppearanceSettings, validateLogoUpload };
