// The bot's own data model. Every data source (hand-written season file,
// Liquipedia, start.gg, ...) is translated into these types, so the rest of
// the bot never depends on where the data came from.

export type Region = 'EU' | 'NA' | 'SAM' | 'MENA' | 'OCE' | 'APAC' | 'SSA';

/**
 * - `kickoff`, `major`, `worlds`, `finale`: big LAN events. They get the
 *   announcement posts (2 months → start day) and the monthly roundup.
 * - `open`: regional online events. Only their playoff matches can produce
 *   "big match" stories.
 */
export type EventKind = 'kickoff' | 'major' | 'worlds' | 'finale' | 'open';

export interface RlEvent {
  /** Stable id, used to remember what was already posted. Never change it once posted. */
  id: string;
  name: string;
  kind: EventKind;
  /** `confirmed`: dates are official. `tba`: announced but dates not known yet; ignored by the posting rules. */
  status: 'confirmed' | 'tba';
  online: boolean;
  /** Only for regional events (Opens). */
  region?: Region;
  /** First and last day, `YYYY-MM-DD`, in the event's own time zone. Missing when `status` is `tba`. */
  startDate?: string;
  endDate?: string;
  /** IANA time zone of the event, for example `Europe/London`. Online events use the region's main time zone. */
  timezone: string;
  location?: { venue?: string; city: string; country: string };
  teamCount?: number;
  prizePoolUsd?: number;
  /** Event hashtag without `#`, for feed captions. */
  hashtag?: string;
  /** Where the facts come from, so they can be checked again. */
  sources: string[];
}

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Match {
  id: string;
  eventId: string;
  /** True for playoff-stage matches (brackets), false for groups / Swiss / qualifiers. */
  playoffs: boolean;
  isGrandFinal: boolean;
  /** ISO 8601 date-time in UTC. Often an estimate on wikis. */
  scheduledAt?: string;
  /** `null` while a team isn't decided yet (for example a grand final slot). */
  teams: [string | null, string | null];
  status: MatchStatus;
  /** Series score, same order as `teams`. */
  score?: [number, number];
  /** Index in `teams` of the series winner, only when `status` is `finished`. */
  winner?: 0 | 1;
}

export interface StandingsEntry {
  team: string;
  region: Region;
  points: number;
}

export interface Standings {
  /** What these points are, shown nowhere publicly but useful in logs, for example "RLCS 2026 final points". */
  label: string;
  /** Date the numbers were taken from the source, `YYYY-MM-DD`. */
  asOf: string;
  entries: StandingsEntry[];
  sources: string[];
}
