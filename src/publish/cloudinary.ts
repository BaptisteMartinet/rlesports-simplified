// Minimal Cloudinary client (signed upload + delete) using plain fetch.
// Cloudinary only hosts the JPEG long enough for Instagram to fetch it.
import { createHash } from 'node:crypto';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

const FOLDER = 'rlesports-simplified';

/** Parses `cloudinary://<api_key>:<api_secret>@<cloud_name>` (the "API environment variable" in the Cloudinary console). */
export function parseCloudinaryUrl(url: string): CloudinaryConfig {
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
  if (!match) throw new Error('CLOUDINARY_URL must look like cloudinary://<api_key>:<api_secret>@<cloud_name>');
  return { apiKey: match[1]!, apiSecret: match[2]!, cloudName: match[3]! };
}

/** Cloudinary signature: SHA-1 of the sorted params plus the API secret. */
function sign(params: Record<string, string>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + secret).digest('hex');
}

async function call(config: CloudinaryConfig, action: 'upload' | 'destroy', params: Record<string, string>, file?: Buffer) {
  const signed = { ...params, timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  for (const [k, v] of Object.entries(signed)) form.set(k, v);
  form.set('api_key', config.apiKey);
  form.set('signature', sign(signed, config.apiSecret));
  if (file) form.set('file', new Blob([new Uint8Array(file)], { type: 'image/jpeg' }), 'image.jpg');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/${action}`, { method: 'POST', body: form });
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } } & Record<string, unknown>;
  if (!res.ok || body.error) throw new Error(`Cloudinary ${action} failed (${res.status}): ${body.error?.message ?? 'unknown error'}`);
  return body;
}

export interface UploadedImage {
  publicId: string;
  url: string;
}

/** Uploads a JPEG as is (no transformation) and returns its public HTTPS URL. */
export async function uploadImage(config: CloudinaryConfig, jpeg: Buffer): Promise<UploadedImage> {
  const body = await call(config, 'upload', { folder: FOLDER }, jpeg);
  return { publicId: String(body.public_id), url: String(body.secure_url) };
}

export async function deleteImage(config: CloudinaryConfig, publicId: string): Promise<void> {
  await call(config, 'destroy', { public_id: publicId, invalidate: 'true' });
}

/** Checks the credentials with the Admin API ping endpoint. */
export async function ping(config: CloudinaryConfig): Promise<void> {
  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/ping`, {
    headers: { Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}` },
  });
  if (!res.ok) throw new Error(`Cloudinary credentials rejected (${res.status})`);
}
