import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";
import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";

const items: FaqItem[] = [
  { q: "Is VibeEnglish really 100% free?", a: "Yes — every lesson, every exercise, every feature. No paywalls, no premium tier, no trial that expires." },
  { q: "Do I need to register or create an account?", a: "No. You can start any lesson immediately. An optional account lets you save progress and vocabulary across devices." },
  { q: "What levels does VibeEnglish cover?", a: "All of them — A1 (beginner) through C2 (proficient)." },
  { q: "Can I prepare for TOEIC, TOEFL, IELTS or OET here?", a: "Yes. We have dedicated tracks for all four major exams." },
  { q: "Does dictation practice actually work?", a: "It's one of the most effective listening techniques. Dictation forces active focus on every sound." },
  { q: "What makes VibeEnglish different?", a: "Real, varied listening content with full transcripts and interactive dictation — not just flashcards." },
  { q: "How do I get started?", a: "Click \"Start Lessons Free.\" Pick a level. Choose a category. Press play." },
  { q: "How can I improve my listening fastest?", a: "Daily 15-minute sessions with dictation, on content just above your comfort level." },
  { q: "Does it work on my phone?", a: "Yes — any modern browser on any device. No app to install." },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container size="narrow" className="py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="page-title">Frequently Asked Questions</h1>
      <p className="text-muted mb-8">Quick answers to the questions we hear most often.</p>
      <FaqAccordion items={items} />
    </Container>
  );
}
