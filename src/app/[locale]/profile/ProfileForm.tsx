"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { GOAL_OPTIONS, type GoalSlug } from "@/lib/learning-goals";

interface Props {
  email: string;
  initial: {
    name: string | null;
    birthYear: number | null;
    country: string | null;
    occupation: string | null;
    nativeLanguage: string | null;
    dailyTimeGoalMin: number | null;
    learningGoals: GoalSlug[];
  };
  labels: {
    email: string;
    name: string;
    birthYear: string;
    country: string;
    occupation: string;
    nativeLanguage: string;
    dailyTimeGoalMin: string;
    learningGoals: string;
    save: string;
    saved: string;
    goalNames: Record<GoalSlug, string>;
  };
}

export function ProfileForm({ email, initial, labels }: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [birthYear, setBirthYear] = useState(initial.birthYear ? String(initial.birthYear) : "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [occupation, setOccupation] = useState(initial.occupation ?? "");
  const [nativeLanguage, setNativeLanguage] = useState(initial.nativeLanguage ?? "");
  const [dailyTimeGoalMin, setDailyTimeGoalMin] = useState(
    initial.dailyTimeGoalMin ? String(initial.dailyTimeGoalMin) : "",
  );
  const [goals, setGoals] = useState<Set<GoalSlug>>(new Set(initial.learningGoals));
  const [isPending, startTransition] = useTransition();

  function toggleGoal(g: GoalSlug) {
    const next = new Set(goals);
    if (next.has(g)) next.delete(g);
    else next.add(g);
    setGoals(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          birthYear: birthYear.trim() ? Number(birthYear) : null,
          country: country.trim() || null,
          occupation: occupation.trim() || null,
          nativeLanguage: nativeLanguage.trim() || null,
          dailyTimeGoalMin: dailyTimeGoalMin.trim() ? Number(dailyTimeGoalMin) : null,
          learningGoals: Array.from(goals),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Save failed");
        return;
      }
      toast.success(labels.saved);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="profile-form">
      <Field label={labels.email}>
        <input
          value={email}
          readOnly
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-muted"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={labels.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="profile-name"
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label={labels.birthYear}>
          <input
            type="number"
            min={1900}
            max={2030}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            data-testid="profile-birth-year"
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label={labels.country}>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            data-testid="profile-country"
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label={labels.nativeLanguage}>
          <input
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            data-testid="profile-native-lang"
            placeholder="vi, en, es…"
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label={labels.occupation}>
          <input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            data-testid="profile-occupation"
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label={labels.dailyTimeGoalMin}>
          <input
            type="number"
            min={1}
            max={600}
            value={dailyTimeGoalMin}
            onChange={(e) => setDailyTimeGoalMin(e.target.value)}
            data-testid="profile-daily-goal"
            placeholder="e.g. 20"
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </Field>
      </div>

      <Field label={labels.learningGoals}>
        <div className="flex flex-wrap gap-2" data-testid="profile-goals">
          {GOAL_OPTIONS.map((g) => {
            const on = goals.has(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGoal(g)}
                data-testid={`goal-${g}`}
                aria-pressed={on}
                className={
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors " +
                  (on
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white text-foreground hover:border-brand")
                }
              >
                {labels.goalNames[g]}
              </button>
            );
          })}
        </div>
      </Field>

      <button
        type="submit"
        disabled={isPending}
        data-testid="profile-submit"
        className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-5 py-2.5 disabled:opacity-50"
      >
        {isPending ? "…" : labels.save}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
