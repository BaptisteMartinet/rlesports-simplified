import type { Standings, StandingsEntry } from './types.ts';

/**
 * Comparison key for team names, so "FURIA", "Furia" and "Team-Falcons" vs
 * "Team Falcons" match across sources. Different names for the same team
 * (for example "Spacestation" vs "Spacestation Gaming") still need an alias.
 */
export function teamKey(name: string): string {
  return name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface RankedTeam extends StandingsEntry {
  /** 1-based rank across all regions. Tied teams share the same rank. */
  rank: number;
}

/**
 * Ranks every team across all regions by points (RLCS points are regional, so
 * this is an approximation of a world ranking) and keeps the top `n`.
 * Teams tied with the n-th team are all kept, so the list can be slightly
 * longer than `n`.
 */
export function topTeams(standings: Standings, n = 10): RankedTeam[] {
  const sorted = [...standings.entries].sort((a, b) => b.points - a.points);
  const ranked: RankedTeam[] = [];
  sorted.forEach((entry, i) => {
    const prev = ranked[i - 1];
    const rank = prev && prev.points === entry.points ? prev.rank : i + 1;
    ranked.push({ ...entry, rank });
  });
  return ranked.filter((t) => t.rank <= n);
}

/** Finds a team's world rank in a top list, or `undefined` if it isn't in it. */
export function findRank(top: RankedTeam[], team: string): number | undefined {
  const key = teamKey(team);
  return top.find((t) => teamKey(t.team) === key)?.rank;
}
