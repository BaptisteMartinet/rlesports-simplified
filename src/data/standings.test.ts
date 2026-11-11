import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findRank, teamKey, topTeams } from './standings.ts';
import type { Standings } from './types.ts';

const standings = (entries: [string, number][]): Standings => ({
  label: 'test',
  asOf: '2026-01-01',
  sources: [],
  entries: entries.map(([team, points]) => ({ team, points, region: 'EU' })),
});

test('ranks across entries by points, highest first', () => {
  const top = topTeams(standings([['B', 10], ['A', 30], ['C', 20]]), 2);
  assert.deepEqual(top.map((t) => [t.team, t.rank]), [['A', 1], ['C', 2]]);
});

test('teams tied with the last place are all kept', () => {
  const top = topTeams(standings([['A', 30], ['B', 20], ['C', 20], ['D', 5]]), 2);
  assert.deepEqual(top.map((t) => [t.team, t.rank]), [['A', 1], ['B', 2], ['C', 2]]);
});

test('team names match across spelling differences', () => {
  assert.equal(teamKey('FURIA'), teamKey('Furia'));
  assert.equal(teamKey('Virtus.pro'), teamKey('Virtus Pro'));
  const top = topTeams(standings([['Team Falcons', 50]]), 10);
  assert.equal(findRank(top, 'team falcons'), 1);
  assert.equal(findRank(top, 'NRG'), undefined);
});
