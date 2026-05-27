import path from "node:path";

export const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");

export function avatarPath(userId: string): string {
  return path.join(AVATAR_DIR, `${userId}.jpg`);
}

/**
 * Avatar URL goes through our own /api/avatars/[userId] route so the file is
 * always served from disk at request time. `next start` doesn't reliably pick
 * up files written to `public/` after the build; the API route does.
 */
export function avatarUrl(userId: string, version: number): string {
  return `/api/avatars/${userId}?v=${version}`;
}

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
export function isSafeUserId(id: string): boolean {
  return SAFE_ID.test(id);
}
