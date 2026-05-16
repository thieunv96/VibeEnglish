import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getLessonPreview,
  getInProgressAttempt,
  getLastCompletedAttempt,
  getLessonReviews,
  getLessonAttemptCount,
} from "@/lib/data";
import { TopNav } from "@/components/top-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LESSON_TYPES } from "@/lib/constants";
import {
  ArrowRight,
  Clock,
  Star,
  Play,
  CheckCircle2,
  BookOpen,
  Mic,
  Pencil,
  ListChecks,
  ArrowLeft,
  Users,
  Check,
} from "lucide-react";
import { formatDuration, cn } from "@/lib/utils";

export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const { id } = await params;
  const data = await getLessonPreview(id);
  if (!data) notFound();
  const { lesson, video, exercises, series, category } = data;

  const t = await getTranslations("lesson.preview");
  const tTypes = await getTranslations("lessonTypes");
  const tCat = await getTranslations("categoriesList");
  const locale = await getLocale();

  const [inProgress, lastCompleted, reviewsData, learnersCount] = await Promise.all([
    getInProgressAttempt(session.user.id, id),
    getLastCompletedAttempt(session.user.id, id),
    getLessonReviews(id),
    getLessonAttemptCount(id),
  ]);

  const typeMeta = LESSON_TYPES.find((tt) => tt.id === lesson.type) ?? LESSON_TYPES[0];
  const typeLabel = tTypes(typeMeta.id);
  const durationMin = Math.max(1, Math.round(lesson.durationSec / 60));

  const quizCount = exercises.filter((e) => e.kind === "quiz").length;
  const writingCount = exercises.filter((e) => e.kind === "writing").length;
  const speakingCount = exercises.filter((e) => e.kind === "speaking").length;

  const ctaText = lastCompleted ? t("ctaRetry") : inProgress ? t("ctaContinue") : t("ctaStart");
  const skillsList = t.raw("skillsDefault") as string[];

  const ratingAvg = reviewsData.avg ?? lesson.rating ?? null;
  const ratingCount = reviewsData.count;

  const tabs = [
    { id: "overview", label: t("tabs.overview") },
    { id: "modules", label: t("tabs.modules") },
    { id: "reviews", label: t("tabs.reviews") },
  ] as const;

  return (
    <div className="min-h-screen bg-white">
      <TopNav />

      {/* ============================ HERO HEADER ============================ */}
      <header className="border-b border-ink-200 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8 md:pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-5"
          >
            <ArrowLeft className="size-4" /> {t("back")}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-8 items-start">
            {/* Left col: meta + title + CTA */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="brand" className="text-xs">
                  <span className="mr-1">{typeMeta.icon}</span> {typeLabel}
                </Badge>
                {category && (
                  <Badge variant="outline" className="text-xs">
                    <span>{category.icon}</span> {tCat(category.slug)}
                  </Badge>
                )}
                {series && <Badge variant="outline" className="text-xs">{series.title}</Badge>}
                {lastCompleted && (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle2 className="size-3" /> {t("completedBadge")}
                  </Badge>
                )}
                {inProgress && !lastCompleted && (
                  <Badge variant="warning" className="text-xs">{t("inProgressBadge")}</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold leading-tight tracking-tight text-ink-900">
                {lesson.title}
              </h1>

              {lesson.description && (
                <p className="text-base text-ink-500 leading-relaxed max-w-2xl">
                  {lesson.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600">
                {ratingAvg != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-ink-900">{ratingAvg.toFixed(1)}</span>
                    <span className="text-ink-500">
                      ({t("ratingCount", { n: ratingCount })})
                    </span>
                  </span>
                )}
                {learnersCount > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4 text-ink-400" />
                    {t("learnersCount", { n: learnersCount })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-ink-400" />
                  {durationMin} {t("minutes")}
                </span>
                <span className="font-semibold text-ink-900">{lesson.level}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild size="lg" className="bg-brand-700 hover:bg-brand-800">
                  <Link href={`/lessons/${id}/study`}>
                    <Play className="size-4" /> {ctaText} <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {lastCompleted && (
                  <span className="text-sm text-ink-500">
                    {t("lastScore", { score: lastCompleted.score ?? "—" })}
                  </span>
                )}
                {inProgress && !lastCompleted && (
                  <span className="text-sm text-ink-500">
                    {t("startedAt", {
                      time: new Date(inProgress.startedAt).toLocaleString(
                        locale === "en" ? "en-US" : "vi-VN"
                      ),
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Right col: cover */}
            <div
              className={cn(
                "relative aspect-video rounded-md border border-ink-200 overflow-hidden flex items-center justify-center text-7xl lg:text-8xl",
                typeMeta.color
              )}
            >
              <span>{typeMeta.icon}</span>
              {video?.youtubeId && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Link
                    href={`/lessons/${id}/study`}
                    className="size-16 rounded-full bg-white/95 backdrop-blur flex items-center justify-center hover:scale-105 transition shadow-xl"
                    title={t("ctaStart")}
                  >
                    <Play className="size-7 fill-ink-900 text-ink-900 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============================ TAB NAV ============================ */}
      <nav className="sticky top-16 z-20 bg-white border-b border-ink-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto">
          {tabs.map((tab, idx) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className={cn(
                "py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors",
                idx === 0
                  ? "border-brand-700 text-ink-900"
                  : "border-transparent text-ink-500 hover:text-ink-900"
              )}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        {/* ============================ OVERVIEW ============================ */}
        <section id="overview" className="scroll-mt-32 space-y-8">
          {/* About */}
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-900 mb-3">
              <BookOpen className="size-5 text-brand-700" /> {t("aboutTitle")}
            </h2>
            <p className="text-ink-600 leading-relaxed max-w-3xl">
              {lesson.description || t("aboutDefault")}
            </p>
          </div>

          {/* What you'll learn — Coursera-style bullet card */}
          <div className="rounded-md border border-ink-200 bg-ink-50 p-6">
            <h2 className="text-xl font-bold tracking-tight text-ink-900 mb-4">
              {t("skillsTitle")}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {skillsList.map((skill) => (
                <li key={skill} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <Check className="size-4 text-brand-700 shrink-0 mt-0.5" />
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================ MODULES ============================ */}
        <section id="modules" className="scroll-mt-32">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900 mb-4">
            {t("modulesTitle")}
          </h2>
          <Accordion type="multiple" defaultValue={["m-video", "m-quiz"]} className="rounded-md border border-ink-200 bg-white divide-y divide-ink-200">
            {video && (
              <ModuleItem
                value="m-video"
                icon={<Play className="size-5" />}
                title={t("moduleVideo")}
                desc={t("moduleVideoDesc", { duration: formatDuration(video.durationSec) })}
              />
            )}
            {quizCount > 0 && (
              <ModuleItem
                value="m-quiz"
                icon={<ListChecks className="size-5" />}
                title={t("moduleQuiz")}
                desc={t("moduleQuizDesc", { n: quizCount })}
              />
            )}
            {writingCount > 0 && (
              <ModuleItem
                value="m-writing"
                icon={<Pencil className="size-5" />}
                title={t("moduleWriting")}
                desc={t("moduleWritingDesc", { n: writingCount })}
              />
            )}
            {speakingCount > 0 && (
              <ModuleItem
                value="m-speaking"
                icon={<Mic className="size-5" />}
                title={t("moduleSpeaking")}
                desc={t("moduleSpeakingDesc", { n: speakingCount })}
              />
            )}
            {exercises.length === 0 && !video && (
              <p className="px-5 py-6 text-sm text-ink-500 text-center">{t("modulesEmpty")}</p>
            )}
          </Accordion>
        </section>

        {/* ============================ REVIEWS ============================ */}
        <section id="reviews" className="scroll-mt-32">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-ink-900">{t("reviewsTitle")}</h2>
            {ratingAvg != null && ratingCount > 0 && (
              <span className="text-sm text-ink-500">
                {t("reviewsAvg", { avg: ratingAvg.toFixed(1), n: ratingCount })}
              </span>
            )}
          </div>
          {reviewsData.reviews.length === 0 ? (
            <p className="rounded-md border border-dashed border-ink-300 bg-ink-50 px-5 py-8 text-center text-sm text-ink-500">
              {t("reviewsEmpty")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviewsData.reviews.map((r) => {
                const name = r.userName ?? t("anonymousLearner");
                const initials = name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <article
                    key={r.attemptId}
                    className="rounded-md border border-ink-200 bg-white p-4 flex gap-3"
                  >
                    <Avatar className="size-10 shrink-0">
                      {r.avatarData && <AvatarImage src={r.avatarData} alt={name} />}
                      <AvatarFallback className="bg-ink-100 text-ink-600 text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-ink-900 truncate">{name}</div>
                        <div className="flex items-center gap-0.5" aria-label={`${r.rating} sao`}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "size-3.5",
                                (r.rating ?? 0) >= s
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-ink-300"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      {r.completedAt && (
                        <div className="text-xs text-ink-400 mt-0.5">
                          {new Date(r.completedAt).toLocaleDateString(
                            locale === "en" ? "en-US" : "vi-VN"
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ============================ FAQ ============================ */}
        <section className="scroll-mt-32">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900 mb-4">{t("faqTitle")}</h2>
          <Accordion type="single" collapsible className="rounded-md border border-ink-200 bg-white divide-y divide-ink-200">
            <AccordionItem value="q1" className="border-b-0 px-5">
              <AccordionTrigger className="py-4 text-base font-semibold text-ink-900 hover:no-underline">
                {t("faqQ1")}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-ink-600 leading-relaxed pb-4">
                {t("faqA1", { duration: durationMin })}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2" className="border-b-0 px-5">
              <AccordionTrigger className="py-4 text-base font-semibold text-ink-900 hover:no-underline">
                {t("faqQ2")}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-ink-600 leading-relaxed pb-4">
                {t("faqA2")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3" className="border-b-0 px-5">
              <AccordionTrigger className="py-4 text-base font-semibold text-ink-900 hover:no-underline">
                {t("faqQ3")}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-ink-600 leading-relaxed pb-4">
                {t("faqA3", { level: lesson.level })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* ============================ FOOTER CTA ============================ */}
        <section className="rounded-md border border-ink-200 bg-brand-50 px-6 py-8 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink-900">{t("readyTitle")}</h3>
            <p className="text-sm text-ink-500 mt-0.5">
              {typeLabel} · {lesson.level} · {durationMin} {t("minutes")}
            </p>
          </div>
          <Button asChild size="lg" className="bg-brand-700 hover:bg-brand-800 shrink-0">
            <Link href={`/lessons/${id}/study`}>
              <Play className="size-4" /> {ctaText} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}

function ModuleItem({
  value,
  icon,
  title,
  desc,
}: {
  value: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <AccordionItem value={value} className="border-b-0 px-5">
      <AccordionTrigger className="py-4 hover:no-underline">
        <span className="flex items-center gap-3 text-left">
          <span className="size-9 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
            {icon}
          </span>
          <span className="font-semibold text-ink-900">{title}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="text-sm text-ink-600 leading-relaxed pb-4 pl-12">
        {desc}
      </AccordionContent>
    </AccordionItem>
  );
}
