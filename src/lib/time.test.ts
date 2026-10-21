import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUtcDateTime,
  formatIsoUtc,
  formatDisplayUtc,
  splitIsoUtc,
  stepUtc,
  getJulianDate,
} from './time';

test('UTC Time: validateUtcDateTime correctly validates standard ISO dates and times', () => {
  const result = validateUtcDateTime('2026-10-21', '12:00:00');
  assert.equal(result.isValid, true);
  assert.equal(result.normalizedIsoUtc, '2026-10-21T12:00:00Z');
});

test('UTC Time: validateUtcDateTime rejects invalid month and leap-year edge cases', () => {
  // Invalid month
  const badMonth = validateUtcDateTime('2026-13-01', '12:00:00');
  assert.equal(badMonth.isValid, false);
  assert.match(badMonth.errorMessage || '', /Month must be between/);

  // Non-leap year Feb 29
  const badFeb = validateUtcDateTime('2026-02-29', '12:00:00');
  assert.equal(badFeb.isValid, false);
  assert.match(badFeb.errorMessage || '', /Day must be between 01 and 28/);

  // Leap year Feb 29 (2028 is leap year)
  const goodLeapFeb = validateUtcDateTime('2028-02-29', '12:00:00');
  assert.equal(goodLeapFeb.isValid, true);
});

test('UTC Time: validateUtcDateTime rejects invalid hours and minutes', () => {
  const badHour = validateUtcDateTime('2026-10-21', '25:00:00');
  assert.equal(badHour.isValid, false);

  const badMin = validateUtcDateTime('2026-10-21', '12:65:00');
  assert.equal(badMin.isValid, false);
});

test('UTC Time: stepUtc accurately advances and rolls back UTC time without timezone drift', () => {
  const initial = '2026-10-21T23:30:00Z';
  const steppedForward = stepUtc(initial, 60); // +1 hour
  assert.equal(steppedForward, '2026-10-22T00:30:00Z');

  const steppedBack = stepUtc(initial, -30); // -30 min
  assert.equal(steppedBack, '2026-10-21T23:00:00Z');
});

test('UTC Time: formatDisplayUtc produces clean explicit UTC representation', () => {
  const d = new Date(Date.UTC(2026, 9, 21, 14, 30, 0));
  assert.equal(formatDisplayUtc(d), '2026-10-21 14:30:00 UTC');
});

test('UTC Time: splitIsoUtc correctly separates YYYY-MM-DD and HH:mm:ss without Date string leaking', () => {
  const { dateStr, timeStr } = splitIsoUtc('2026-10-21T12:00:00Z');
  assert.equal(dateStr, '2026-10-21');
  assert.equal(timeStr, '12:00:00');
});

test('UTC Time: getJulianDate matches standard astronomical J2000 epoch reference', () => {
  // 2000-01-01 12:00:00 UTC is exactly JD 2451545.0
  const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
  const jd = getJulianDate(j2000);
  assert.equal(Math.abs(jd - 2451545.0) < 0.0001, true);
});
