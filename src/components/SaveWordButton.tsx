"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface Props {
  word: string;
  sourceLessonSlug?: string;
}

export function SaveWordButton({ word, sourceLessonSlug }: Props) {
  const { status } = useSession();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (status !== "authenticated") {
      setError("Sign in to save.");
      return;
    }
    setError(null);
    const res = await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, sourceLessonSlug }),
    });
    if (res.ok) setSaved(true);
    else setError("Could not save.");
  }

  return (
    <button
      type="button"
      onClick={save}
      data-testid="save-word"
      disabled={saved}
      className="inline-flex items-center gap-1 rounded-md border border-brand text-brand hover:bg-brand-soft px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
    >
      {saved ? "✓ Saved" : `+ Save “${word}”`}
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </button>
  );
}
