import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseSeasonFile } from './seasonFile.ts';
import { DEFAULT_SEASON_FILE } from '../index.ts';

test('the current season file is valid', async () => {
  const file = parseSeasonFile(await readFile(DEFAULT_SEASON_FILE, 'utf8'), DEFAULT_SEASON_FILE);
  assert.ok(file.events.length > 0);
});

const base = `
season: Test
updated: 2026-01-01
events:
`;
const event = (extra: string) => `${base}  - id: e1
    name: Event
    timezone: Europe/London
    sources: [https://example.com]
${extra}`;

test('rejects a confirmed event without dates', () => {
  assert.throws(
    () => parseSeasonFile(event('    kind: major\n    status: confirmed\n    online: false\n    location: { city: London, country: UK }\n')),
    /needs startDate and endDate/,
  );
});

test('rejects an end date before the start date', () => {
  assert.throws(
    () =>
      parseSeasonFile(
        event('    kind: open\n    region: EU\n    status: confirmed\n    online: true\n    startDate: 2026-02-02\n    endDate: 2026-02-01\n'),
      ),
    /endDate is before startDate/,
  );
});

test('rejects an unknown time zone and unknown fields', () => {
  assert.throws(() => parseSeasonFile(event('    kind: finale\n    status: tba\n    online: false\n').replace('Europe/London', 'Mars/Base')), /time zone/);
  assert.throws(() => parseSeasonFile(event('    kind: finale\n    status: tba\n    online: false\n    city: Paris\n')));
});

test('accepts a TBA LAN event without dates or location', () => {
  const file = parseSeasonFile(event('    kind: finale\n    status: tba\n    online: false\n'));
  assert.equal(file.events[0]?.status, 'tba');
});
