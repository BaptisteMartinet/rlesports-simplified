// Renders every post type with sample data into out/preview/, to check the
// design without waiting for a real event. Usage: npm run preview
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { buildCaption } from '../captions.ts';
import type { Match, RlEvent } from '../data/types.ts';
import { renderPost, toJpeg } from '../render/index.ts';
import { profilePicture, welcomeStory } from '../render/templates.tsx';
import type { DuePost, PostContent, PostFormat } from '../rules.ts';

const OUT = 'out/preview';

const london: RlEvent = {
  id: 'rlcs-2027-club-kickoff-london',
  name: 'RLCS Club Championship Kick-Off',
  kind: 'kickoff',
  status: 'confirmed',
  online: false,
  startDate: '2026-12-09',
  endDate: '2026-12-13',
  timezone: 'Europe/London',
  location: { venue: 'Copper Box Arena', city: 'London', country: 'United Kingdom' },
  teamCount: 24,
  hashtag: 'RLCSKickOff',
  sources: [],
};
// Made-up event, to preview the winner post (the Kick-Off has none).
const major: RlEvent = {
  ...london,
  id: 'sample-major',
  name: 'RLCS Major 1',
  kind: 'major',
  startDate: '2027-02-17',
  endDate: '2027-02-21',
  location: { city: 'Sample City', country: 'Nowhere' },
  teamCount: 16,
  prizePoolUsd: 1_000_000,
  hashtag: 'RLCSMajor',
};
const match = (over: Partial<Match>): Match => ({
  id: 'sample',
  eventId: london.id,
  playoffs: true,
  isGrandFinal: false,
  scheduledAt: '2026-12-11T16:00:00Z',
  teams: ['Karmine Corp', 'Gen.G Mobil1 Racing'],
  status: 'scheduled',
  ...over,
});

const samples: [string, PostFormat[], PostContent][] = [
  ['announce-2-months', ['feed', 'story'], { type: 'announcement', event: london, milestone: '2-months' }],
  ['announce-7-days', ['feed', 'story'], { type: 'announcement', event: london, milestone: '7-days' }],
  ['announce-3-days', ['story'], { type: 'announcement', event: london, milestone: '3-days' }],
  ['announce-start-day', ['story'], { type: 'announcement', event: london, milestone: 'start-day', firstMatchAt: new Date('2026-12-09T11:00:00Z') }],
  ['roundup', ['feed', 'story'], { type: 'roundup', month: '2026-12', events: [london] }],
  ['big-match', ['story'], { type: 'big-match', event: london, match: match({}), teams: ['Karmine Corp', 'Gen.G Mobil1 Racing'], ranks: [1, 9], approx: true }],
  ['grand-final-set', ['story'], { type: 'grand-final', event: london, match: match({ isGrandFinal: true, teams: ['Team Falcons', 'NRG'], scheduledAt: '2026-12-13T18:00:00Z' }), teams: ['Team Falcons', 'NRG'], phase: 'set', approx: true }],
  ['winner', ['feed', 'story'], { type: 'winner', event: major, match: match({ eventId: major.id, isGrandFinal: true, status: 'finished' }), winner: 'Team Falcons', runnerUp: 'Spacestation', score: [4, 0] }],
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const [name, formats, content] of samples) {
  for (const format of formats) {
    const post: DuePost = { key: name, format, dueAt: new Date(), content };
    const images = await renderPost(post, ['Liquipedia']);
    for (const [i, img] of images.entries()) {
      await writeFile(`${OUT}/${name}-${format}${images.length > 1 ? `-${i + 1}` : ''}.jpg`, img);
    }
    const caption = buildCaption(post, ['Liquipedia']);
    if (caption) await writeFile(`${OUT}/${name}-${format}.txt`, caption);
  }
}
await writeFile(`${OUT}/profile-picture.jpg`, await toJpeg(profilePicture()));
await writeFile(`${OUT}/welcome-story.jpg`, await toJpeg(welcomeStory()));
console.log(`Preview written to ${OUT}/`);
