// Pure (client + server safe) avatar helpers — no Node imports.

/** Cheap initials for fallback avatar. "Anh Nguyen" → "AN", "x@y.com" → "X". */
export function initialsOf(nameOrEmail: string): string {
  const cleaned = nameOrEmail.trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return cleaned[0].toUpperCase();
}

/** Stable color tuple for a user, derived from email hash. */
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 55% 45%)`;
}
