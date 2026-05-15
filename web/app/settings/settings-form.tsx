"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GOALS, INDUSTRIES, TIME_OPTIONS, CEFR_LEVELS } from "@/lib/constants";
import { updateGoalsAction, resetPlacementAction } from "./actions";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, RotateCcw, Save } from "lucide-react";
import type { OnboardingProfile } from "@/db/schema";

export function SettingsForm({ profile }: { profile: OnboardingProfile }) {
  const t = useTranslations("settings");
  const tGoals = useTranslations("goals");
  const tIndustries = useTranslations("industries");
  const tTime = useTranslations("time");
  const tCefr = useTranslations("cefr");
  const [goals, setGoals] = useState<string[]>(profile.goals as string[]);
  const [industries, setIndustries] = useState<string[]>(profile.industries as string[]);
  const [dailyMinutes, setDailyMinutes] = useState<number>(profile.dailyMinutes);
  const [targetLevel, setTargetLevel] = useState<(typeof CEFR_LEVELS)[number]>(profile.targetLevel);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const onSave = () => {
    startTransition(async () => {
      const r = await updateGoalsAction({ goals, industries, dailyMinutes, targetLevel });
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
      }
    });
  };

  const onResetPlacement = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    startTransition(async () => {
      await resetPlacementAction();
      router.push("/onboarding");
    });
  };

  return (
    <div className="space-y-6">
      <Section title={t("section1")} hint={t("section1Hint")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {GOALS.map((g) => {
            const active = goals.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(goals, g.id, setGoals)}
                className={cn(
                  "text-left rounded-xl border-2 p-3 flex items-start gap-2.5 transition",
                  active ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <div className={cn(
                  "mt-0.5 size-4 rounded border-2 flex items-center justify-center shrink-0",
                  active ? "bg-brand-600 border-brand-600 text-white" : "border-stone-300"
                )}>
                  {active && <Check className="size-3 stroke-[3]" />}
                </div>
                <span className="text-lg">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{tGoals(`${g.id}.title`)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t("section2")}>
        <div className="grid grid-cols-2 gap-2.5">
          {INDUSTRIES.map((g) => {
            const active = industries.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(industries, g.id, setIndustries)}
                className={cn(
                  "text-left rounded-xl border-2 p-3 flex items-center gap-2.5 transition",
                  active ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <div className={cn(
                  "size-4 rounded border-2 flex items-center justify-center shrink-0",
                  active ? "bg-brand-600 border-brand-600 text-white" : "border-stone-300"
                )}>
                  {active && <Check className="size-3 stroke-[3]" />}
                </div>
                <span className="text-lg">{g.icon}</span>
                <div className="text-sm font-medium">{tIndustries(g.id)}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t("section3")}>
        <div className="grid grid-cols-3 gap-3">
          {TIME_OPTIONS.map((opt) => {
            const labelKey = `min${opt.id}`;
            const descKey = opt.id === 5 ? "veryShort" : opt.id === 15 ? "balanced" : "deeper";
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDailyMinutes(opt.id)}
                className={cn(
                  "rounded-xl border-2 p-4 text-center transition",
                  dailyMinutes === opt.id ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <div className="font-bold text-lg">{tTime(labelKey)}</div>
                <div className="text-xs text-stone-500 mt-0.5">{tTime(descKey)}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t("section4")}>
        <div className="space-y-4">
          <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
            <div className="text-xs text-stone-500">{t("currentLevel")}</div>
            <div className="font-bold text-2xl">{profile.level} <span className="text-sm font-normal text-stone-500">({tCefr(`${profile.level}.name`)})</span></div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t("targetLevel")}</label>
            <div className="flex gap-2">
              {CEFR_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setTargetLevel(lvl)}
                  className={cn(
                    "flex-1 rounded-lg border-2 p-3 transition text-center",
                    targetLevel === lvl ? "border-brand-500 bg-brand-50 font-bold text-brand-700" : "border-stone-200 bg-white"
                  )}
                >
                  <div className="font-bold">{lvl}</div>
                  <div className="text-[10px] text-stone-500">{tCefr(`${lvl}.name`)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <AlertTriangle className="size-4" /> {t("replay")}
            </div>
            <p className="text-xs text-amber-800">
              {t("replayHint")}
              {confirmReset && ` ${t("replayWarning")}`}
            </p>
            <Button variant={confirmReset ? "danger" : "outline"} size="sm" onClick={onResetPlacement} disabled={pending}>
              <RotateCcw className="size-3.5" />
              {confirmReset ? t("replayConfirm") : t("replay")}
            </Button>
          </div>
        </div>
      </Section>

      <footer className="sticky bottom-0 bg-stone-50 py-4 -mx-4 px-4 border-t border-stone-200 flex items-center justify-between">
        {saved ? (
          <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
            <Check className="size-4" /> {t("saved")}
          </span>
        ) : (
          <span className="text-xs text-stone-500">{t("saveHint")}</span>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>{t("cancel")}</Button>
          <Button onClick={onSave} disabled={pending || goals.length === 0}>
            <Save className="size-4" /> {t("save")}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="font-bold mb-1">{title}</h2>
      {hint && <p className="text-xs text-stone-500 mb-4">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}
