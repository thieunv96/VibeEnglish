"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { splitSegments, type SplitSegment } from "@/lib/segments";

const CATEGORIES = [
  "short-stories",
  "conversations",
  "ted-ed",
  "youtube-random",
  "toeic-listening",
  "toefl-listening",
  "ielts-listening",
  "medical-english-oet",
  "stories-for-kids",
] as const;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface InitialValues {
  id?: string;
  slug?: string;
  category?: string;
  title?: string;
  level?: string;
  description?: string | null;
  transcript?: string;
  segments?: SplitSegment[];
}

export function LessonForm({ initial }: { initial?: InitialValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [level, setLevel] = useState(initial?.level ?? "A1");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [transcript, setTranscript] = useState(initial?.transcript ?? "");
  const [segments, setSegments] = useState<SplitSegment[]>(initial?.segments ?? []);
  const [isPending, startTransition] = useTransition();

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched && !isEdit) setSlug(slugify(v));
  }

  function autoSplit() {
    setSegments(splitSegments(transcript));
  }

  function updateSegment(i: number, text: string) {
    setSegments(segments.map((s, idx) => (idx === i ? { text } : s)));
  }

  function addSegment() {
    setSegments([...segments, { text: "" }]);
  }

  function removeSegment(i: number) {
    setSegments(segments.filter((_, idx) => idx !== i));
  }

  function moveSegment(i: number, delta: number) {
    const next = [...segments];
    const j = i + delta;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSegments(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const segs = segments.filter((s) => s.text.trim().length > 0);
    if (!title.trim() || !slug.trim() || !transcript.trim() || segs.length === 0) {
      toast.error("Title, slug, transcript and at least one segment are required.");
      return;
    }
    const body = { slug: slug.trim(), category, title: title.trim(), level, description: description.trim() || null, transcript: transcript.trim(), segments: segs };
    startTransition(async () => {
      const res = await fetch(isEdit ? `/api/admin/lessons/${initial!.id}` : "/api/admin/lessons", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Save failed");
        return;
      }
      toast.success(isEdit ? "Lesson updated" : "Lesson created");
      router.push("/admin/lessons");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-3xl" data-testid="lesson-form">
      <Field label="Title" required>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          data-testid="lesson-title"
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Slug" required>
          <input
            value={slug}
            onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
            required
            pattern="[a-z0-9\-]+"
            data-testid="lesson-slug"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm"
          />
        </Field>
        <Field label="Category" required>
          <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="lesson-category" className="w-full rounded-md border border-border bg-surface px-3 py-2">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Level" required>
          <select value={level} onChange={(e) => setLevel(e.target.value)} data-testid="lesson-level" className="w-full rounded-md border border-border bg-surface px-3 py-2">
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          data-testid="lesson-description"
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </Field>

      <Field label="Transcript" required>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          required
          rows={6}
          data-testid="lesson-transcript"
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
        <button type="button" onClick={autoSplit} data-testid="lesson-autosplit" className="mt-2 text-xs font-semibold text-brand hover:text-brand-strong">
          Auto-split into segments →
        </button>
      </Field>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold">Segments ({segments.length})</label>
          <button type="button" onClick={addSegment} className="text-xs font-semibold text-brand">+ Add segment</button>
        </div>
        <ol className="space-y-2" data-testid="lesson-segments">
          {segments.map((s, i) => (
            <li key={i} className="flex gap-2 items-start" data-testid={`lesson-segment-${i}`}>
              <span className="text-xs text-muted w-6 pt-2">{i + 1}.</span>
              <textarea
                value={s.text}
                onChange={(e) => updateSegment(i, e.target.value)}
                rows={2}
                className="flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
              />
              <div className="flex flex-col gap-1 text-xs">
                <button type="button" onClick={() => moveSegment(i, -1)} className="text-muted hover:text-brand">↑</button>
                <button type="button" onClick={() => moveSegment(i, 1)} className="text-muted hover:text-brand">↓</button>
                <button type="button" onClick={() => removeSegment(i)} className="text-red-600">✕</button>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          data-testid="lesson-submit"
          className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-5 py-2.5 disabled:opacity-50"
        >
          {isPending ? "Saving…" : isEdit ? "Update lesson" : "Create lesson"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/lessons")}
          className="rounded-md border border-border bg-white hover:bg-surface px-5 py-2.5 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1">{label}{required && <span className="text-red-600"> *</span>}</span>
      {children}
    </label>
  );
}
