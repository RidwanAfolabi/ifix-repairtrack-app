const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The API mixes UTC (`datetime('now')` columns like status_history.timestamp,
// jobs.created_at/updated_at) and Malaysia-time strings (warranty_start_date,
// warranty_claimed_at, from services/warranty.ts) without a marker to tell
// them apart. Reinterpreting either through `new Date(...)` risks silently
// shifting one of them by 8 hours, so these just reformat the stored
// 'YYYY-MM-DD[ HH:MM:SS]' text as-is, with no timezone conversion.
export function formatDateTime(raw) {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(raw);
  if (!match) return raw;
  const [, y, mo, d, h, mi] = match;
  const datePart = `${d} ${MONTHS[Number(mo) - 1]} ${y}`;
  if (h === undefined) return datePart;
  const hour = Number(h);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${datePart}, ${hour12}:${mi} ${period}`;
}

export function formatDate(raw) {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return raw;
  const [, y, mo, d] = match;
  return `${d} ${MONTHS[Number(mo) - 1]} ${y}`;
}
