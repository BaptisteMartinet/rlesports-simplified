import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCloudinaryUrl } from './cloudinary.ts';
import { tokenKind, type InstagramClient } from './instagram.ts';
import { publishPost } from './index.ts';

const config = parseCloudinaryUrl('cloudinary://key:secret@cloud');

function fakes({ failPublish = false } = {}) {
  const calls: string[] = [];
  let n = 0;
  let uploads = 0;
  const ig: InstagramClient = {
    tokenKind: 'unified-login',
    owner: async () => 'test',
    me: async () => ({ userId: 'u', username: 'test' }),
    createImage: async (_u, o) => (calls.push(`create ${o.kind}${o.caption ? ' +caption' : ''}`), `c${++n}`),
    createCarousel: async (_u, o) => (calls.push(`carousel ${o.children.join(',')}${o.caption ? ' +caption' : ''}`), `c${++n}`),
    waitUntilReady: async (id) => void calls.push(`wait ${id}`),
    publish: async (_u, id) => {
      calls.push(`publish ${id}`);
      if (failPublish) throw new Error('boom');
      return 'media1';
    },
    publishingUsage: async () => 0,
    account: async (userId) => ({ userId, username: 'test' }),
  };
  const cloud = {
    uploadImage: async () => (calls.push('upload'), { publicId: `p${++uploads}`, url: `https://x/${uploads}.jpg` }),
    deleteImage: async (_c: unknown, id: string) => void calls.push(`delete ${id}`),
  };
  return { calls, ig, cloud };
}

test('detects the token kind from its prefix', () => {
  assert.equal(tokenKind('EAAabc'), 'unified-login');
  assert.equal(tokenKind('IGAAabc'), 'instagram-login');
});

test('parses CLOUDINARY_URL', () => {
  assert.deepEqual(config, { apiKey: 'key', apiSecret: 'secret', cloudName: 'cloud' });
  assert.throws(() => parseCloudinaryUrl('https://nope'));
});

test('story: one STORIES container, no caption, image deleted afterwards', async () => {
  const { calls, ig, cloud } = fakes();
  const id = await publishPost(ig, 'u', config, { format: 'story', images: [Buffer.from('a')], caption: 'ignored' }, cloud);
  assert.equal(id, 'media1');
  assert.deepEqual(calls, ['upload', 'create story', 'wait c1', 'publish c1', 'delete p1']);
});

test('carousel: children without caption, caption on the carousel', async () => {
  const { calls, ig, cloud } = fakes();
  await publishPost(ig, 'u', config, { format: 'feed', images: [Buffer.from('a'), Buffer.from('b')], caption: 'hi' }, cloud);
  assert.deepEqual(calls, [
    'upload', 'upload',
    'create carousel-item', 'wait c1',
    'create carousel-item', 'wait c2',
    'carousel c1,c2 +caption', 'wait c3', 'publish c3',
    'delete p1', 'delete p2',
  ]);
});

test('images are deleted even when publishing fails', async () => {
  const { calls, ig, cloud } = fakes({ failPublish: true });
  await assert.rejects(publishPost(ig, 'u', config, { format: 'feed', images: [Buffer.from('a')], caption: 'hi' }, cloud), /boom/);
  assert.equal(calls.at(-1), 'delete p1');
  assert.ok(calls.includes('create feed +caption'));
});
