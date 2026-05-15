import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  getLessonPreview,
  getInProgressAttempt,
  getLastCompletedAttempt,
} from "@/lib/data";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LESSON_TYPES } from "@/lib/constants";
import {
  ArrowRight,
  Clock,
  Hash,
  Star,
  Play,
  CheckCircle2,
  BookOpen,
  Mic,
  Pencil,
  ListChecks,
  ArrowLeft,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const { id } = await params;
  const data = await getLessonPreview(id);
  if (!data) notFound();
  const { lesson, video, exercises, series, category } = data;

  const [inProgress, lastCompleted] = await Promise.all([
    getInProgressAttempt(session.user.id, id),
    getLastCompletedAttempt(session.user.id, id),
  ]);

  const typeMeta = LESSON_TYPES.find((t) => t.id === lesson.type) ?? LESSON_TYPES[0];
  const durationMin = Math.max(1, Math.round(lesson.durationSec / 60));

  const exerciseSummary = [
    { kind: "quiz" as const, icon: ListChecks, label: "Quiz", count: exercises.filter((e) => e.kind === "quiz").length },
    { kind: "writing" as const, icon: Pencil, label: "Writing", count: exercises.filter((e) => e.kind === "writing").length },
    { kind: "speaking" as const, icon: Mic, label: "Speaking", count: exercises.filter((e) => e.kind === "speaking").length },
  ].filter((e) => e.count > 0);

  const ctaText = lastCompleted ? "Học lại" : inProgress ? "Tiếp tục học" : "Bắt đầu học";

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-4">
          <ArrowLeft className="size-4" /> Quay lại thư viện
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Left — main info */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="brand">
                  <span className="mr-1">{typeMeta.icon}</span> {typeMeta.label}
                </Badge>
                <Badge variant="outline">{lesson.level}</Badge>
                {category && (
                  <Badge variant="info">
                    <span>{category.icon}</span> {category.title}
                  </Badge>
                )}
                {series && <Badge variant="info">{series.title}</Badge>}
                {lastCompleted && (
                  <Badge variant="success">
                    <CheckCircle2 className="size-3" /> Đã hoàn thành
                  </Badge>
                )}
                {inProgress && !lastCompleted && <Badge variant="warning">Đang học</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-900">{lesson.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-stone-500">
                <span className="flex items-center gap-1">
                  <Clock className="size-4" /> {durationMin} phút
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="size-4" /> {exercises.length} bài tập
                </span>
                {lesson.rating != null && (
                  <span className="flex items-center gap-1">
                    <Star className="size-4 fill-amber-400 text-amber-400" /> {lesson.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Video thumbnail / type illustration */}
            <div
              className={`relative aspect-video rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center text-7xl ${typeMeta.color}`}
            >
              <span>{typeMeta.icon}</span>
              {video?.youtubeId && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Link
                    href={`/lessons/${id}/study`}
                    className="size-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:scale-105 transition shadow-xl"
                    title="Bắt đầu học"
                  >
                    <Play className="size-7 fill-stone-900 text-stone-900 ml-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* Description */}
            <section>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <BookOpen className="size-4 text-brand-600" /> Về bài học này
              </h2>
              <p className="text-stone-700 leading-relaxed">
                {lesson.description ||
                  "Bài học này giúp bạn luyện tập với nội dung thực tế. AI sẽ chấm điểm, đưa ra feedback chi tiết, và điều chỉnh lộ trình theo tiến độ học của bạn."}
              </p>
            </section>

            {/* What you'll do */}
            <section>
              <h2 className="text-lg font-bold mb-3">Bạn sẽ luyện</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {exerciseSummary.map((e) => {
                  const Icon = e.icon;
                  return (
                    <div key={e.kind} className="rounded-xl border border-stone-200 bg-white p-4">
                      <Icon className="size-5 text-brand-600 mb-2" />
                      <div className="font-semibold text-sm">{e.label}</div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {e.count} bài tập {e.kind === "quiz" ? "trắc nghiệm" : e.kind === "writing" ? "viết" : "nói"}
                      </div>
                    </div>
                  );
                })}
                {video && (
                  <div className="rounded-xl border border-stone-200 bg-white p-4">
                    <Play className="size-5 text-brand-600 mb-2" />
                    <div className="font-semibold text-sm">Video</div>
                    <div className="text-xs text-stone-500 mt-0.5">{formatDuration(video.durationSec)} với transcript song ngữ</div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right — CTA card */}
          <aside className="lg:sticky lg:top-20 lg:self-start space-y-3">
            <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
              <div>
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
                  {lastCompleted ? "Bạn đã hoàn thành" : inProgress ? "Bạn đang học" : "Sẵn sàng bắt đầu?"}
                </div>
                {lastCompleted && (
                  <div className="text-sm text-stone-700">
                    Điểm gần nhất:{" "}
                    <span className="font-bold text-emerald-600">{lastCompleted.score ?? "—"}</span>
                  </div>
                )}
                {inProgress && !lastCompleted && (
                  <div className="text-sm text-stone-700">
                    Bắt đầu lúc {new Date(inProgress.startedAt).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href={`/lessons/${id}/study`}>
                  <Play className="size-4" /> {ctaText} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <div className="space-y-1.5 text-xs text-stone-500 pt-2 border-t border-stone-100">
                <div className="flex justify-between">
                  <span>Loại</span>
                  <span className="font-medium text-stone-700">{typeMeta.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trình độ</span>
                  <span className="font-medium text-stone-700">{lesson.level}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời lượng</span>
                  <span className="font-medium text-stone-700">{durationMin} phút</span>
                </div>
                <div className="flex justify-between">
                  <span>Bài tập</span>
                  <span className="font-medium text-stone-700">{exercises.length}</span>
                </div>
                {category && (
                  <div className="flex justify-between">
                    <span>Chủ đề</span>
                    <span className="font-medium text-stone-700">
                      {category.icon} {category.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
