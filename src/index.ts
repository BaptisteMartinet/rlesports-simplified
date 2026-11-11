// One bot run: load data → find due posts → render → publish → remember.
//
//   npm run dry-run                      render what's due now into out/run/, publish nothing
//   NOW=2026-12-02T14:05:00Z npm run dry-run   pretend it's another moment
//   npm start                            publish for real (needs IG_ACCESS_TOKEN and CLOUDINARY_URL)
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { buildCaption } from './captions.ts';
import { createBotData } from './data/index.ts';
import { topTeams } from './data/standings.ts';
import type { Match } from './data/types.ts';
import { createPublisher, type Publisher } from './publish/index.ts';
import { renderPost } from './render/index.ts';
import { duePosts } from './rules.ts';
import { loadState, saveState } from './state.ts';
import { addDays, dateIn } from './time.ts';

/** Safety net: a data glitch can't flood the account. Anything left over goes out next run. */
const MAX_POSTS_PER_RUN = 5;
const OUT = 'out/run';

const dryRun = process.env.DRY_RUN === '1';
const now = process.env.NOW ? new Date(process.env.NOW) : new Date();
if (Number.isNaN(now.getTime())) throw new Error(`Invalid NOW "${process.env.NOW}"`);
// A fake date only makes sense for testing: never publish real posts early or late.
if (process.env.NOW && !dryRun) throw new Error('NOW can only be used with DRY_RUN=1');

const data = createBotData();
const state = await loadState();
const events = await data.getEvents();
const standings = await data.getStandings();

// Matches are only needed around live events: from the day before to two days after.
const today = dateIn(now, 'UTC');
const matches = new Map<string, Match[]>();
for (const event of events) {
  if (event.status !== 'confirmed') continue;
  if (addDays(event.startDate!, -1) <= today && today <= addDays(event.endDate!, 2)) {
    matches.set(event.id, await data.getMatches(event));
  }
}

const due = duePosts({
  now,
  events,
  matches,
  top: standings ? topTeams(standings, 10) : [],
  posted: new Set(Object.keys(state.posted)),
});
const batch = due.slice(0, MAX_POSTS_PER_RUN);
console.log(`${now.toISOString()}: ${due.length} post(s) due${due.length > batch.length ? `, publishing ${batch.length} this run` : ''}.`);

// Created on the first post only, so runs with nothing to post need no credentials.
let publisher: Publisher | undefined;

if (dryRun) {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
}

for (const post of batch) {
  const images = await renderPost(post, data.attributions);
  const caption = buildCaption(post, data.attributions);
  const name = post.key.replaceAll(':', '_');

  if (dryRun) {
    for (const [i, img] of images.entries()) {
      await writeFile(`${OUT}/${name}${images.length > 1 ? `_${i + 1}` : ''}.jpg`, img);
    }
    if (caption) await writeFile(`${OUT}/${name}.txt`, caption);
    console.log(`  [dry run] ${post.key} → ${OUT}/${name}*`);
    continue;
  }

  publisher ??= await createPublisher();
  const mediaId = await publisher.publish({ format: post.format, images, caption });
  state.posted[post.key] = new Date().toISOString();
  await saveState(state); // after each post, so a crash mid-run never causes a repeat
  console.log(`  published ${post.key} (media ${mediaId})`);
}
