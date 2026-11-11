// Checks the Instagram token and Cloudinary credentials without posting anything.
//
//   npm run check:accounts
//   npm run check:accounts -- --publish-welcome-story   also publishes the welcome story (first real test)
//   npm run check:accounts -- --publish-welcome-post    also publishes the welcome carousel (feed + caption test)
//
// Reads IG_ACCESS_TOKEN and CLOUDINARY_URL from the environment.
import { parseCloudinaryUrl, ping } from '../publish/cloudinary.ts';
import { createPublisher } from '../publish/index.ts';
import { instagramClient } from '../publish/instagram.ts';
import { toJpeg } from '../render/index.ts';
import { welcomeCarousel, welcomeStory } from '../render/templates.tsx';
import { welcomeCaption } from '../captions.ts';
import { nextBigEvent } from '../data/index.ts';

let failed = false;
let account: { userId: string; username: string } | undefined;
async function check(name: string, fn: () => Promise<string>) {
  try {
    console.log(`✔ ${name}: ${await fn()}`);
  } catch (err) {
    failed = true;
    console.log(`✖ ${name}: ${(err as Error).message}`);
  }
}

await check('Instagram token', async () => {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) throw new Error('IG_ACCESS_TOKEN is not set');
  const ig = instagramClient(token);
  console.log(`  token kind: ${ig.tokenKind === 'unified-login' ? 'Unified Login system-user token (EAA…)' : 'Instagram Login token (IG…)'}`);
  console.log(`  token owner: ${await ig.owner()}`);
  const fixedId = process.env.IG_USER_ID?.trim();
  // With IG_USER_ID set, check that exact account: a wrong ID must fail here, not at the first post.
  account = fixedId ? await ig.account(fixedId) : await ig.me();
  const { userId, username } = account;
  const usage = await ig.publishingUsage(userId).catch(() => undefined);
  return `@${username} (id ${userId}${fixedId ? ', from IG_USER_ID' : ''})${usage === undefined ? '' : `, ${usage} API posts in the last 24h`}`;
});

await check('Cloudinary', async () => {
  const url = process.env.CLOUDINARY_URL;
  if (!url) throw new Error('CLOUDINARY_URL is not set');
  const config = parseCloudinaryUrl(url);
  await ping(config);
  return `cloud "${config.cloudName}" reachable`;
});

if (failed) process.exit(1);

if (process.argv.includes('--publish-welcome-story')) {
  const publisher = await createPublisher(account);
  const id = await publisher.publish({ format: 'story', images: [await toJpeg(welcomeStory())] });
  console.log(`✔ Welcome story published (media ${id}). Check it in the Instagram app.`);
}

if (process.argv.includes('--publish-welcome-post')) {
  const next = await nextBigEvent();
  const publisher = await createPublisher(account);
  const images = await Promise.all(welcomeCarousel(next).map(toJpeg));
  const id = await publisher.publish({ format: 'feed', images, caption: welcomeCaption(next) });
  console.log(`✔ Welcome carousel published (media ${id}). Pin it to the profile from the Instagram app.`);
}
