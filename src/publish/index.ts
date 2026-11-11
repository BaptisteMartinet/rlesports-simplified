import * as cloudinaryApi from './cloudinary.ts';
import { parseCloudinaryUrl, type CloudinaryConfig, type UploadedImage } from './cloudinary.ts';
import { instagramClient, type InstagramClient } from './instagram.ts';

export interface Publisher {
  /** Publishes one post: a story, a single feed image, or a carousel (several images). Returns the Instagram media id. */
  publish(opts: { format: 'story' | 'feed'; images: Buffer[]; caption?: string }): Promise<string>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (see docs/SETUP.md)`);
  return value;
}

/**
 * Builds the publisher from IG_ACCESS_TOKEN and CLOUDINARY_URL.
 * The Instagram account comes from `account` if given, else from IG_USER_ID
 * (no API lookup), else from the token itself.
 */
export async function createPublisher(account?: { userId: string; username?: string }): Promise<Publisher> {
  const cloudinary = parseCloudinaryUrl(requireEnv('CLOUDINARY_URL'));
  const ig = instagramClient(requireEnv('IG_ACCESS_TOKEN'));
  const fixedId = process.env.IG_USER_ID?.trim();
  const { userId, username } = account ?? (fixedId ? { userId: fixedId, username: undefined } : await ig.me());
  console.log(`Publishing as ${username ? `@${username}` : `account ${userId}`}`);
  return { publish: (opts) => publishPost(ig, userId, cloudinary, opts) };
}

export async function publishPost(
  ig: InstagramClient,
  userId: string,
  cloudinary: CloudinaryConfig,
  { format, images, caption }: { format: 'story' | 'feed'; images: Buffer[]; caption?: string },
  { uploadImage, deleteImage }: Pick<typeof cloudinaryApi, 'uploadImage' | 'deleteImage'> = cloudinaryApi,
): Promise<string> {
  if (images.length === 0) throw new Error('Nothing to publish');
  if (format === 'story' && images.length > 1) throw new Error('A story has exactly one image');

  const uploads: UploadedImage[] = [];
  try {
    for (const img of images) uploads.push(await uploadImage(cloudinary, img));

    let containerId: string;
    if (format === 'story') {
      containerId = await ig.createImage(userId, { imageUrl: uploads[0]!.url, kind: 'story' });
    } else if (uploads.length === 1) {
      containerId = await ig.createImage(userId, { imageUrl: uploads[0]!.url, kind: 'feed', caption });
    } else {
      const children: string[] = [];
      for (const u of uploads.slice(0, 10)) {
        const child = await ig.createImage(userId, { imageUrl: u.url, kind: 'carousel-item' });
        await ig.waitUntilReady(child);
        children.push(child);
      }
      containerId = await ig.createCarousel(userId, { children, caption });
    }
    await ig.waitUntilReady(containerId);
    return await ig.publish(userId, containerId);
  } finally {
    // Instagram has its own copy once the container is processed (or we gave up): remove ours either way.
    for (const u of uploads) {
      await deleteImage(cloudinary, u.publicId).catch((err: unknown) =>
        console.warn(`Could not delete ${u.publicId} from Cloudinary: ${(err as Error).message}`),
      );
    }
  }
}
