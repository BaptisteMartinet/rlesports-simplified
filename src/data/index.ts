import { combineSources, type BotData } from './source.ts';
import { seasonFileSource } from './sources/seasonFile.ts';

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
