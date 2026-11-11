import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { z } from 'zod';
import type { DataSource } from '../source.ts';
import type { RlEvent, Standings } from '../types.ts';

const region = z.enum(['EU', 'NA', 'SAM', 'MENA', 'OCE', 'APAC', 'SSA']);
const date = z.iso.date();
const timezone = z.string().refine(
  (tz) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Unknown IANA time zone' },
);

const eventSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits and dashes'),
    name: z.string().min(1),
    kind: z.enum(['kickoff', 'major', 'worlds', 'finale', 'open']),
    status: z.enum(['confirmed', 'tba']),
    online: z.boolean(),
    region: region.optional(),
    startDate: date.optional(),
    endDate: date.optional(),
    timezone,
    location: z
      .object({ venue: z.string().optional(), city: z.string(), country: z.string() })
      .optional(),
    teamCount: z.number().int().positive().optional(),
    prizePoolUsd: z.number().int().positive().optional(),
    hashtag: z.string().regex(/^[A-Za-z0-9_]+$/, 'Hashtag without "#", letters/digits/underscore only').optional(),
    sources: z.array(z.url()).min(1),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.status === 'confirmed' && (!e.startDate || !e.endDate)) {
      ctx.addIssue({ code: 'custom', message: 'A confirmed event needs startDate and endDate' });
    }
    if (e.startDate && e.endDate && e.endDate < e.startDate) {
      ctx.addIssue({ code: 'custom', message: 'endDate is before startDate' });
    }
    if (e.kind === 'open' && !e.region) {
      ctx.addIssue({ code: 'custom', message: 'An open needs a region' });
    }
    if (e.status === 'confirmed' && !e.online && !e.location) {
      ctx.addIssue({ code: 'custom', message: 'A confirmed LAN event needs a location' });
    }
  });

const standingsSchema = z
  .object({
    label: z.string().min(1),
    asOf: date,
    sources: z.array(z.url()).min(1),
    regions: z.partialRecord(
      region,
      z.array(z.object({ team: z.string().min(1), points: z.number().int().nonnegative() }).strict()),
    ),
  })
  .strict();

const seasonFileSchema = z
  .object({
    season: z.string().min(1),
    updated: date,
    standings: standingsSchema.optional(),
    events: z.array(eventSchema),
  })
  .strict()
  .superRefine((file, ctx) => {
    const seen = new Set<string>();
    for (const e of file.events) {
      if (seen.has(e.id)) ctx.addIssue({ code: 'custom', message: `Duplicate event id "${e.id}"` });
      seen.add(e.id);
    }
  });

export type SeasonFile = z.infer<typeof seasonFileSchema>;

/** Parses and validates a season file. Throws with every problem listed if the file is invalid. */
export function parseSeasonFile(text: string, path = 'season file'): SeasonFile {
  const result = seasonFileSchema.safeParse(parse(text));
  if (!result.success) {
    throw new Error(`Invalid ${path}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

function toStandings(s: NonNullable<SeasonFile['standings']>): Standings {
  return {
    label: s.label,
    asOf: s.asOf,
    sources: s.sources,
    entries: Object.entries(s.regions).flatMap(([r, teams]) =>
      (teams ?? []).map((t) => ({ team: t.team, points: t.points, region: r as z.infer<typeof region> })),
    ),
  };
}

/** Data source backed by a hand-written YAML file (see `data/seasons/`). Provides events and standings. */
export function seasonFileSource(path: string): DataSource {
  let cached: Promise<SeasonFile> | undefined;
  const load = () => (cached ??= readFile(path, 'utf8').then((text) => parseSeasonFile(text, path)));

  return {
    name: `season file (${path})`,
    async getEvents(): Promise<RlEvent[]> {
      return (await load()).events;
    },
    async getStandings(): Promise<Standings | null> {
      const { standings } = await load();
      return standings ? toStandings(standings) : null;
    },
  };
}
