// Decides which posts are due at a given moment. Pure functions: no I/O, so
// every rule can be tested with a fixed `now`.

import { findRank, type RankedTeam } from './data/standings.ts';
import type { EventKind, Match, RlEvent } from './data/types.ts';
import { addDays, addMonths, dateIn, zonedTime } from './time.ts';

export type PostFormat = 'story' | 'feed';
export type Milestone = '2-months' | '1-month' | '7-days' | '3-days' | 'start-day';

export type PostContent =
  | { type: 'announcement'; event: RlEvent; milestone: Milestone; firstMatchAt?: Date }
  | { type: 'roundup'; month: string; events: RlEvent[] }
  | { type: 'big-match'; event: RlEvent; match: Match; teams: [string, string]; ranks: [number, number]; approx: boolean }
  | { type: 'grand-final'; event: RlEvent; match: Match; teams: [string, string]; phase: 'set' | 'soon'; approx: boolean }
  | { type: 'winner'; event: RlEvent; match: Match; winner: string; runnerUp: string; score: [number, number] };

export interface DuePost {
  /** Unique and stable: stored once published so the post never repeats. */
  key: string;
  format: PostFormat;
  dueAt: Date;
  content: PostContent;
}

export interface RuleInput {
  now: Date;
  events: RlEvent[];
  /** Matches per event id. Empty when no match source is plugged in. */
  matches: Map<string, Match[]>;
  /** World top 10 (see `topTeams`). Empty disables the big-match rule. */
  top: RankedTeam[];
  /** Keys of posts already published. */
  posted: ReadonlySet<string>;
}

/** Big LAN events: announced, rounded up, and their grand finals covered. */
const BIG_EVENT_KINDS: ReadonlySet<EventKind> = new Set(['kickoff', 'major', 'worlds', 'finale']);
/** Events whose champion gets a winner post. */
const WINNER_EVENT_KINDS: ReadonlySet<EventKind> = new Set(['major', 'worlds', 'finale']);

/** Time of day (UTC) for posts that aren't tied to a match: afternoon in Europe, morning in the Americas. */
const DAILY_POST_TIME = '14:00';
/** Start-day story when the first match time is unknown, in the event's local time. */
const START_DAY_FALLBACK_TIME = '09:00';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const MILESTONES: { milestone: Exclude<Milestone, 'start-day'>; date: (start: string) => string; formats: PostFormat[] }[] = [
  { milestone: '2-months', date: (s) => addMonths(s, -2), formats: ['feed', 'story'] },
  { milestone: '1-month', date: (s) => addMonths(s, -1), formats: ['feed', 'story'] },
  { milestone: '7-days', date: (s) => addDays(s, -7), formats: ['feed', 'story'] },
  { milestone: '3-days', date: (s) => addDays(s, -3), formats: ['story'] },
];

interface Candidate {
  key: string;
  formats: PostFormat[];
  dueAt: Date;
  /** After this, the post is skipped rather than published late. */
  expiresAt: Date;
  content: PostContent;
}

const isBigEvent = (e: RlEvent) => e.status === 'confirmed' && BIG_EVENT_KINDS.has(e.kind);
const knownTeams = (m: Match): [string, string] | undefined =>
  m.teams[0] && m.teams[1] ? [m.teams[0], m.teams[1]] : undefined;
const time = (m: Match) => (m.scheduledAt ? new Date(m.scheduledAt) : undefined);

/**
 * A match time is shown as approximate ("~") unless it's the first match of
 * its day: later matches depend on how long the previous ones last.
 */
function isApprox(match: Match, all: Match[], tz: string): boolean {
  const at = time(match);
  if (!at) return true;
  const day = dateIn(at, tz);
  return all.some((other) => {
    const t = time(other);
    return t !== undefined && t < at && dateIn(t, tz) === day;
  });
}

function announcementCandidates(event: RlEvent, matches: Match[]): Candidate[] {
  const start = event.startDate!;
  const out: Candidate[] = MILESTONES.map(({ milestone, date, formats }) => {
    const dueAt = zonedTime(date(start), DAILY_POST_TIME, 'UTC');
    return {
      key: `announce:${event.id}:${milestone}`,
      formats,
      dueAt,
      expiresAt: new Date(dueAt.getTime() + 6 * HOUR),
      content: { type: 'announcement', event, milestone },
    };
  });

  const firstMatchAt = matches
    .map(time)
    .filter((t): t is Date => t !== undefined && dateIn(t, event.timezone) === start)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const dueAt = firstMatchAt
    ? new Date(firstMatchAt.getTime() - 2 * HOUR)
    : zonedTime(start, START_DAY_FALLBACK_TIME, event.timezone);
  out.push({
    key: `announce:${event.id}:start-day`,
    formats: ['story'],
    dueAt,
    expiresAt: new Date(dueAt.getTime() + 6 * HOUR),
    content: { type: 'announcement', event, milestone: 'start-day', firstMatchAt },
  });
  return out;
}

function roundupCandidate(now: Date, events: RlEvent[]): Candidate | undefined {
  const month = dateIn(now, 'UTC').slice(0, 7);
  const monthStart = `${month}-01`;
  const monthEnd = addDays(addMonths(monthStart, 1), -1);
  const inMonth = events
    .filter((e) => isBigEvent(e) && e.startDate! <= monthEnd && e.endDate! >= monthStart)
    .sort((a, b) => a.startDate!.localeCompare(b.startDate!));
  if (inMonth.length === 0) return undefined; // no filler: skip empty months
  const dueAt = zonedTime(monthStart, DAILY_POST_TIME, 'UTC');
  return {
    key: `roundup:${month}`,
    formats: ['feed', 'story'],
    dueAt,
    expiresAt: new Date(dueAt.getTime() + 6 * HOUR),
    content: { type: 'roundup', month, events: inMonth },
  };
}

function matchCandidates(event: RlEvent, matches: Match[], top: RankedTeam[]): Candidate[] {
  const out: Candidate[] = [];
  for (const match of matches) {
    const teams = knownTeams(match);
    const at = time(match);
    const approx = isApprox(match, matches, event.timezone);

    // Big match: both teams in the world top 10. Any stage at LAN events,
    // playoffs only in Opens. Grand finals of big events get their own stories instead.
    const coveredAsFinal = match.isGrandFinal && isBigEvent(event);
    if (teams && at && match.status === 'scheduled' && !coveredAsFinal && (isBigEvent(event) || match.playoffs)) {
      const ranks = teams.map((t) => findRank(top, t));
      if (ranks[0] !== undefined && ranks[1] !== undefined) {
        out.push({
          key: `big-match:${event.id}:${match.id}`,
          formats: ['story'],
          dueAt: new Date(at.getTime() - HOUR),
          expiresAt: new Date(at.getTime() + 15 * MINUTE),
          content: { type: 'big-match', event, match, teams, ranks: [ranks[0], ranks[1]], approx },
        });
      }
    }

    if (!match.isGrandFinal || !isBigEvent(event)) continue;

    // Grand final: once both finalists are known, then again shortly before it starts.
    if (teams && match.status === 'scheduled') {
      out.push({
        key: `grand-final:${event.id}:set`,
        formats: ['story'],
        dueAt: new Date(0),
        // Too close to the start, the "soon" story covers it.
        expiresAt: at ? new Date(at.getTime() - 90 * MINUTE) : zonedTime(addDays(event.endDate!, 1), '00:00', event.timezone),
        content: { type: 'grand-final', event, match, teams, phase: 'set', approx },
      });
      if (at) {
        out.push({
          key: `grand-final:${event.id}:soon`,
          formats: ['story'],
          dueAt: new Date(at.getTime() - HOUR),
          expiresAt: new Date(at.getTime() + 15 * MINUTE),
          content: { type: 'grand-final', event, match, teams, phase: 'soon', approx },
        });
      }
    }

    // Winner: only once the final is marked finished and a team has actually won the series.
    const { winner, score } = match;
    if (teams && match.status === 'finished' && winner !== undefined && score && WINNER_EVENT_KINDS.has(event.kind)) {
      const loser = winner === 0 ? 1 : 0;
      if (score[winner] > score[loser]) {
        out.push({
          key: `winner:${event.id}`,
          formats: ['feed', 'story'],
          dueAt: new Date(0),
          expiresAt: zonedTime(addDays(event.endDate!, 2), '00:00', event.timezone),
          content: {
            type: 'winner',
            event,
            match,
            winner: teams[winner],
            runnerUp: teams[loser],
            score: [score[winner], score[loser]],
          },
        });
      }
    }
  }
  return out;
}

/** Every post due now and not yet published, oldest first. One entry per format (feed and story are separate publishes). */
export function duePosts({ now, events, matches, top, posted }: RuleInput): DuePost[] {
  const candidates: Candidate[] = [];
  for (const event of events) {
    if (event.status !== 'confirmed') continue;
    const eventMatches = matches.get(event.id) ?? [];
    if (isBigEvent(event)) candidates.push(...announcementCandidates(event, eventMatches));
    candidates.push(...matchCandidates(event, eventMatches, top));
  }
  const roundup = roundupCandidate(now, events);
  if (roundup) candidates.push(roundup);

  return candidates
    .filter((c) => c.dueAt <= now && now < c.expiresAt)
    .flatMap((c) =>
      c.formats.map((format) => ({ key: `${c.key}:${format}`, format, dueAt: c.dueAt, content: c.content })),
    )
    .filter((p) => !posted.has(p.key))
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}
