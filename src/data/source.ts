import type { Match, RlEvent, Standings } from './types.ts';

/**
 * A data source provides any subset of the three kinds of data the bot needs.
 * Sources only translate; all posting decisions happen elsewhere.
 */
export interface DataSource {
  readonly name: string;
  /** Credit to show on images and captions when this source's data is used, for example "Liquipedia". */
  readonly attribution?: string;
  getEvents?(): Promise<RlEvent[]>;
  /** Matches of one event. Only called for events that are live or about to start. */
  getMatches?(event: RlEvent): Promise<Match[]>;
  /** Points standings used for the "top 10" rule. `null` when the source has none. */
  getStandings?(): Promise<Standings | null>;
}

/** The data the bot actually uses, with each kind coming from exactly one source. */
export interface BotData {
  /** Credits for the sources in use, for example ["Liquipedia"]. Empty for hand-written data only. */
  attributions: string[];
  getEvents(): Promise<RlEvent[]>;
  getMatches(event: RlEvent): Promise<Match[]>;
  getStandings(): Promise<Standings | null>;
}

/**
 * Picks which source provides each kind of data. For now everything except
 * matches comes from the hand-written season file; once an API is available it
 * is plugged in here, for example `{ events: manual, matches: liquipedia, standings: liquipedia }`.
 *
 * Without a match source, `getMatches` returns nothing: announcement posts
 * still work, while big-match, grand-final and winner posts stay silent.
 */
export function combineSources(parts: {
  events: DataSource;
  matches?: DataSource;
  standings?: DataSource;
}): BotData {
  const { events, matches, standings } = parts;
  if (!events.getEvents) throw new Error(`Source "${events.name}" does not provide events`);
  if (matches && !matches.getMatches) throw new Error(`Source "${matches.name}" does not provide matches`);
  if (standings && !standings.getStandings) throw new Error(`Source "${standings.name}" does not provide standings`);

  const attributions = [...new Set([events, matches, standings].flatMap((s) => (s?.attribution ? [s.attribution] : [])))];
  return {
    attributions,
    getEvents: () => events.getEvents!(),
    getMatches: (event) => (matches ? matches.getMatches!(event) : Promise.resolve([])),
    getStandings: () => (standings ? standings.getStandings!() : Promise.resolve(null)),
  };
}
