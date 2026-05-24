export interface SplitSegment {
  text: string;
}

// Split prose into one segment per sentence (`.`, `!`, or `?` boundary).
export function splitSegments(text: string): SplitSegment[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ text: s }));
}
