// src/utils/date.js
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function monthLabel(year, month /* 0-11 */) {
  return `${MONTH_NAMES[month]} ${year}`;
}

/**
 * Builds a 7-column grid for the given month, leading with blank cells so
 * day 1 lands under the correct weekday (S M T W T F S).
 * eventsByDate: { 'YYYY-MM-DD': string[] of event type keys }
 */
export function buildMonthGrid(year, month, eventsByDate = {}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay(); // 0 = Sunday

  const cells = Array.from({ length: leadingBlanks }, () => null);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    cells.push({
      day,
      dateKey,
      date,
      eventTypes: eventsByDate[dateKey] || [],
    });
  }

  return cells;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatFullDate(date) {
  // e.g. "August 12, Wednesday"
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' });
}

export function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export { MONTH_NAMES };
