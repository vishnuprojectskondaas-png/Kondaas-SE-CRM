/**
 * Centralized Date & Time Formatter
 * Formats all dates and timestamps to DD-MM-YYYY hh:mm:ss AM/PM format
 */

export function formatDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '-';

  let d: Date;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '-';
    // If already in DD-MM-YYYY hh:mm:ss AM/PM format
    if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2} (AM|PM)$/i.test(trimmed)) {
      return trimmed;
    }
    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    d = new Date(normalized);
    if (isNaN(d.getTime())) {
      d = new Date(trimmed);
    }
  } else {
    d = new Date(dateInput);
  }

  if (isNaN(d.getTime())) {
    return String(dateInput);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const hoursStr = String(hours).padStart(2, '0');

  return `${day}-${month}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
}

export function formatDateDDMMYYYY(dateInput: string | number | Date | null | undefined): string {
  return formatDateTime(dateInput);
}

/**
 * Returns YYYY-MM string for a given date
 */
export function getYearMonthKey(dateInput: string | number | Date | null | undefined): string | null {
  if (!dateInput) return null;
  let d: Date;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    d = new Date(trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T'));
    if (isNaN(d.getTime())) d = new Date(trimmed);
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Converts YYYY-MM to readable label, e.g., "August 2026"
 */
export function formatMonthYearLabel(yearMonthKey: string): string {
  if (!yearMonthKey || yearMonthKey === 'ALL') return 'All Months';
  const parts = yearMonthKey.split('-');
  if (parts.length !== 2) return yearMonthKey;
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  if (monthIndex >= 0 && monthIndex < 12 && !isNaN(year)) {
    return `${monthNames[monthIndex]} ${year}`;
  }
  return yearMonthKey;
}

/**
 * Checks if a given date falls within the specified YYYY-MM key
 */
export function isDateInMonth(dateInput: string | number | Date | null | undefined, yearMonthKey: string): boolean {
  if (!yearMonthKey || yearMonthKey === 'ALL') return true;
  if (!dateInput) return false;
  return getYearMonthKey(dateInput) === yearMonthKey;
}

/**
 * Returns YYYY-MM-DD string for a given date in local time
 */
export function getExactDateKey(dateInput: string | number | Date | null | undefined): string | null {
  if (!dateInput) return null;
  let d: Date;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    d = new Date(trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T'));
    if (isNaN(d.getTime())) d = new Date(trimmed);
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Checks if a given date falls on the exact YYYY-MM-DD date
 */
export function isDateOnExactDay(dateInput: string | number | Date | null | undefined, exactDateKey: string): boolean {
  if (!exactDateKey || exactDateKey === 'ALL' || exactDateKey === '') return true;
  if (!dateInput) return false;
  return getExactDateKey(dateInput) === exactDateKey;
}

/**
 * Format YYYY-MM-DD date to a clean readable string like "30 Aug 2026"
 */
export function formatExactDateLabel(exactDateKey: string): string {
  if (!exactDateKey || exactDateKey === 'ALL') return 'All Dates';
  const parts = exactDateKey.split('-');
  if (parts.length !== 3) return exactDateKey;
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIndex) || isNaN(day)) return exactDateKey;

  const d = new Date(year, monthIndex, day);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Returns Monday (start) and Sunday (end) of the week for a given reference date and offset
 */
export function getWeekRange(referenceDate: Date = new Date(), weekOffset: number = 0): { start: Date; end: Date; startKey: string; endKey: string; label: string } {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + weekOffset * 7);

  // Day of week: 0 is Sunday, 1 is Monday...
  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday

  const start = new Date(d.setDate(diffToMonday));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const startKey = getExactDateKey(start) || '';
  const endKey = getExactDateKey(end) || '';

  const label = weekOffset === 0 
    ? `This Week (${formatExactDateLabel(startKey)} - ${formatExactDateLabel(endKey)})`
    : weekOffset === -1 
    ? `Last Week (${formatExactDateLabel(startKey)} - ${formatExactDateLabel(endKey)})`
    : weekOffset === 1
    ? `Next Week (${formatExactDateLabel(startKey)} - ${formatExactDateLabel(endKey)})`
    : `${formatExactDateLabel(startKey)} to ${formatExactDateLabel(endKey)}`;

  return { start, end, startKey, endKey, label };
}

/**
 * Checks if a given date falls within a week range (inclusive)
 */
export function isDateInWeek(dateInput: string | number | Date | null | undefined, weekStartKey: string, weekEndKey: string): boolean {
  if (!dateInput || !weekStartKey || !weekEndKey) return true;
  const dateKey = getExactDateKey(dateInput);
  if (!dateKey) return false;
  return dateKey >= weekStartKey && dateKey <= weekEndKey;
}



