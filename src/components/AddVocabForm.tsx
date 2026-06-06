"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Props {
  sourceLessonSlug?: string;
  labels?: {
    word: string;
    definition: string;
    add: string;
    saved: string;
    failed: string;
    loginPrompt: string;
  };
}

const DEFAULT_LABELS: NonNullable<Props["labels"]> = {
  word: "Word",
  definition: "Definition (optional)",
  add: "Add to vocabulary",
  saved: 'Saved "{word}"',
  failed: "Could not save.",
  loginPrompt: "Sign in to save vocabulary.",
};

export function AddVocabForm({ sourceLessonSlug, labels = DEFAULT_LABELS }: Props) {
  const { status } = useSession();
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const w = word.trim();
    if (!w) return;
    if (status === "unauthenticated") {
      toast.info(labels.loginPrompt);
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: w,
          definition: definition.trim() || undefined,
          sourceLessonSlug,
        }),
      });
      if (res.ok) {
        toast.success(labels.saved.replace("{word}", w));
        setWord("");
        setDefinition("");
      } else {
        toast.error(labels.failed);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      data-testid="add-vocab-form"
      className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <label className="flex-1">
        <span className="block text-xs font-semibold text-muted mb-1">{labels.word}</span>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          data-testid="add-vocab-word"
          className="w-full rounded-md border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="flex-1">
        <span className="block text-xs font-semibold text-muted mb-1">{labels.definition}</span>
        <input
          type="text"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          data-testid="add-vocab-definition"
          className="w-full rounded-md border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !word.trim()}
        data-testid="add-vocab-submit"
        className="inline-flex items-center justify-center rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-4 py-2 disabled:opacity-50"
      >
        {labels.add}
      </button>
    </form>
  );
}
