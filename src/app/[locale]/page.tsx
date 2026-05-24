import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/Container";
import { Section, SectionHead, Kicker } from "@/components/Section";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { categoryStats, skillStats, lessonCategories, skills } from "@/lib/content";

const categoryEmojis: Record<string, string> = {
  "short-stories": "📖",
  conversations: "💬",
  "ted-ed": "🎓",
  "youtube-random": "▶️",
  "toeic-listening": "📰",
  "toefl-listening": "🎙️",
  "ielts-listening": "🎬",
  "medical-english-oet": "🩺",
  "stories-for-kids": "🧸",
};

const skillEmojis: Record<string, string> = {
  grammar: "📝",
  vocabulary: "🔤",
  listening: "👂",
  reading: "📚",
  speaking: "🎤",
  writing: "✍️",
  "word-skills": "🧩",
  business: "💼",
};

const cefrRows: Array<{ level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"; stage: string; can: string; ex: string }> = [
  { level: "A1", stage: "Beginner", can: "Understand familiar everyday expressions and basic phrases.", ex: "“My name is Anna. I live in Madrid.”" },
  { level: "A2", stage: "Elementary", can: "Communicate in simple, routine tasks on familiar topics.", ex: "“I went to the supermarket yesterday.”" },
  { level: "B1", stage: "Intermediate", can: "Deal with most situations while travelling in English-speaking areas.", ex: "“If the weather is good, we'll hike on Saturday.”" },
  { level: "B2", stage: "Upper-Intermediate", can: "Interact with fluency and spontaneity with native speakers.", ex: "“Although the report was thorough, it missed the main issue.”" },
  { level: "C1", stage: "Advanced", can: "Use English flexibly for social, academic and professional purposes.", ex: "“The findings suggest a notable shift in consumer behaviour.”" },
  { level: "C2", stage: "Proficient", can: "Understand virtually everything heard or read with ease.", ex: "“He delivered the keynote with the wry humour of a seasoned satirist.”" },
];

const levelColor: Record<string, string> = {
  A1: "bg-emerald-100 text-emerald-800",
  A2: "bg-teal-100 text-teal-800",
  B1: "bg-sky-100 text-sky-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-violet-100 text-violet-800",
  C2: "bg-fuchsia-100 text-fuchsia-800",
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tCat = await getTranslations("categories");
  const tCatDesc = await getTranslations("categoriesDesc");
  const tSkill = await getTranslations("skills");
  const tSkillDesc = await getTranslations("skillsDesc");
  const tExam = await getTranslations("exams");
  const tLessons = await getTranslations("lessons");

  const catCounts = Object.fromEntries(categoryStats().map((c) => [c.slug, c.count]));
  const skillCounts = Object.fromEntries(skillStats().map((s) => [s.slug, s.count]));

  const faqItems: FaqItem[] = [
    { q: "Is VibeEnglish really 100% free?", a: "Yes — every lesson, every exercise, every feature. No paywalls, no premium tier, no trial that expires." },
    { q: "Do I need to register or create an account?", a: "No. You can start any lesson immediately. An optional account lets you save progress and vocabulary across devices." },
    { q: "What levels does VibeEnglish cover?", a: "All of them — A1 (beginner) through C2 (proficient). Every lesson is tagged by CEFR level." },
    { q: "Can I prepare for TOEIC, TOEFL, IELTS or OET here?", a: "Yes. We have dedicated tracks for all four major exams, with content designed around real test formats." },
    { q: "Does dictation practice actually work?", a: "It's one of the most effective listening techniques. Dictation forces active focus on every sound." },
    { q: "What makes VibeEnglish different from other learning apps?", a: "VibeEnglish is built around real, varied listening content with full transcripts and interactive dictation." },
    { q: "How do I get started?", a: "Click \"Start Lessons Free.\" Pick a level. Choose a category. Press play. That's it." },
    { q: "How can I improve my listening fastest?", a: "Practice every day, even just 15 minutes. Use dictation, not just passive listening." },
    { q: "Does it work on my phone?", a: "Yes. VibeEnglish runs in any modern browser — phone, tablet, laptop, or desktop." },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-soft/50 via-white to-white">
        <Container size="wide" className="py-20 sm:py-28 text-center">
          <span className="inline-block rounded-full bg-brand-soft text-brand-strong text-xs font-semibold px-3 py-1 mb-6">
            {t("eyebrow")}
          </span>
          <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground" data-testid="hero-title">
            From Struggling Listener to{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Confident English Speaker
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">{t("sub")}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center" data-testid="hero-ctas">
            <Link
              href="/lessons"
              className="inline-flex items-center justify-center rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-6 py-3 text-base shadow-sm transition-colors"
            >
              {t("ctaStart")}
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center justify-center rounded-md border-2 border-brand text-brand hover:bg-brand-soft font-semibold px-6 py-3 text-base transition-colors"
            >
              {t("ctaPractice")}
            </Link>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
            {t("trust")}
          </div>
        </Container>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-white">
        <Container size="wide">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-border" data-testid="stats">
            {[
              { num: "1,745+", lbl: t("statsLessons") },
              { num: "836+", lbl: t("statsExercises") },
              { num: "9", lbl: t("statsCategories") },
              { num: "100%", lbl: t("statsFree") },
              { num: "A1–C2", lbl: t("statsLevels") },
            ].map((s, i) => (
              <div key={i} className="px-4 py-6 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-brand">{s.num}</div>
                <div className="mt-1 text-xs sm:text-sm text-muted">{s.lbl}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ABOUT */}
      <Section>
        <Container size="narrow" className="text-center">
          <Kicker>{t("aboutKicker")}</Kicker>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("aboutTitle")}</h2>
          <p className="mt-4 text-lg text-muted">{t("aboutBody")}</p>
        </Container>
      </Section>

      {/* HOW IT WORKS */}
      <Section alt>
        <Container size="wide">
          <SectionHead kicker={t("howKicker")} title={t("howTitle")} />
          <ol className="grid gap-6 md:grid-cols-4" data-testid="steps">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="relative rounded-2xl border border-border bg-white p-6 shadow-sm">
                <div className="absolute -top-3 -left-3 grid h-10 w-10 place-items-center rounded-full bg-brand text-white font-bold shadow">
                  {n}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{t(`step${n}Title` as "step1Title")}</h3>
                <p className="mt-2 text-sm text-muted">{t(`step${n}Body` as "step1Body")}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* WHY LISTENING */}
      <Section>
        <Container size="wide">
          <SectionHead kicker={t("whyKicker")} title={t("whyTitle")} sub={t("whySub")} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { ico: "🎧", n: 1 },
              { ico: "🗣️", n: 2 },
              { ico: "⚡", n: 3 },
              { ico: "🌍", n: 4 },
            ].map(({ ico, n }) => (
              <div key={n} className="rounded-xl border border-border bg-white p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-2xl mb-4">
                  {ico}
                </div>
                <h3 className="text-lg font-semibold">{t(`benefit${n}Title` as "benefit1Title")}</h3>
                <p className="mt-2 text-sm text-muted">{t(`benefit${n}Body` as "benefit1Body")}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* LESSON CATEGORIES */}
      <Section alt id="lessons-section">
        <Container size="wide">
          <SectionHead
            kicker={t("lessonsKicker")}
            title={t("lessonsTitle")}
            align="left"
            action={
              <Link
                href="/lessons"
                className="text-brand font-semibold text-sm hover:text-brand-strong"
              >
                {t("viewAllCategories")} →
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="categories">
            {lessonCategories.map((cat) => (
              <Link
                key={cat}
                href={`/lessons/${cat}`}
                className="group rounded-xl border border-border bg-white p-5 hover:border-brand hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{categoryEmojis[cat]}</div>
                <h3 className="font-semibold text-foreground group-hover:text-brand">
                  {tCat(cat as "short-stories")}
                </h3>
                <p className="mt-1 text-sm text-muted">{tCatDesc(cat as "short-stories")}</p>
                <div className="mt-3 text-xs font-semibold text-brand">
                  {catCounts[cat] ?? 0} {tLessons("lessonsLabel")}
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* PRACTICE SKILLS */}
      <Section>
        <Container size="wide">
          <SectionHead
            kicker={t("practiceKicker")}
            title={t("practiceTitle")}
            align="left"
            action={
              <Link href="/practice" className="text-brand font-semibold text-sm hover:text-brand-strong">
                {t("exploreExercises")} →
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="skills">
            {skills.map((sk) => (
              <Link
                key={sk}
                href={`/practice/${sk}`}
                className="group rounded-xl border border-border bg-white p-5 hover:border-brand hover:shadow-md transition-all text-center"
              >
                <div className="text-3xl mb-2">{skillEmojis[sk]}</div>
                <h3 className="font-semibold group-hover:text-brand">{tSkill(sk as "grammar")}</h3>
                <p className="mt-2 text-xs text-muted">{tSkillDesc(sk as "grammar")}</p>
                <div className="mt-2 text-xs font-semibold text-brand">{skillCounts[sk] ?? 0} exercises</div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* CEFR TABLE */}
      <Section alt>
        <Container size="wide">
          <SectionHead kicker={t("cefrKicker")} title={t("cefrTitle")} />
          <div className="overflow-x-auto rounded-xl border border-border bg-white" data-testid="cefr-table">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-foreground">
                <tr>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">What you can do</th>
                  <th className="px-4 py-3 hidden md:table-cell">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cefrRows.map((r) => (
                  <tr key={r.level}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ${levelColor[r.level]}`}>
                        {r.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.stage}</td>
                    <td className="px-4 py-3 text-muted">{r.can}</td>
                    <td className="px-4 py-3 italic text-muted hidden md:table-cell">{r.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* FEATURES */}
      <Section>
        <Container size="wide">
          <SectionHead kicker={t("featuresKicker")} title={t("featuresTitle")} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="features">
            {[
              { ico: "🔊", h: "Native speaker audio", b: "Every lesson uses authentic native voices." },
              { ico: "⌨️", h: "Interactive dictation", b: "Type what you hear with real-time feedback." },
              { ico: "📄", h: "Full transcripts", b: "Read along and save vocabulary as you go." },
              { ico: "🧠", h: "Skill exercises", b: "Grammar, gap-fills, MCQs, matching — graded by level." },
              { ico: "🎯", h: "CEFR-aligned", b: "Every lesson is tagged A1–C2 so you always practice at the right difficulty." },
              { ico: "🌐", h: "Diverse content", b: "News, stories, podcasts, songs, movies, TED-Ed and YouTube." },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-white p-6">
                <div className="text-3xl mb-3">{f.ico}</div>
                <h3 className="font-semibold">{f.h}</h3>
                <p className="mt-2 text-sm text-muted">{f.b}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* EXAM PREP */}
      <Section alt>
        <Container size="wide">
          <SectionHead kicker={t("examKicker")} title={t("examTitle")} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="exams">
            {(["toeic", "toefl", "ielts", "oet"] as const).map((exam) => (
              <div key={exam} className="rounded-xl border border-border bg-white p-6">
                <h3 className="text-lg font-bold text-brand">{tExam(exam)}</h3>
                <p className="mt-2 text-sm text-muted">
                  {exam === "toeic" && "Business communication: emails, meetings, conversations."}
                  {exam === "toefl" && "Academic English: campus dialogues, lectures, integrated tasks."}
                  {exam === "ielts" && "General & academic: listening, speaking parts, writing tasks."}
                  {exam === "oet" && "Healthcare English for doctors, nurses and medical professionals."}
                </p>
                <Link
                  href={`/test-prep/${exam}`}
                  className="mt-4 inline-block text-sm font-semibold text-brand hover:text-brand-strong"
                >
                  Start {tExam(exam)} prep →
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container size="narrow">
          <SectionHead kicker={t("faqKicker")} title={t("faqTitle")} />
          <FaqAccordion items={faqItems} />
        </Container>
      </Section>

      {/* CTA STRIP */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white">
        <Container size="wide" className="py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">{t("ctaStripTitle")}</h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">{t("ctaStripSub")}</p>
          <Link
            href="/lessons"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-white text-brand-strong font-semibold px-6 py-3 hover:bg-brand-soft transition-colors"
          >
            {t("ctaStripBtn")}
          </Link>
        </Container>
      </section>
    </>
  );
}
