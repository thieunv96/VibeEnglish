"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Props {
  word: string;
  sourceLessonSlug?: string;
}

export function SaveWordButton({ word, sourceLessonSlug }: Props) {
  const { status } = useSession();
  const loading = status === "loading";
  const [saved, setSaved] = useState(false);

  async function save() {
    // Guard a programmatic call while the session is still resolving — the
    // button is disabled too, so a fast human click is never silently dropped.
    if (status === "loading") return;
    if (status === "unauthenticated") {
      toast.info("Sign in to save vocabulary.");
      return;
    }
    const res = await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, sourceLessonSlug }),
    });
    if (res.ok) {
      setSaved(true);
      toast.success(`Saved "${word}"`);
    } else {
      toast.error("Could not save.");
    }
  }

  return (
    <button
      type="button"
      onClick={save}
      data-testid="save-word"
      disabled={saved || loading}
      className="inline-flex items-center gap-1 rounded-md border border-brand text-brand hover:bg-brand-soft px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
    >
      {saved ? "✓ Saved" : `+ Save “${word}”`}
    </button>
  );
}
