import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duePosts, type RuleInput } from './rules.ts';
import type { RankedTeam } from './data/standings.ts';
import type { Match, RlEvent } from './data/types.ts';

const london: RlEvent = {
  id: 'kickoff',
  name: 'RLCS Club Championship Kick-Off',
  kind: 'kickoff',
  status: 'confirmed',
  online: false,
  startDate: '2026-12-09',
  endDate: '2026-12-13',
  timezone: 'Europe/London',
  location: { city: 'London', country: 'United Kingdom' },
  sources: [],
};
const major: RlEvent = { ...london, id: 'major', name: 'RLCS Major', kind: 'major' };
const open: RlEvent = {
  id: 'open',
  name: 'RLCS Open EU',
  kind: 'open',
  status: 'confirmed',
  online: true,
  region: 'EU',
  startDate: '2026-11-20',
  endDate: '2026-11-22',
  timezone: 'Europe/Paris',
  sources: [],
};
const top: RankedTeam[] = [
  { team: 'Karmine Corp', region: 'EU', points: 112, rank: 1 },
  { team: 'Vitality', region: 'EU', points: 97, rank: 4 },
];

const run = (now: string, over: Partial<RuleInput> = {}) =>
  duePosts({ now: new Date(now), events: [london], matches: new Map(), top, posted: new Set(), ...over }).map((p) => p.key);

const match = (over: Partial<Match>): Match => ({
  id: 'm1',
  eventId: 'kickoff',
  playoffs: true,
  isGrandFinal: false,
  scheduledAt: '2026-12-10T15:00:00Z',
  teams: ['Karmine Corp', 'Vitality'],
  status: 'scheduled',
  ...over,
});

test('7-day announcement is due at 14:00 UTC, as a feed post and a story', () => {
  assert.deepEqual(run('2026-12-02T13:59:00Z'), []);
  assert.deepEqual(run('2026-12-02T14:10:00Z'), ['announce:kickoff:7-days:feed', 'announce:kickoff:7-days:story']);
});

test('3-day reminder is a story only', () => {
  assert.deepEqual(run('2026-12-06T14:10:00Z'), ['announce:kickoff:3-days:story']);
});

test('a missed milestone is skipped, not posted late', () => {
  assert.deepEqual(run('2026-12-02T21:00:00Z'), []);
});

test('already posted keys are not repeated', () => {
  assert.deepEqual(run('2026-12-02T14:10:00Z', { posted: new Set(['announce:kickoff:7-days:feed']) }), [
    'announce:kickoff:7-days:story',
  ]);
});

test('start-day story: 09:00 local without match data, 2 hours before the first match with it', () => {
  assert.deepEqual(run('2026-12-09T09:05:00Z'), ['announce:kickoff:start-day:story']);
  const matches = new Map([['kickoff', [match({ scheduledAt: '2026-12-09T13:00:00Z', teams: [null, null] })]]]);
  assert.deepEqual(run('2026-12-09T09:05:00Z', { matches }), []);
  assert.deepEqual(run('2026-12-09T11:05:00Z', { matches }), ['announce:kickoff:start-day:story']);
});

test('monthly roundup lists the month\'s big events and skips empty months', () => {
  const posts = duePosts({ now: new Date('2026-12-01T14:05:00Z'), events: [london, open], matches: new Map(), top, posted: new Set() });
  const roundup = posts.filter((p) => p.content.type === 'roundup');
  assert.deepEqual(roundup.map((p) => p.key), ['roundup:2026-12:feed', 'roundup:2026-12:story']);
  assert.equal(roundup[0]?.content.type === 'roundup' && roundup[0].content.events.length, 1);
  assert.deepEqual(run('2027-01-01T14:05:00Z'), []);
});

test('big match: top-10 teams, one hour before', () => {
  const matches = new Map([['kickoff', [match({})]]]);
  assert.deepEqual(run('2026-12-10T13:59:00Z', { matches }), []);
  assert.deepEqual(run('2026-12-10T14:05:00Z', { matches }), ['big-match:kickoff:m1:story']);
  const notTop = new Map([['kickoff', [match({ teams: ['Karmine Corp', 'Some Team'] })]]]);
  assert.deepEqual(run('2026-12-10T14:05:00Z', { matches: notTop }), []);
});

test('big match in an Open: playoffs only', () => {
  const at = '2026-11-21T14:05:00Z';
  const m = (playoffs: boolean) => new Map([['open', [match({ eventId: 'open', playoffs, scheduledAt: '2026-11-21T15:00:00Z' })]]]);
  assert.deepEqual(run(at, { events: [open], matches: m(false) }), []);
  assert.deepEqual(run(at, { events: [open], matches: m(true) }), ['big-match:open:m1:story']);
});

test('grand final: story when finalists are known, then shortly before', () => {
  const final = match({ isGrandFinal: true, scheduledAt: '2026-12-13T18:00:00Z' });
  const matches = new Map([['kickoff', [final]]]);
  assert.deepEqual(run('2026-12-13T10:00:00Z', { matches }), ['grand-final:kickoff:set:story']);
  assert.deepEqual(run('2026-12-13T17:05:00Z', { matches }), ['grand-final:kickoff:soon:story']);
  const tbd = new Map([['kickoff', [{ ...final, teams: ['Karmine Corp', null] as Match['teams'] }]]]);
  assert.deepEqual(run('2026-12-13T10:00:00Z', { matches: tbd }), []);
});

test('winner post only for Majors/Worlds/Finale, and only for a finished, decided series', () => {
  const done = (over: Partial<Match>) =>
    new Map([['major', [match({ eventId: 'major', isGrandFinal: true, status: 'finished', score: [4, 2], winner: 0, ...over })]]]);
  const at = '2026-12-13T20:00:00Z';
  assert.deepEqual(run(at, { events: [major], matches: done({}) }), ['winner:major:feed', 'winner:major:story']);
  assert.deepEqual(run(at, { events: [major], matches: done({ status: 'live' }) }), []);
  assert.deepEqual(run(at, { events: [major], matches: done({ score: [2, 2] }) }), []);
  // The Kick-Off has no winner post.
  assert.deepEqual(run(at, { matches: new Map([['kickoff', [match({ isGrandFinal: true, status: 'finished', score: [4, 2], winner: 0 })]]]) }), []);
});
