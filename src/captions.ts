// Captions for feed posts. Stories published through the API have no caption,
// so everything a story needs is inside its image.

import type { RlEvent } from './data/types.ts';
import { eventSubtitle, whyEvent } from './render/templates.tsx';
import type { DuePost, Milestone } from './rules.ts';
import { formatDateRange, formatMonth } from './time.ts';

const BASE_HASHTAGS = ['RLCS', 'RocketLeague', 'Esports'];
/** Instagram announced a 5-hashtag limit in December 2025. */
const MAX_HASHTAGS = 5;
const WATCH = '📺 Watch live on twitch.tv/rocketleague and YouTube';

const hashtag = (text: string) => text.normalize('NFKD').replace(/[^A-Za-z0-9]/g, '');

function hashtags(...extra: (string | undefined)[]): string {
  const tags = [...new Set([...BASE_HASHTAGS, ...extra.filter((t): t is string => Boolean(t)).map(hashtag)])];
  return tags
    .filter(Boolean)
    .slice(0, MAX_HASHTAGS)
    .map((t) => `#${t}`)
    .join(' ');
}

function credit(credits: string[]): string | undefined {
  if (credits.length === 0) return undefined;
  return `Data: ${credits.map((c) => (c === 'Liquipedia' ? 'Liquipedia (CC-BY-SA)' : c)).join(', ')}`;
}

const HOOK: Partial<Record<Milestone, (e: RlEvent) => string>> = {
  '2-months': (e) => `🚀 Save the date: ${e.name} is two months away!`,
  '1-month': (e) => `🚀 One month until ${e.name}!`,
  '7-days': (e) => `🔥 ${e.name} starts in one week!`,
};

function eventLines(e: RlEvent): string[] {
  return [
    `📅 ${e.startDate && e.endDate ? formatDateRange(e.startDate, e.endDate) : 'Dates TBA'}`,
    e.online ? '🌐 Online' : `📍 ${[e.location?.venue, e.location?.city, e.location?.country].filter(Boolean).join(', ')}`,
    e.teamCount || e.prizePoolUsd
      ? `🏆 ${[e.teamCount && `${e.teamCount} teams`, e.prizePoolUsd && `$${e.prizePoolUsd.toLocaleString('en-US')} prize pool`].filter(Boolean).join(', ')}`
      : undefined,
  ].filter((l): l is string => Boolean(l));
}

const paragraphs = (...blocks: (string | string[] | undefined)[]) =>
  blocks
    .filter((b) => b !== undefined && b.length > 0)
    .map((b) => (Array.isArray(b) ? b.join('\n') : b))
    .join('\n\n');

/** Caption for a feed post, or `undefined` for stories. */
export function buildCaption(post: DuePost, credits: string[]): string | undefined {
  if (post.format !== 'feed') return undefined;
  const c = post.content;
  switch (c.type) {
    case 'announcement': {
      const hook = HOOK[c.milestone];
      if (!hook) return undefined;
      return paragraphs(
        hook(c.event),
        eventLines(c.event),
        `New to RLCS? ${whyEvent(c.event)}. Follow us and we'll tell you which matches not to miss.`,
        WATCH,
        credit(credits),
        hashtags(c.event.hashtag),
      );
    }
    case 'roundup':
      return paragraphs(
        `📅 Your RLCS calendar for ${formatMonth(c.month)}`,
        c.events.length > 1 ? `${c.events.length} big events this month. Swipe to see them all 👉` : 'One big event this month. Swipe for the details 👉',
        c.events.map((e) => `• ${e.name}: ${eventSubtitle(e)}`),
        'Follow so you never miss a big match: we post a reminder before every one.',
        credit(credits),
        hashtags(...c.events.map((e) => e.hashtag)),
      );
    case 'winner':
      return paragraphs(
        `🏆 ${c.winner} are your ${c.event.name} champions!`,
        `They beat ${c.runnerUp} ${c.score[0]}–${c.score[1]} in the grand final.`,
        `New to RLCS? ${c.event.kind === 'major' ? 'Majors are the biggest tournaments of the season, and winning one is a huge deal.' : 'This is the biggest title of the season.'}`,
        credit(credits),
        hashtags(c.event.hashtag, c.winner),
      );
    default:
      return undefined;
  }
}
