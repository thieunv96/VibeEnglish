"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SKILLS = [
  "grammar","vocabulary","listening","reading","speaking","writing","word-skills","business",
] as const;
const LEVELS = ["A1","A2","B1","B2","C1","C2"] as const;
const TYPES = ["mcq", "fill", "match"] as const;

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

interface MatchPair { left: string; right: string }

interface FormQuestion {
  id: string;
  type: "mcq" | "fill" | "match";
  prompt: string;
  options?: string[];   // mcq
  answer: string;       // mcq + fill
  pairs?: MatchPair[];  // match
  explanation?: string;
}

interface InitialValues {
  id?: string;
  slug?: string;
  skill?: string;
  title?: string;
  level?: string;
  type?: string;
  description?: string | null;
  questions?: FormQuestion[];
}

function emptyQuestion(type: FormQuestion["type"]): FormQuestion {
  const id = "q" + Math.random().toString(36).slice(2, 8);
  if (type === "mcq") return { id, type, prompt: "", options: ["", "", "", ""], answer: "" };
  if (type === "fill") return { id, type, prompt: "", answer: "" };
  return { id, type: "match", prompt: "Match the pairs.", answer: "auto", pairs: [{ left: "", right: "" }, { left: "", right: "" }] };
}

export function ExerciseForm({ initial }: { initial?: InitialValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [skill, setSkill] = useState(initial?.skill ?? SKILLS[0]);
  const [level, setLevel] = useState(initial?.level ?? "A1");
  const [type, setType] = useState<FormQuestion["type"]>((initial?.type as FormQuestion["type"]) ?? "mcq");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [questions, setQuestions] = useState<FormQuestion[]>(
    (initial?.questions && initial.questions.length > 0
      ? initial.questions.map((q) => ({
          ...q,
          answer: Array.isArray(q.answer) ? (q.answer[0] ?? "") : (q.answer ?? ""),
        }))
      : [emptyQuestion("mcq")]) as FormQuestion[],
  );
  const [isPending, startTransition] = useTransition();

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched && !isEdit) setSlug(slugify(v));
  }

  function setQ(i: number, patch: Partial<FormQuestion>) {
    setQuestions(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function setMcqOption(qi: number, oi: number, v: string) {
    const q = questions[qi];
    if (!q.options) return;
    const next = [...q.options];
    next[oi] = v;
    setQ(qi, { options: next });
  }

  function setMatchPair(qi: number, pi: number, side: "left" | "right", v: string) {
    const q = questions[qi];
    if (!q.pairs) return;
    const next = q.pairs.map((p, idx) => (idx === pi ? { ...p, [side]: v } : p));
    setQ(qi, { pairs: next });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !slug.trim() || questions.length === 0) {
      toast.error("Title, slug and at least one question are required.");
      return;
    }
    const cleanQuestions = questions.map((q) => {
      if (q.type === "mcq") {
        const opts = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
        return { id: q.id, type: q.type, prompt: q.prompt.trim(), options: opts, answer: q.answer.trim(), explanation: q.explanation?.trim() || undefined };
      }
      if (q.type === "fill") {
        return { id: q.id, type: q.type, prompt: q.prompt.trim(), answer: q.answer.trim(), explanation: q.explanation?.trim() || undefined };
      }
      const pairs = (q.pairs ?? []).filter((p) => p.left.trim() && p.right.trim());
      return { id: q.id, type: q.type, prompt: q.prompt.trim() || "Match the pairs.", answer: "auto", pairs };
    });

    const body = { slug: slug.trim(), skill, title: title.trim(), level, type, description: description.trim() || null, questions: cleanQuestions };
    startTransition(async () => {
      const res = await fetch(isEdit ? `/api/admin/exercises/${initial!.id}` : "/api/admin/exercises", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Save failed");
        return;
      }
      toast.success(isEdit ? "Exercise updated" : "Exercise created");
      router.push("/admin/exercises");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-3xl" data-testid="exercise-form">
      <Field label="Title" required>
        <input value={title} onChange={(e) => onTitleChange(e.target.value)} required data-testid="ex-title" className="w-full rounded-md border border-border bg-surface px-3 py-2" />
      </Field>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Slug" required>
          <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} required pattern="[a-z0-9\-]+" data-testid="ex-slug" className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm" />
        </Field>
        <Field label="Skill" required>
          <select value={skill} onChange={(e) => setSkill(e.target.value)} data-testid="ex-skill" className="w-full rounded-md border border-border bg-surface px-3 py-2">
            {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Level" required>
          <select value={level} onChange={(e) => setLevel(e.target.value)} data-testid="ex-level" className="w-full rounded-md border border-border bg-surface px-3 py-2">
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Type" required>
        <select value={type} onChange={(e) => setType(e.target.value as FormQuestion["type"])} data-testid="ex-type" className="rounded-md border border-border bg-surface px-3 py-2">
          {TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
      </Field>
      <Field label="Description">
        <input value={description} onChange={(e) => setDescription(e.target.value)} data-testid="ex-description" className="w-full rounded-md border border-border bg-surface px-3 py-2" />
      </Field>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-semibold">Questions ({questions.length})</label>
          <button type="button" onClick={() => setQuestions([...questions, emptyQuestion(type)])} className="text-xs font-semibold text-brand">+ Add question</button>
        </div>
        <ol className="space-y-4" data-testid="ex-questions">
          {questions.map((q, qi) => (
            <li key={q.id} className="rounded-md border border-border bg-white p-4 space-y-2" data-testid={`ex-q-${qi}`}>
              <div className="flex justify-between text-xs text-muted">
                <span>Q{qi + 1} · {q.type.toUpperCase()}</span>
                <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== qi))} className="text-red-600">Remove</button>
              </div>
              <input value={q.prompt} onChange={(e) => setQ(qi, { prompt: e.target.value })} placeholder="Prompt" className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm" />

              {q.type === "mcq" && q.options && (
                <div className="space-y-1">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name={`ans-${qi}`}
                        checked={q.answer === opt && opt.trim() !== ""}
                        onChange={() => setQ(qi, { answer: opt })}
                      />
                      <input
                        value={opt}
                        onChange={(e) => setMcqOption(qi, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted">Select the radio next to the correct option.</p>
                </div>
              )}

              {q.type === "fill" && (
                <input
                  value={q.answer}
                  onChange={(e) => setQ(qi, { answer: e.target.value })}
                  placeholder="Answer"
                  className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-mono"
                />
              )}

              {q.type === "match" && q.pairs && (
                <div className="space-y-1">
                  {q.pairs.map((p, pi) => (
                    <div key={pi} className="flex gap-2">
                      <input value={p.left} onChange={(e) => setMatchPair(qi, pi, "left", e.target.value)} placeholder={`Left ${pi + 1}`} className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm" />
                      <span className="self-center text-muted">↔</span>
                      <input value={p.right} onChange={(e) => setMatchPair(qi, pi, "right", e.target.value)} placeholder={`Right ${pi + 1}`} className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm" />
                    </div>
                  ))}
                  <button type="button" onClick={() => setQ(qi, { pairs: [...(q.pairs ?? []), { left: "", right: "" }] })} className="text-xs text-brand">+ Add pair</button>
                </div>
              )}

              <input
                value={q.explanation ?? ""}
                onChange={(e) => setQ(qi, { explanation: e.target.value })}
                placeholder="Explanation (optional)"
                className="w-full rounded-md border border-border bg-surface px-2 py-1 text-xs italic"
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} data-testid="ex-submit" className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-5 py-2.5 disabled:opacity-50">
          {isPending ? "Saving…" : isEdit ? "Update exercise" : "Create exercise"}
        </button>
        <button type="button" onClick={() => router.push("/admin/exercises")} className="rounded-md border border-border bg-white hover:bg-surface px-5 py-2.5 font-semibold">Cancel</button>
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
