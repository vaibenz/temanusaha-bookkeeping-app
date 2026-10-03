// All dates are handled as local "YYYY-MM-DD" keys so a merchant's day never shifts with time zones.
export function dayKey(date = new Date()) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function daysBetween(fromKey, toKey) {
  return Math.round((parseDay(toKey) - parseDay(fromKey)) / 86400000);
}

export function lastNDays(endKey, n) {
  return Array.from({ length: n }, (_, i) => addDays(endKey, i - n + 1));
}
