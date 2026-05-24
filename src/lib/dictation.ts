// Pure word-level diff for dictation scoring.
// Normalizes (lowercase, strip punctuation) before comparing.

export type WordStatus = "ok" | "miss" | "extra";

export interface DiffWord {
  word: string;
  status: WordStatus;
}

export interface DictationResult {
  diff: DiffWord[];
  total: number;
  correct: number;
  accuracy: number;
}

function normalize(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^\p{L}\p{N}']/gu, "")
    .trim();
}

function tokenize(s: string): string[] {
  return s
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export function scoreDictation(target: string, input: string): DictationResult {
  const tgtRaw = tokenize(target);
  const usrRaw = tokenize(input);
  const tgt = tgtRaw.map(normalize);
  const usr = usrRaw.map(normalize);

  const m = tgt.length;
  const n = usr.length;
  // LCS DP
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (tgt[i] && tgt[i] === usr[j]) dp[i + 1][j + 1] = dp[i][j] + 1;
      else dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Backtrack to produce a merged diff aligned to the target order.
  const diff: DiffWord[] = [];
  let i = m;
  let j = n;
  const ops: DiffWord[] = [];
  while (i > 0 && j > 0) {
    if (tgt[i - 1] && tgt[i - 1] === usr[j - 1]) {
      ops.push({ word: tgtRaw[i - 1], status: "ok" });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ word: tgtRaw[i - 1], status: "miss" });
      i--;
    } else {
      ops.push({ word: usrRaw[j - 1], status: "extra" });
      j--;
    }
  }
  while (i > 0) {
    ops.push({ word: tgtRaw[i - 1], status: "miss" });
    i--;
  }
  while (j > 0) {
    ops.push({ word: usrRaw[j - 1], status: "extra" });
    j--;
  }
  diff.push(...ops.reverse());

  const correct = diff.filter((d) => d.status === "ok").length;
  const total = Math.max(tgtRaw.length, 1);
  return {
    diff,
    total,
    correct,
    accuracy: correct / total,
  };
}
