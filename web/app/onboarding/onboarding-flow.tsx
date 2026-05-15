"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GOALS,
  INDUSTRIES,
  TIME_OPTIONS,
  CEFR_LEVELS,
  LEVEL_INFO,
  SKILL_LABELS,
} from "@/lib/constants";
import { PLACEMENT_QUESTIONS } from "./placement-bank";
import { submitOnboarding } from "./actions";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Clock, Brain, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

type QAState = {
  index: number;
  answers: { questionId: string; correct: boolean; skill: string }[];
  feedback: "idle" | "correct" | "wrong";
  selectedOption: number | null;
};

export function OnboardingFlow({ userName }: { userName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState<number>(15);
  const [skipQuiz, setSkipQuiz] = useState(false);
  const [qa, setQa] = useState<QAState>({ index: 0, answers: [], feedback: "idle", selectedOption: null });
  const [predictedLevel, setPredictedLevel] = useState<(typeof CEFR_LEVELS)[number]>("A1");
  const [skillBreakdown, setSkillBreakdown] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();

  const totalSteps = 5;
  const progress = ((step + 1) / (totalSteps + 1)) * 100;

  const canAdvance = useMemo(() => {
    if (step === 1) return goals.length >= 1;
    if (step === 2) return industries.length >= 0; // industries optional
    return true;
  }, [step, goals, industries]);

  const toggleArray = (arr: string[], v: string, setter: (a: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  // Computed skill scores from current answers
  const computeSkillScores = (answers: QAState["answers"]) => {
    const skills = ["vocabulary", "grammar", "reading", "listening"] as const;
    const result: Record<string, number> = {};
    for (const s of skills) {
      const subset = answers.filter((a) => a.skill === s);
      if (subset.length === 0) {
        result[s] = 50; // neutral default
      } else {
        result[s] = Math.round((subset.filter((a) => a.correct).length / subset.length) * 100);
      }
    }
    return result;
  };

  const handleAnswer = (idx: number) => {
    if (qa.feedback !== "idle") return;
    const q = PLACEMENT_QUESTIONS[qa.index];
    const correct = idx === q.correctIndex;
    setQa((s) => ({ ...s, feedback: correct ? "correct" : "wrong", selectedOption: idx }));
    if (correct) {
      // auto-advance after a beat
      setTimeout(() => {
        const newAnswers = [...qa.answers, { questionId: q.id, correct: true, skill: q.skill }];
        if (qa.index + 1 >= PLACEMENT_QUESTIONS.length) {
          finishQuiz(newAnswers);
        } else {
          setQa({ index: qa.index + 1, answers: newAnswers, feedback: "idle", selectedOption: null });
        }
      }, 700);
    }
  };

  const handleNextAfterWrong = () => {
    const q = PLACEMENT_QUESTIONS[qa.index];
    const newAnswers = [...qa.answers, { questionId: q.id, correct: false, skill: q.skill }];
    if (qa.index + 1 >= PLACEMENT_QUESTIONS.length) {
      finishQuiz(newAnswers);
    } else {
      setQa({ index: qa.index + 1, answers: newAnswers, feedback: "idle", selectedOption: null });
    }
  };

  const finishQuiz = (answers: QAState["answers"]) => {
    const scores = computeSkillScores(answers);
    setSkillBreakdown(scores);
    setStep(4);
    setTimeout(() => {
      const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
      const lvl = avg >= 85 ? "C1" : avg >= 70 ? "B2" : avg >= 55 ? "B1" : avg >= 35 ? "A2" : "A1";
      setPredictedLevel(lvl);
      setStep(5);
    }, 1800);
  };

  const handleSkipQuiz = () => {
    setSkipQuiz(true);
    const scores = { vocabulary: 40, grammar: 40, reading: 40, listening: 40 };
    setSkillBreakdown(scores);
    setStep(4);
    setTimeout(() => {
      setPredictedLevel("A2");
      setStep(5);
    }, 1500);
  };

  const [submitting, setSubmitting] = useState(false);
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitOnboarding({
        goals,
        industries,
        dailyMinutes,
        placement: skipQuiz
          ? null
          : { answers: qa.answers, skillScores: skillBreakdown },
      });
      if (result.ok) {
        window.location.assign("/");
      } else {
        setSubmitting(false);
        alert("Error: " + (result as { error?: string }).error);
      }
    } catch (e) {
      setSubmitting(false);
      alert("Lỗi: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
          <Logo size="sm" />
          <div className="flex-1">
            <Progress value={progress} />
          </div>
          <div className="text-xs text-stone-500 whitespace-nowrap">
            Bước {step + 1}/{totalSteps + 1}
          </div>
          {step === 3 && (
            <Button variant="ghost" size="sm" onClick={handleSkipQuiz}>
              Bỏ qua quiz
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          {step === 0 && <StepWelcome userName={userName} onNext={() => setStep(1)} />}
          {step === 1 && (
            <StepGoals
              selected={goals}
              onToggle={(v) => toggleArray(goals, v, setGoals)}
            />
          )}
          {step === 2 && (
            <StepProfession
              industries={industries}
              dailyMinutes={dailyMinutes}
              onToggleIndustry={(v) => toggleArray(industries, v, setIndustries)}
              onSetMinutes={setDailyMinutes}
            />
          )}
          {step === 3 && (
            <StepQuiz
              qa={qa}
              onAnswer={handleAnswer}
              onNextAfterWrong={handleNextAfterWrong}
            />
          )}
          {step === 4 && <StepProcessing />}
          {step === 5 && (
            <StepResult
              level={predictedLevel}
              skills={skillBreakdown}
              pending={submitting}
              onSubmit={handleFinalSubmit}
            />
          )}
        </div>
      </main>

      {/* Footer navigation (hidden on processing & result steps) */}
      {step >= 1 && step <= 2 && (
        <footer className="sticky bottom-0 bg-white border-t border-stone-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((step - 1) as Step)} disabled={step === 0}>
              <ArrowLeft className="size-4" /> Quay lại
            </Button>
            <Button
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canAdvance}
            >
              Tiếp tục <ArrowRight className="size-4" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}

// ----- Step components -----

function StepWelcome({ userName, onNext }: { userName: string; onNext: () => void }) {
  return (
    <div className="text-center py-12 animate-[slide-up_0.4s_ease-out]">
      <Logo size="lg" className="justify-center mb-8" />
      <h1 className="text-3xl font-bold mb-3">
        Xin chào {userName.split(" ")[0] || "bạn"} 👋
      </h1>
      <p className="text-lg text-stone-500 mb-2">Sẵn sàng bắt đầu hành trình tự tin nói tiếng Anh?</p>
      <p className="text-sm text-stone-400 mb-10">Chỉ cần 2 phút để AI hiểu bạn và thiết kế lộ trình riêng.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
        {[
          { icon: Sparkles, label: "Cá nhân hoá" },
          { icon: Brain, label: "AI feedback" },
          { icon: Clock, label: "5-30 phút" },
          { icon: BarChart3, label: "Theo dõi rõ ràng" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col items-center gap-2">
            <Icon className="size-5 text-brand-600" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onNext} className="px-10">
        Bắt đầu nào <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function StepGoals({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="animate-[slide-up_0.3s_ease-out]">
      <h2 className="text-2xl font-bold mb-1">Mục tiêu học của bạn là gì?</h2>
      <p className="text-stone-500 mb-6 text-sm">Có thể chọn nhiều — AI sẽ tùy chỉnh nội dung phù hợp.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GOALS.map((g) => {
          const active = selected.includes(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onToggle(g.id)}
              className={cn(
                "text-left rounded-xl border-2 p-4 transition flex items-start gap-3",
                active
                  ? "border-brand-500 bg-brand-50"
                  : "border-stone-200 bg-white hover:border-stone-300"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                  active ? "bg-brand-600 border-brand-600 text-white" : "border-stone-300 bg-white"
                )}
              >
                {active && <Check className="size-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{g.icon}</span>
                  <span className="font-semibold">{g.title}</span>
                </div>
                <p className="mt-1 text-xs text-stone-500">{g.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-stone-400">
        Đã chọn: <span className="font-medium text-brand-700">{selected.length} mục tiêu</span>
      </p>
    </div>
  );
}

function StepProfession({
  industries,
  dailyMinutes,
  onToggleIndustry,
  onSetMinutes,
}: {
  industries: string[];
  dailyMinutes: number;
  onToggleIndustry: (id: string) => void;
  onSetMinutes: (m: number) => void;
}) {
  return (
    <div className="animate-[slide-up_0.3s_ease-out] space-y-10">
      <div>
        <h2 className="text-2xl font-bold mb-1">Ngành nghề của bạn?</h2>
        <p className="text-stone-500 mb-6 text-sm">AI sẽ ưu tiên nội dung có ngữ cảnh phù hợp với công việc.</p>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
          {INDUSTRIES.map((g) => {
            const active = industries.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onToggleIndustry(g.id)}
                className={cn(
                  "text-left rounded-xl border-2 p-4 transition flex items-start gap-3",
                  active ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition",
                    active ? "bg-brand-600 border-brand-600 text-white" : "border-stone-300"
                  )}
                >
                  {active && <Check className="size-3.5 stroke-[3]" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{g.icon}</span>
                  <span className="font-semibold">{g.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-1">Thời gian học mỗi ngày</h2>
        <p className="text-stone-500 mb-4 text-sm">Càng đều càng tốt — không cần dài.</p>
        <div className="grid grid-cols-3 gap-3">
          {TIME_OPTIONS.map((t) => {
            const active = dailyMinutes === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSetMinutes(t.id)}
                className={cn(
                  "rounded-xl border-2 p-5 text-center transition",
                  active ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <Clock className={cn("size-5 mx-auto mb-2", active ? "text-brand-600" : "text-stone-400")} />
                <div className="font-bold text-lg">{t.label}</div>
                <div className="text-xs text-stone-500 mt-0.5">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepQuiz({
  qa,
  onAnswer,
  onNextAfterWrong,
}: {
  qa: QAState;
  onAnswer: (idx: number) => void;
  onNextAfterWrong: () => void;
}) {
  const q = PLACEMENT_QUESTIONS[qa.index];
  const totalDots = 5;
  const dotsState = Array.from({ length: totalDots }).map((_, i) => {
    const slot = qa.index - (qa.index % totalDots) + i;
    const ans = qa.answers[slot];
    if (slot === qa.index) return "active";
    if (slot < qa.index) return ans?.correct ? "correct" : "wrong";
    return "future";
  });

  return (
    <div className="animate-[slide-up_0.3s_ease-out]">
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
          ⏱ ~{Math.round(((PLACEMENT_QUESTIONS.length - qa.index) * 20) / 60)} phút còn lại
        </span>
        <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
          {qa.index + 1}/{PLACEMENT_QUESTIONS.length} câu
        </span>
        <span className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
          <Brain className="size-3" /> Adaptive AI
        </span>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">
            Câu {qa.index + 1} · {q.skill}
          </span>
          <span className="text-xs text-stone-400">{q.level}</span>
        </div>
        <p className="text-lg font-semibold leading-snug mb-6">{q.question}</p>
        <div className="space-y-2.5">
          {q.options.map((opt, idx) => {
            const isSelected = qa.selectedOption === idx;
            const isCorrect = idx === q.correctIndex;
            const showCorrect = qa.feedback !== "idle" && isCorrect && qa.feedback === "correct";
            const showWrong = qa.feedback === "wrong" && isSelected;
            return (
              <button
                key={idx}
                onClick={() => onAnswer(idx)}
                disabled={qa.feedback !== "idle"}
                className={cn(
                  "w-full text-left rounded-xl border-2 px-4 py-3 transition flex items-center gap-3",
                  showCorrect && "border-emerald-500 bg-emerald-50",
                  showWrong && "border-red-400 bg-red-50",
                  !showCorrect && !showWrong && "border-stone-200 bg-white hover:border-brand-300 hover:bg-brand-50/50",
                  qa.feedback !== "idle" && "cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "size-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0",
                    showCorrect && "border-emerald-500 bg-emerald-500 text-white",
                    showWrong && "border-red-400 bg-red-400 text-white",
                    !showCorrect && !showWrong && "border-stone-300 text-stone-500"
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {qa.feedback === "wrong" && (
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onNextAfterWrong}>
              Câu tiếp →
            </Button>
          </div>
        )}
      </div>

      {/* Dot indicators */}
      <div className="mt-6 flex justify-center gap-2">
        {dotsState.map((state, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              state === "active" && "w-6 bg-brand-600",
              state === "correct" && "w-1.5 bg-emerald-500",
              state === "wrong" && "w-1.5 bg-amber-500",
              state === "future" && "w-1.5 bg-stone-300"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function StepProcessing() {
  return (
    <div className="text-center py-20">
      <div className="size-16 mx-auto mb-6 rounded-full border-4 border-stone-200 border-t-brand-600 animate-spin" />
      <h2 className="text-xl font-bold mb-2">AI đang phân tích kết quả...</h2>
      <p className="text-sm text-stone-500">Đang xác định CEFR level và thiết kế lộ trình riêng cho bạn.</p>
    </div>
  );
}

function StepResult({
  level,
  skills,
  pending,
  onSubmit,
}: {
  level: keyof typeof LEVEL_INFO;
  skills: Record<string, number>;
  pending: boolean;
  onSubmit: () => void;
}) {
  const info = LEVEL_INFO[level];
  const weakest = Object.entries(skills).sort((a, b) => a[1] - b[1])[0];
  return (
    <div className="text-center animate-[slide-up_0.5s_ease-out]">
      <div className="inline-flex flex-col items-center gap-3 mb-6">
        <div className={cn("size-36 rounded-full flex flex-col items-center justify-center text-white shadow-lg animate-[pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)]", info.color)}>
          <span className="text-5xl font-bold leading-none">{level}</span>
          <span className="text-xs mt-1 opacity-90">{info.name}</span>
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-1">Trình độ của bạn: {level}</h2>
      <p className="text-stone-500 max-w-md mx-auto mb-2">{info.description}</p>
      {weakest && (
        <p className="text-sm text-amber-700 bg-amber-50 inline-flex px-3 py-1.5 rounded-full mb-8">
          🎯 Cần luyện thêm: <span className="font-medium ml-1">{SKILL_LABELS[weakest[0]]}</span>
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
        {Object.entries(skills).map(([skill, score]) => {
          const isWeakest = weakest && weakest[0] === skill;
          return (
            <div key={skill} className="rounded-xl border border-stone-200 bg-white p-4 text-left">
              <div className="text-xs text-stone-500 mb-1">{SKILL_LABELS[skill]}</div>
              <div className="text-2xl font-bold mb-2">{score}</div>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", isWeakest ? "bg-amber-500" : "bg-brand-500")}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button size="lg" onClick={onSubmit} disabled={pending} className="px-10">
        {pending && <Loader2 className="size-4 animate-spin" />} Bắt đầu học <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
