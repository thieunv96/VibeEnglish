import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/Container";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Container size="narrow" className="py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-6" data-testid="page-title">About VibeEnglish</h1>
      <div className="prose prose-emerald max-w-none space-y-4 text-foreground">
        <p>
          VibeEnglish is a free English-learning platform built around what actually works for adult
          learners: <strong>listening, dictation, and varied real-world content</strong>. We believe great
          tools for learning English should be available to everyone — without paywalls or sign-up walls.
        </p>
        <p>
          The site offers 1,745+ audio and video lessons across short stories, conversations, TED-Ed,
          YouTube, news, podcasts, and exam-prep tracks for TOEIC, TOEFL, IELTS and OET. All content is
          tagged by CEFR level (A1–C2) so you can practice at the right difficulty.
        </p>
        <p>
          Every lesson supports interactive dictation — listen to a segment, type what you hear, and get
          instant per-word feedback. This is one of the most effective ways to train your ear and improve
          spelling, grammar, and pronunciation all at once.
        </p>
        <p>
          VibeEnglish runs entirely in your browser — phone, tablet, laptop, or desktop. Nothing to install.
        </p>
      </div>
    </Container>
  );
}
