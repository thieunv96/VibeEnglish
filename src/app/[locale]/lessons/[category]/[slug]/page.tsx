import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { CefrBadge } from "@/components/CefrBadge";
import { DictationPlayer } from "@/components/DictationPlayer";
import { SaveWordButton } from "@/components/SaveWordButton";
import { Link } from "@/i18n/navigation";
import { getLesson, isCategory } from "@/lib/content";

interface PageProps {
  params: Promise<{ locale: string; category: string; slug: string }>;
}

export default async function LessonDetailPage({ params }: PageProps) {
  const { locale, category, slug } = await params;
  setRequestLocale(locale);
  if (!isCategory(category)) notFound();

  const lesson = getLesson(category, slug);
  if (!lesson) notFound();

  const tCat = await getTranslations("categories");
  const tL = await getTranslations("lesson");

  // Pull a few "interesting" words from transcript for save buttons (length > 5, dedup, first 6).
  const interestingWords = Array.from(
    new Set(
      lesson.transcript
        .split(/\s+/)
        .map((w) => w.replace(/[^A-Za-z']/g, ""))
        .filter((w) => w.length > 5),
    ),
  ).slice(0, 6);

  return (
    <Container className="py-10" size="default">
      <nav className="text-sm text-muted mb-3">
        <Link href="/lessons" className="hover:text-brand">Lessons</Link>
        {" › "}
        <Link href={`/lessons/${category}`} className="hover:text-brand">{tCat(category)}</Link>
        {" › "}
        <span>{lesson.title}</span>
      </nav>

      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="lesson-title">{lesson.title}</h1>
          {lesson.description && (
            <p className="mt-2 text-muted">{lesson.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <CefrBadge level={lesson.level} />
          <span className="text-sm text-muted">{lesson.segments.length} segments</span>
        </div>
      </header>

      <DictationPlayer
        lesson={lesson}
        labels={{
          play: tL("play"),
          stop: tL("stop"),
          speed: tL("speed"),
          submit: tL("submit"),
          showAnswer: tL("showAnswer"),
          hideAnswer: tL("hideAnswer"),
          nextSegment: tL("nextSegment"),
          saveWord: tL("saveWord"),
          transcript: tL("transcript"),
          segments: tL("segments"),
          yourInput: tL("yourInput"),
          accuracy: tL("accuracy"),
          loginToSave: tL("loginToSave"),
        }}
      />

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">{tL("transcript")}</h2>
        <div className="rounded-xl border border-border bg-white p-5 text-base leading-relaxed">
          {lesson.transcript}
        </div>
      </section>

      {interestingWords.length > 0 && (
        <section className="mt-6">
          <h3 className="text-base font-semibold mb-3">Vocabulary from this lesson</h3>
          <div className="flex flex-wrap gap-2" data-testid="vocab-suggestions">
            {interestingWords.map((w) => (
              <SaveWordButton key={w} word={w.toLowerCase()} sourceLessonSlug={lesson.slug} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
