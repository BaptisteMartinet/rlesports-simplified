import { combineSources, type BotData } from './source.ts';
import { seasonFileSource } from './sources/seasonFile.ts';
import type { RlEvent } from './types.ts';
import { isBigEvent } from '../rules.ts';

/** Season file used by default. Switch it when a new season starts. */
export const DEFAULT_SEASON_FILE = 'data/seasons/rlcs-2027.yml';

/**
 * Wires the data sources together. When an API becomes available, add it here,
 * for example: `combineSources({ events: season, matches: liquipedia })`.
 */
export function createBotData(seasonFile = process.env.SEASON_FILE ?? DEFAULT_SEASON_FILE): BotData {
  const season = seasonFileSource(seasonFile);
  return combineSources({ events: season, standings: season });
}

/** The next confirmed big LAN event (not yet finished), for one-off posts like the welcome carousel. */
export async function nextBigEvent(now = new Date()): Promise<RlEvent | undefined> {
  const today = now.toISOString().slice(0, 10);
  return (await createBotData().getEvents())
    .filter((e) => isBigEvent(e) && e.endDate! >= today)
    .sort((a, b) => a.startDate!.localeCompare(b.startDate!))[0];
}
