/**
 * Pure UTC time handling and formatting library.
 * Strict compliance: Never relies on local browser time for canonical calculations.
 */

export interface ParsedUtcDate {
  year: number;
  month: number; // 1 - 12
  day: number;   // 1 - 31
  hours: number; // 0 - 23
  minutes: number; // 0 - 59
  seconds: number; // 0 - 59
}

export interface UtcValidationResult {
  isValid: boolean;
  errorMessage?: string;
  normalizedIsoUtc?: string;
}

/**
 * Validates a UTC date string (YYYY-MM-DD) and time string (HH:mm or HH:mm:ss).
 * Returns validation result without silent coercion.
 */
export function validateUtcDateTime(dateStr: string, timeStr: string): UtcValidationResult {
  const trimmedDate = dateStr.trim();
  const trimmedTime = timeStr.trim();

  // Validate Date portion: YYYY-MM-DD
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const dateMatch = trimmedDate.match(dateRegex);
  if (!dateMatch) {
    return {
      isValid: false,
      errorMessage: 'Invalid date format. Expected YYYY-MM-DD (e.g., 2026-10-21).',
    };
  }

  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  const day = parseInt(dateMatch[3], 10);

  if (month < 1 || month > 12) {
    return { isValid: false, errorMessage: `Month must be between 01 and 12 (got ${month}).` };
  }

  // Days in month validation (accounting for leap years)
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDays = daysInMonths[month - 1];

  if (day < 1 || day > maxDays) {
    return {
      isValid: false,
      errorMessage: `Day must be between 01 and ${maxDays} for ${year}-${String(month).padStart(2, '0')}.`,
    };
  }

  // Validate Time portion: HH:mm or HH:mm:ss
  const timeRegex = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
  const timeMatch = trimmedTime.match(timeRegex);
  if (!timeMatch) {
    return {
      isValid: false,
      errorMessage: 'Invalid time format. Expected HH:mm or HH:mm:ss in 24h format (e.g., 12:00 or 12:00:00).',
    };
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;

  if (hours < 0 || hours > 23) {
    return { isValid: false, errorMessage: 'Hours must be between 00 and 23.' };
  }
  if (minutes < 0 || minutes > 59) {
    return { isValid: false, errorMessage: 'Minutes must be between 00 and 59.' };
  }
  if (seconds < 0 || seconds > 59) {
    return { isValid: false, errorMessage: 'Seconds must be between 00 and 59.' };
  }

  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  const h = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  const s = String(seconds).padStart(2, '0');

  return {
    isValid: true,
    normalizedIsoUtc: `${y}-${m}-${d}T${h}:${min}:${s}Z`,
  };
}

/**
 * Format a Date object to ISO UTC string (e.g., 2026-10-21T12:00:00Z)
 */
export function formatIsoUtc(date: Date): string {
  const y = String(date.getUTCFullYear()).padStart(4, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${s}Z`;
}

/**
 * Format a Date object for clear UI display with explicit UTC suffix
 * e.g., "2026-10-21 12:00:00 UTC"
 */
export function formatDisplayUtc(date: Date): string {
  const y = String(date.getUTCFullYear()).padStart(4, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s} UTC`;
}

/**
 * Split an ISO UTC string into separate date (YYYY-MM-DD) and time (HH:mm:ss) parts
 */
export function splitIsoUtc(isoString: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { dateStr: '2026-10-21', timeStr: '12:00:00' };
    }
    const y = String(d.getUTCFullYear()).padStart(4, '0');
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    const s = String(d.getUTCSeconds()).padStart(2, '0');
    return {
      dateStr: `${y}-${m}-${day}`,
      timeStr: `${h}:${min}:${s}`,
    };
  } catch {
    return { dateStr: '2026-10-21', timeStr: '12:00:00' };
  }
}

/**
 * Add or subtract time (in minutes or hours) from an ISO UTC string.
 */
export function stepUtc(isoString: string, deltaMinutes: number): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  d.setUTCMinutes(d.getUTCMinutes() + deltaMinutes);
  return formatIsoUtc(d);
}

/**
 * Calculate Julian Date (JD) from Date object.
 * Standard astronomical formula for J2000 epoch reference.
 */
export function getJulianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Convert Julian Date back to UTC Date.
 */
export function julianDateToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}
