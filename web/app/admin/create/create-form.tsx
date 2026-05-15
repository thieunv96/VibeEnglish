"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CEFR_LEVELS, LESSON_TYPES } from "@/lib/constants";
import { createLessonAction } from "./actions";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Check, Loader2 } from "lucide-react";

type QuizQ = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  skill: "vocabulary" | "grammar" | "reading" | "listening";
};

const TYPES = LESSON_TYPES.filter((t) => t.id !== "video_quiz");

export function CreateLessonForm() {
  const router = useRouter();
  const t = useTranslations("admin.create");
  const tTypes = useTranslations("lessonTypes");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"quiz" | "writing" | "speaking" | "audio_quiz">("quiz");
  const [level, setLevel] = useState<(typeof CEFR_LEVELS)[number]>("B1");
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<QuizQ[]>([
    { question: "", options: ["", "", "", ""], correctIndex: 0, skill: "vocabulary" },
  ]);
  const [writing, setWriting] = useState({ prompt: "", sampleAnswer: "", minWords: 50 });
  const [speaking, setSpeaking] = useState({ targetText: "" });

  const updateQ = (idx: number, patch: Partial<QuizQ>) => {
    setQuiz((qs) => qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const tags = tagsInput.split(",").map((s) => s.trim()).filter(Boolean);
      const r = await createLessonAction({
        title,
        type,
        level,
        tags,
        publishImmediately,
        quiz: type === "quiz" ? quiz : undefined,
        writing: type === "writing" ? writing : undefined,
        speaking: type === "speaking" ? speaking : undefined,
      });
      if (r.ok) router.push(`/admin/queue`);
      else setError(r.error ?? "Lỗi");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title={t("basicInfo")}>
        <div className="space-y-3">
          <div>
            <Label htmlFor="title">{t("titleField")}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>{t("typeField")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              {TYPES.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={cn(
                    "rounded-lg border-2 p-2.5 text-center text-sm transition",
                    type === opt.id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-stone-200 bg-white"
                  )}
                >
                  <span className="block text-xl mb-1">{opt.icon}</span>
                  {tTypes(opt.id)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("levelField")}</Label>
              <div className="flex gap-1 mt-1">
                {CEFR_LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "flex-1 h-9 rounded-md border text-sm font-medium",
                      level === l ? "bg-brand-600 text-white border-brand-600" : "bg-white border-stone-300"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="tags">{t("tagsField")}</Label>
              <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="business, conditional, b1" />
            </div>
          </div>
        </div>
      </Section>

      {type === "quiz" && (
        <Section title={t("quizSection")}>
          <div className="space-y-4">
            {quiz.map((q, i) => (
              <div key={i} className="rounded-lg border border-stone-200 p-3 space-y-2 bg-stone-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">{t("questionN", { n: i + 1 })}</span>
                  {quiz.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuiz(quiz.filter((_, j) => j !== i))}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <Input
                  value={q.question}
                  onChange={(e) => updateQ(i, { question: e.target.value })}
                  placeholder={t("questionPlaceholder")}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQ(i, { correctIndex: oi })}
                        className={cn(
                          "size-6 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                          q.correctIndex === oi ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-300 text-stone-500"
                        )}
                        title={t("correctTooltip")}
                      >
                        {q.correctIndex === oi ? <Check className="size-3" /> : String.fromCharCode(65 + oi)}
                      </button>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const opts = [...q.options] as [string, string, string, string];
                          opts[oi] = e.target.value;
                          updateQ(i, { options: opts });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <select
                  value={q.skill}
                  onChange={(e) => updateQ(i, { skill: e.target.value as QuizQ["skill"] })}
                  className="rounded-md border border-stone-300 px-2 py-1 text-xs"
                >
                  <option value="vocabulary">Vocabulary</option>
                  <option value="grammar">Grammar</option>
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                </select>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setQuiz([...quiz, { question: "", options: ["", "", "", ""], correctIndex: 0, skill: "vocabulary" }])
              }
            >
              <Plus className="size-3.5" /> {t("addQuestion")}
            </Button>
          </div>
        </Section>
      )}

      {type === "writing" && (
        <Section title={t("writingPrompt")}>
          <div className="space-y-3">
            <div>
              <Label>{t("promptLabel")}</Label>
              <Textarea
                rows={3}
                value={writing.prompt}
                onChange={(e) => setWriting({ ...writing, prompt: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{t("sampleAnswer")}</Label>
              <Textarea
                rows={3}
                value={writing.sampleAnswer}
                onChange={(e) => setWriting({ ...writing, sampleAnswer: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("minWords")}</Label>
              <Input
                type="number"
                value={writing.minWords}
                onChange={(e) => setWriting({ ...writing, minWords: Number(e.target.value) })}
              />
            </div>
          </div>
        </Section>
      )}

      {type === "speaking" && (
        <Section title={t("speakingTarget")}>
          <Label>{t("targetText")}</Label>
          <Textarea
            rows={3}
            value={speaking.targetText}
            onChange={(e) => setSpeaking({ targetText: e.target.value })}
            required
          />
        </Section>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-5 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={publishImmediately} onCheckedChange={(v) => setPublishImmediately(v === true)} />
          {t("publishNow")}
        </label>
        {error && <span className="text-sm text-red-600">{error}</span>}
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {publishImmediately ? t("savePublish") : t("saveQueue")}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}
