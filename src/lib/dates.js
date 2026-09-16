/**
 * The house date format, DD-Mon-YYYY — 16-Sep-2026.
 *
 * Mirrors MenuDashboard/src/lib/dates.js so a KOT from the floor and a report
 * from the office spell the same day the same way. Month names are a fixed
 * English list rather than toLocaleDateString, whose output depends on the
 * tablet's language setting.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(value, fallback = '--') {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
}
