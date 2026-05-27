"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GOAL_OPTIONS, TEST_PREP_GOALS, type GoalSlug } from "@/lib/learning-goals";
import { COUNTRIES } from "@/lib/countries";
import { LanguageMultiPicker } from "@/components/LanguageMultiPicker";

interface Props {
  email: string;
  initial: {
    name: string | null;
    birthYear: number | null;
    country: string | null;
    occupation: string | null;
    nativeLanguages: string[];
    dailyTimeGoalMin: number | null;
    learningGoals: GoalSlug[];
  };
  labels: {
    email: string;
    name: string;
    birthYear: string;
    country: string;
    countryNone: string;
    occupation: string;
    nativeLanguages: string;
    nativeLanguagesPlaceholder: string;
    nativeLanguagesSearch: string;
    nativeLanguagesNone: string;
    dailyTimeGoalMin: string;
    learningGoals: string;
    learningGoalsTestPrep: string;
    learningGoalsGeneral: string;
    save: string;
    saved: string;
    goalNames: Record<GoalSlug, string>;
  };
}

export function ProfileForm({ email, initial, labels }: Props) {
  const t = useTranslations("profile");
  const [name, setName] = useState(initial.name ?? "");
  const [birthYear, setBirthYear] = useState(initial.birthYear ? String(initial.birthYear) : "");
  const [country, setCountry] = useState(initial.country ?? "");
  const [occupation, setOccupation] = useState(initial.occupation ?? "");
  const [nativeLanguages, setNativeLanguages] = useState<string[]>(initial.nativeLanguages);
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
          country: country || null,
          occupation: occupation.trim() || null,
          nativeLanguages,
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

  const testPrep = GOAL_OPTIONS.filter((g) => TEST_PREP_GOALS.has(g));
  const general = GOAL_OPTIONS.filter((g) => !TEST_PREP_GOALS.has(g));

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
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            data-testid="profile-country"
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          >
            <option value="">{labels.countryNone}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={labels.occupation}>
          <input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            data-testid="profile-occupation"
            className="w-full rounded-md border border-border bg-surface px-3 py-2"
          />
        </Field>
        <Field label={labels.nativeLanguages}>
          <LanguageMultiPicker
            value={nativeLanguages}
            onChange={setNativeLanguages}
            labels={{
              placeholder: labels.nativeLanguagesPlaceholder,
              summary: (n: number) => t("nativeLanguagesSummary", { n }),
              search: labels.nativeLanguagesSearch,
              none: labels.nativeLanguagesNone,
            }}
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
        <div className="space-y-3" data-testid="profile-goals">
          <GoalRow
            title={labels.learningGoalsTestPrep}
            options={testPrep}
            goals={goals}
            toggle={toggleGoal}
            names={labels.goalNames}
          />
          <GoalRow
            title={labels.learningGoalsGeneral}
            options={general}
            goals={goals}
            toggle={toggleGoal}
            names={labels.goalNames}
          />
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

function GoalRow({
  title,
  options,
  goals,
  toggle,
  names,
}: {
  title: string;
  options: readonly GoalSlug[];
  goals: Set<GoalSlug>;
  toggle: (g: GoalSlug) => void;
  names: Record<GoalSlug, string>;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted mb-1.5">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((g) => {
          const on = goals.has(g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => toggle(g)}
              data-testid={`goal-${g}`}
              aria-pressed={on}
              className={
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors " +
                (on
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-foreground hover:border-brand")
              }
            >
              {names[g]}
            </button>
          );
        })}
      </div>
    </div>
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
