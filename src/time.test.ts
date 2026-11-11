import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, addMonths, formatDateRange, formatTimes, zonedTime } from './time.ts';

test('calendar arithmetic', () => {
  assert.equal(addDays('2026-12-09', -7), '2026-12-02');
  assert.equal(addDays('2027-03-01', -1), '2027-02-28');
  assert.equal(addMonths('2026-12-09', -2), '2026-10-09');
  assert.equal(addMonths('2027-03-31', -1), '2027-02-28');
});

test('zonedTime handles winter and summer time', () => {
  assert.equal(zonedTime('2026-12-09', '09:00', 'Europe/London').toISOString(), '2026-12-09T09:00:00.000Z');
  assert.equal(zonedTime('2027-07-01', '09:00', 'Europe/London').toISOString(), '2027-07-01T08:00:00.000Z');
  assert.equal(zonedTime('2027-07-01', '09:00', 'America/New_York').toISOString(), '2027-07-01T13:00:00.000Z');
});

test('formatTimes shows every zone, with the weekday when the day differs', () => {
  assert.deepEqual(formatTimes(new Date('2026-12-09T16:00:00Z')), ['4pm GMT', '5pm Paris', '11am New York', '8am LA']);
  assert.deepEqual(formatTimes(new Date('2026-12-09T01:30:00Z'), { approx: true }), [
    '~1:30am GMT',
    '~2:30am Paris',
    '~8:30pm Tue New York',
    '~5:30pm Tue LA',
  ]);
});

test('formatDateRange', () => {
  assert.equal(formatDateRange('2026-12-09', '2026-12-13'), 'Dec 9–13');
  assert.equal(formatDateRange('2026-11-30', '2026-12-02'), 'Nov 30 – Dec 2');
  assert.equal(formatDateRange('2026-12-30', '2027-01-02'), 'Dec 30, 2026 – Jan 2, 2027');
});
