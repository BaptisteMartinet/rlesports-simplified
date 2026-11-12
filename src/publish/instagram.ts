// Instagram publishing API, plain fetch. Works with both kinds of token Meta hands out:
// - Unified Login (all new apps): a "business integration system user" token, starting
//   with "EAA". Host graph.facebook.com; /me is the system user and the Instagram
//   account comes from /me/assigned_instagram_accounts.
// - Instagram Login (older apps, some dashboard test tokens): starts with "IG".
//   Host graph.instagram.com; /me is the Instagram account itself.
// The publishing endpoints (/<IG_ID>/media, /media_publish) are the same on both.
// Docs: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-unified-login
//       https://developers.facebook.com/docs/instagram-platform/content-publishing

export const API_VERSION = 'v27.0';

export type TokenKind = 'unified-login' | 'instagram-login';

export function tokenKind(accessToken: string): TokenKind {
  return accessToken.startsWith('IG') ? 'instagram-login' : 'unified-login';
}

export class InstagramError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: number,
  ) {
    super(message);
  }
}

export interface InstagramClient {
  readonly tokenKind: TokenKind;
  me(): Promise<{ userId: string; username: string }>;
  /** For diagnostics: who the token belongs to (system user name, or Instagram username). */
  owner(): Promise<string>;
  /** Creates a container for one image: a story, a single feed post, or a carousel item. */
  createImage(userId: string, opts: { imageUrl: string; kind: 'story' | 'feed' | 'carousel-item'; caption?: string }): Promise<string>;
  createCarousel(userId: string, opts: { children: string[]; caption?: string }): Promise<string>;
  /** Waits until a container is ready to publish. */
  waitUntilReady(containerId: string): Promise<void>;
  publish(userId: string, containerId: string): Promise<string>;
  /** Posts published through the API in the last 24 hours. */
  publishingUsage(userId: string): Promise<number>;
  /** Looks an Instagram account up by ID; fails if the ID is wrong or the token can't access it. */
  account(userId: string): Promise<{ userId: string; username: string }>;
}

export function instagramClient(accessToken: string, { pollMs = 5_000, maxWaitMs = 5 * 60_000 } = {}): InstagramClient {
  const kind = tokenKind(accessToken);
  const BASE = `https://graph.${kind === 'instagram-login' ? 'instagram' : 'facebook'}.com/${API_VERSION}`;

  async function request<T>(method: 'GET' | 'POST', path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE}/${path}`);
    const init: RequestInit = { method, headers: { Authorization: `Bearer ${accessToken}` } };
    if (method === 'GET') for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    else init.body = new URLSearchParams(params);

    const res = await fetch(url, init);
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number } } & T;
    if (!res.ok || body.error) {
      // The error message never contains the token, so it is safe to log.
      throw new InstagramError(`Instagram ${method} /${path} failed (${res.status}): ${body.error?.message ?? 'unknown error'}`, res.status, body.error?.code);
    }
    return body;
  }

  return {
    tokenKind: kind,

    async owner() {
      if (kind === 'instagram-login') return `@${(await this.me()).username}`;
      const me = await request<{ id: string; name?: string }>('GET', 'me', { fields: 'id,name' });
      return `system user "${me.name ?? '?'}" (id ${me.id})`;
    },

    async me() {
      if (kind === 'instagram-login') {
        const body = await request<{ user_id?: string; username?: string; data?: { user_id: string; username: string }[] }>('GET', 'me', {
          fields: 'user_id,username',
        });
        // The docs show both a flat object and a `data` array; accept either.
        const user = body.data?.[0] ?? body;
        if (!user.user_id) throw new Error('Instagram /me returned no user_id');
        return { userId: String(user.user_id), username: String(user.username) };
      }
      // With a Unified Login token, /me is the system user; the Instagram account is assigned to it.
      // Meta sometimes answers this with an empty list for a moment (seen right after an
      // assignment change), so an empty answer is retried before giving up.
      let accounts: { id: string; username?: string }[] = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        const body = await request<{ data?: { id: string; username?: string }[] }>('GET', 'me/assigned_instagram_accounts', {
          fields: 'id,username',
        });
        accounts = body.data ?? [];
        if (accounts.length > 0) break;
        if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 3_000));
      }
      const [account] = accounts;
      if (!account) throw new Error('No Instagram account is assigned to this token (set IG_USER_ID to skip this lookup)');
      if (accounts.length > 1) {
        throw new Error(
          `Several Instagram accounts on this token (${accounts.map((a) => `@${a.username} = ${a.id}`).join(', ')}): set IG_USER_ID to the right one`,
        );
      }
      return { userId: account.id, username: String(account.username) };
    },

    async createImage(userId, { imageUrl, kind, caption }) {
      const params: Record<string, string> = { image_url: imageUrl };
      if (kind === 'story') params.media_type = 'STORIES';
      if (kind === 'carousel-item') params.is_carousel_item = 'true';
      if (kind === 'feed' && caption) params.caption = caption;
      return (await request<{ id: string }>('POST', `${userId}/media`, params)).id;
    },

    async createCarousel(userId, { children, caption }) {
      const params: Record<string, string> = { media_type: 'CAROUSEL', children: children.join(',') };
      if (caption) params.caption = caption;
      return (await request<{ id: string }>('POST', `${userId}/media`, params)).id;
    },

    async waitUntilReady(containerId) {
      const deadline = Date.now() + maxWaitMs;
      for (;;) {
        const { status_code } = await request<{ status_code: string }>('GET', containerId, { fields: 'status_code' });
        if (status_code === 'FINISHED') return;
        if (status_code !== 'IN_PROGRESS') throw new Error(`Instagram container ${containerId} is ${status_code}`);
        if (Date.now() > deadline) throw new Error(`Instagram container ${containerId} still processing after ${maxWaitMs / 1000}s`);
        await new Promise((r) => setTimeout(r, pollMs));
      }
    },

    async publish(userId, containerId) {
      return (await request<{ id: string }>('POST', `${userId}/media_publish`, { creation_id: containerId })).id;
    },

    async account(userId) {
      const body = await request<{ id?: string; username?: string }>('GET', userId, { fields: 'username' });
      if (!body.username) throw new Error(`Instagram account ${userId} returned no username`);
      return { userId: String(body.id ?? userId), username: body.username };
    },

    async publishingUsage(userId) {
      const body = await request<{ data?: { quota_usage?: number }[] }>('GET', `${userId}/content_publishing_limit`);
      return body.data?.[0]?.quota_usage ?? 0;
    },
  };
}
