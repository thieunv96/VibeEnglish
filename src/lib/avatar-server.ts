import path from "node:path";

export const AVATAR_DIR = path.join(process.cwd(), "public", "avatars");

export function avatarPath(userId: string): string {
  return path.join(AVATAR_DIR, `${userId}.jpg`);
}

export function avatarUrl(userId: string, version: number): string {
  return `/avatars/${userId}.jpg?v=${version}`;
}
