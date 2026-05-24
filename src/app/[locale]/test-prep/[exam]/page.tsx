import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { CefrBadge } from "@/components/CefrBadge";
import { Link } from "@/i18n/navigation";
import { getLessons } from "@/lib/content";

const EXAMS = ["toeic", "toefl", "ielts", "oet"] as const;
type Exam = (typeof EXAMS)[number];

const examToCategory: Record<Exam, "toeic-listening" | "toefl-listening" | "ielts-listening" | "medical-english-oet"> = {
  toeic: "toeic-listening",
  toefl: "toefl-listening",
  ielts: "ielts-listening",
  oet: "medical-english-oet",
};

const blurbs: Record<Exam, string> = {
  toeic: "Business communication — emails, meetings, conversations, short talks.",
  toefl: "Academic English — campus dialogues, lectures, and integrated tasks.",
  ielts: "General and academic listening sections plus exam strategy.",
  oet: "Healthcare English for doctors, nurses and medical professionals.",
};

export default async function TestPrepPage({
  params,
}: {
  params: Promise<{ locale: string; exam: string }>;
}) {
  const { locale, exam } = await params;
  setRequestLocale(locale);
  if (!(EXAMS as readonly string[]).includes(exam)) notFound();

  const tExam = await getTranslations("exams");
  const tL = await getTranslations("lessons");
  const cat = examToCategory[exam as Exam];
  const lessons = getLessons(cat);

  return (
    <Container size="wide" className="py-12">
      <header className="mb-8">
        <span className="inline-block rounded-full bg-brand-soft text-brand-strong text-xs font-semibold px-3 py-1 mb-3">
          Test Preparation
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="page-title">
          {tExam(exam as "toeic")} Listening Prep
        </h1>
        <p className="mt-3 text-muted max-w-2xl">{blurbs[exam as Exam]}</p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Lesson</th>
              <th className="px-4 py-3">Segments</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border" data-testid="exam-lesson-list">
            {lessons.map((l) => (
              <tr key={l.slug}>
                <td className="px-4 py-3"><CefrBadge level={l.level} /></td>
                <td className="px-4 py-3 font-medium">{l.title}</td>
                <td className="px-4 py-3 text-muted">{l.segments.length}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/lessons/${cat}/${l.slug}`}
                    className="inline-flex rounded-md bg-brand hover:bg-brand-strong text-white text-xs font-semibold px-3 py-1.5"
                  >
                    {tL("startBtn")}
                  </Link>
                </td>
              </tr>
            ))}
            {lessons.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No lessons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
