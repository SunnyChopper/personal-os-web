import type { Habit, HabitLog } from '@/types/growth-system';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateInput(dateString: string): Date {
  if (DATE_ONLY_PATTERN.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
}

/**
 * Extract date-only string (YYYY-MM-DD) from a date string, handling both ISO format and plain date strings.
 * This prevents timezone conversion issues when the backend returns ISO strings.
 * IMPORTANT: Never create Date objects that could cause timezone shifts - always extract the string directly.
 */
export function extractDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return '';

  // If already in YYYY-MM-DD format, return as-is (most common case)
  if (DATE_ONLY_PATTERN.test(dateString)) {
    return dateString;
  }

  // If it's an ISO string (contains 'T'), extract just the date part before 'T'
  // This is safe because we're extracting the string directly, not parsing as a Date
  if (dateString.includes('T')) {
    const datePart = dateString.split('T')[0];
    // Verify it's a valid YYYY-MM-DD format
    if (DATE_ONLY_PATTERN.test(datePart)) {
      return datePart;
    }
  }

  // Try to extract YYYY-MM-DD from the beginning of the string
  // This handles cases like "2026-01-25T00:00:00.000Z" or "2026-01-25 00:00:00"
  const dateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch && dateMatch[1]) {
    return dateMatch[1];
  }

  // If we can't extract a valid date, use parseDateInput as a last resort
  // This handles edge cases where the date might be in a different format
  try {
    const parsedDate = parseDateInput(dateString);
    // Use local date components to avoid timezone shifts
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Could not extract YYYY-MM-DD from date string:', dateString, error);
    return '';
  }
}

export function formatDateString(
  dateString: string | null,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string | null {
  if (!dateString) return null;
  const parsed = parseDateInput(dateString);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-US', options);
}

/**
 * Format a date as a relative string (e.g., "2 days ago", "Today", "Yesterday")
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 0 && diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 0 && diffDays > -7) return `In ${Math.abs(diffDays)} days`;
  if (diffDays >= 7 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date range (e.g., "Jan 3 - Jan 10, 2026")
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const sameYear = startYear === endYear;

  if (sameYear) {
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();
    const sameMonth = startMonth === endMonth;

    if (sameMonth) {
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
    }

    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

/**
 * Format a date with context based on the habit
 */
export function formatDateWithContext(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const relative = formatRelativeDate(dateObj);

  // For recent dates, use relative format
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) <= 7) {
    return relative;
  }

  // For older dates, use formatted date
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Calculate the next expected completion date for a habit
 */
export function getNextExpectedDate(
  habit: Habit,
  lastCompletedDate: Date | string | null
): Date | null {
  if (!lastCompletedDate) {
    // If never completed, next expected is today (for daily) or start of next period
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (habit.frequency === 'Daily') {
      return today;
    }

    // For weekly/monthly, calculate based on frequency
    return today;
  }

  const lastDate =
    typeof lastCompletedDate === 'string' ? new Date(lastCompletedDate) : lastCompletedDate;
  lastDate.setHours(0, 0, 0, 0);

  const nextDate = new Date(lastDate);

  switch (habit.frequency) {
    case 'Daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'Weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      return null;
  }

  return nextDate;
}

/**
 * Get the last completed date from logs
 */
export function getLastCompletedDateFromLogs(logs: HabitLog[]): Date | null {
  if (logs.length === 0) return null;

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  return new Date(sortedLogs[0].completedAt);
}

/**
 * Format completion date for display in lists
 */
export function formatCompletionDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Convert a Date or ISO string to a local datetime-local format string (YYYY-MM-DDTHH:mm)
 * This is used for datetime-local input fields which expect local time, not UTC
 */
export function toLocalDateTimeString(date: Date | string | null | undefined): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return '';

  // Get local date components
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert a datetime-local string (YYYY-MM-DDTHH:mm) to an ISO string
 * The datetime-local value is interpreted as local time, so we need to convert it properly
 */
export function fromLocalDateTimeString(localDateTimeString: string): string {
  if (!localDateTimeString) {
    return new Date().toISOString();
  }

  // Parse the local datetime string (YYYY-MM-DDTHH:mm)
  // Create a Date object treating it as local time
  const [datePart, timePart] = localDateTimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Create date in local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes);

  // Return as ISO string (this will be the correct UTC representation)
  return localDate.toISOString();
}
