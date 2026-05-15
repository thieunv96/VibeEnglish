"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Star, Clock, Hash, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LESSON_TYPES } from "@/lib/constants";
import { VideoPlayer } from "./video-player";
import { TranscriptPanel } from "./transcript-panel";
import { QuizTab } from "./quiz-tab";
import { WritingTab } from "./writing-tab";
import { SpeakingTab } from "./speaking-tab";
import type { Lesson, Video, TranscriptSegment, Exercise, QuizQuestion, Series } from "@/db/schema";
import { completeLessonAction } from "./actions";

export type LessonData = {
  lesson: Lesson;
  video: Video | null;
  segments: TranscriptSegment[];
  exercises: Exercise[];
  questions: QuizQuestion[];
  series: Series | null;
};

export function LessonView({ data, next }: { data: LessonData; next: Lesson | null }) {
  const { lesson, video, segments, exercises, questions, series } = data;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mediaCompleted, setMediaCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<"quiz" | "writing" | "speaking">("quiz");
  const router = useRouter();

  const hasQuiz = exercises.some((e) => e.kind === "quiz");
  const hasWriting = exercises.some((e) => e.kind === "writing");
  const hasSpeaking = exercises.some((e) => e.kind === "speaking");
  const writingEx = exercises.find((e) => e.kind === "writing");
  const speakingEx = exercises.find((e) => e.kind === "speaking");
  const quizEx = exercises.find((e) => e.kind === "quiz");
  const quizQuestions = quizEx ? questions.filter((q) => q.exerciseId === quizEx.id) : [];

  const typeMeta = LESSON_TYPES.find((t) => t.id === lesson.type)!;

  // Lessons that require media-watch before unlocking exercises.
  const requiresMedia = lesson.type === "video_quiz" || lesson.type === "audio_quiz";
  const exercisesLocked = requiresMedia && !mediaCompleted;

  // Auto-mark media completed when ≥ 90% watched
  useEffect(() => {
    if (!requiresMedia || mediaCompleted || duration <= 0) return;
    if (currentTime / duration >= 0.9) setMediaCompleted(true);
  }, [currentTime, duration, requiresMedia, mediaCompleted]);

  const [completed, setCompleted] = useState<{ quiz: boolean; writing: boolean; speaking: boolean }>({
    quiz: !hasQuiz,
    writing: !hasWriting,
    speaking: !hasSpeaking,
  });
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasQuiz) setActiveTab("quiz");
    else if (hasWriting) setActiveTab("writing");
    else if (hasSpeaking) setActiveTab("speaking");
  }, [hasQuiz, hasWriting, hasSpeaking]);

  const allDone = completed.quiz && completed.writing && completed.speaking;

  const handleComplete = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const r = await completeLessonAction({
      lessonId: lesson.id,
      score: quizScore ?? undefined,
    });
    if (r.ok) {
      router.push(`/lessons/${lesson.id}/result?attempt=${r.attemptId}`);
    } else {
      setSubmitting(false);
      setSubmitError(r.error ?? "Không thể nộp bài. Thử lại sau.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Lesson sub-header — not sticky (TopNav is the only sticky chrome) */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-4">
          <Link
            href={`/lessons/${lesson.id}`}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Quay lại preview</span>
          </Link>
          <h1 className="flex-1 text-center truncate font-semibold text-sm sm:text-base">
            {lesson.title}
          </h1>
          {series && lesson.orderInSeries != null && (
            <div className="hidden md:flex items-center gap-2 text-xs text-stone-500">
              <span>Bài {lesson.orderInSeries}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full ${
                      i === lesson.orderInSeries
                        ? "bg-brand-600 w-4"
                        : i < (lesson.orderInSeries ?? 0)
                        ? "bg-emerald-500"
                        : "bg-stone-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Left panel */}
        <div className="space-y-5 min-w-0">
          {video ? (
            <VideoPlayer
              videoId={video.youtubeId ?? ""}
              title={video.title}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
            />
          ) : (
            <div className="rounded-xl bg-black aspect-video flex items-center justify-center text-white/60">
              {typeMeta.icon} <span className="ml-2 text-sm">Bài học không có video</span>
            </div>
          )}

          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="brand">{typeMeta.label}</Badge>
              <Badge variant="outline">{lesson.level}</Badge>
              {series && <Badge variant="info">{series.title}</Badge>}
            </div>
            <h2 className="text-xl font-bold leading-tight">{lesson.title}</h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-stone-500">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {Math.round(lesson.durationSec / 60)} phút
              </span>
              <span className="flex items-center gap-1">
                <Hash className="size-3.5" /> {exercises.length} bài tập
              </span>
              {lesson.rating != null && (
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" /> {lesson.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {video && segments.length > 0 && (
            <TranscriptPanel segments={segments} currentTime={currentTime} />
          )}

          {/* Manual "Đã xem xong" override for media lessons */}
          {requiresMedia && !mediaCompleted && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center justify-between gap-3">
              <span className="text-xs text-amber-800">
                ▶ Xem hết{" "}
                <span className="font-medium">
                  {lesson.type === "audio_quiz" ? "audio" : "video"}
                </span>{" "}
                để mở khoá bài tập (hoặc bấm "Đã xem xong").
              </span>
              <button
                onClick={() => setMediaCompleted(true)}
                className="text-xs font-medium rounded-md bg-amber-600 text-white px-2.5 py-1 hover:bg-amber-700"
              >
                Đã xem xong
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="lg:sticky lg:top-20 lg:self-start space-y-3 min-w-0">
          <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
            {exercisesLocked ? (
              <div className="py-10 text-center">
                <div className="inline-flex size-12 rounded-full bg-stone-100 text-stone-400 items-center justify-center mb-3">
                  <Lock className="size-5" />
                </div>
                <p className="text-sm font-medium text-stone-700">
                  Bài tập sẽ mở sau khi bạn xem xong {lesson.type === "audio_quiz" ? "audio" : "video"}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Tiến độ: {duration > 0 ? Math.round((currentTime / duration) * 100) : 0}% / 90%
                </p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="w-full justify-start">
                  {hasQuiz && <TabsTrigger value="quiz">Quiz</TabsTrigger>}
                  {hasWriting && <TabsTrigger value="writing">Writing</TabsTrigger>}
                  {hasSpeaking && <TabsTrigger value="speaking">Speaking</TabsTrigger>}
                </TabsList>
                {hasQuiz && (
                  <TabsContent value="quiz">
                    <QuizTab
                      questions={quizQuestions}
                      onDone={(score) => {
                        setCompleted((c) => ({ ...c, quiz: true }));
                        if (typeof score === "number") setQuizScore(score);
                      }}
                    />
                  </TabsContent>
                )}
                {hasWriting && writingEx && (
                  <TabsContent value="writing">
                    <WritingTab
                      exercise={writingEx}
                      level={lesson.level}
                      onDone={() => setCompleted((c) => ({ ...c, writing: true }))}
                    />
                  </TabsContent>
                )}
                {hasSpeaking && speakingEx && (
                  <TabsContent value="speaking">
                    <SpeakingTab
                      exercise={speakingEx}
                      onDone={() => setCompleted((c) => ({ ...c, speaking: true }))}
                    />
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 mr-3">
              <div className="text-[11px] uppercase text-stone-400 tracking-wide">
                {next ? "Bài tiếp theo" : "Bài cuối series"}
              </div>
              <div className="text-sm font-medium truncate">{next?.title ?? "—"}</div>
            </div>
            <button
              onClick={handleComplete}
              disabled={!allDone || submitting}
              className="rounded-lg bg-brand-600 disabled:bg-stone-300 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition flex items-center gap-1.5 shrink-0"
            >
              {submitting ? "Đang nộp..." : allDone ? "Hoàn thành" : "Cần làm xong bài tập"} <ArrowRight className="size-4" />
            </button>
          </div>
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              ❌ {submitError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
