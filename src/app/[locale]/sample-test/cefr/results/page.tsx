/**
 * CEFR test results — Server Component shell.
 *
 * AC-9: disclaimer MUST be rendered server-side.
 * Reads the result cookie, verifies JWT, and passes payload to CefrResultsClient.
 * Treats testType !== "cefr" cookie as absent (AC-X4).
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/Container";
import { verifyResultCookie } from "@/lib/sample-test-jwt";
import { checkAnswer } from "@/lib/exercise-scoring";
import { CefrResultsClient } from "./CefrResultsClient";
import type { CefrCookiePayload } from "./CefrResultsClient";
import type { ReviewQuestion } from "@/components/QuestionReview";
import type { ExerciseQuestion } from "@/lib/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const COOKIE_NAME = "sample_test_result";

/**
 * Fetch per-question review data server-side using the questionIds and
 * guestAnswers from the result cookie. Returns one ReviewQuestion per question.
 * No cookie growth — prompts and correct answers come straight from the DB.
 *
 * @param questionIds         Bare per-exercise question ids (e.g. "q1").
 * @param guestAnswers        User answers keyed by bare questionId.
 * @param questionCompositeIds Optional parallel array of "${slug}:${questionId}" strings.
 *                            When present, used for precise DB lookup even when multiple
 *                            exercises share the same per-exercise question id.
 */
async function buildReviewQuestions(
  questionCompositeIds: string[],
  answersByIndex: (string | Record<string, string>)[],
): Promise<ReviewQuestion[]> {
  if (questionCompositeIds.length === 0) return [];

  const exercises = await prisma.exercise.findMany({
    select: { slug: true, questions: true },
  });

  // Composite key "${slug}:${q.id}" avoids last-write-wins collision on bare ids.
  const questionMap = new Map<string, ExerciseQuestion>();
  for (const ex of exercises) {
    const qs = ex.questions as unknown as ExerciseQuestion[];
    for (const q of qs) {
      questionMap.set(`${ex.slug}:${q.id}`, q);
    }
  }

  return questionCompositeIds.map((compositeKey, idx) => {
    const qId = compositeKey.split(":")[1] ?? compositeKey;
    const q = questionMap.get(compositeKey);
    if (!q) {
      return { id: qId, prompt: "—", userAnswer: "", correctAnswer: "", isCorrect: false };
    }
    const given = answersByIndex[idx] ?? "";
    const isCorrect = checkAnswer(q, given);
    const correctAnswer = Array.isArray(q.answer)
      ? q.answer.join(", ")
      : q.pairs
        ? Object.fromEntries(q.pairs.map((p) => [p.left, p.right]))
        : String(q.answer);

    return { id: qId, prompt: q.prompt, userAnswer: given, correctAnswer, isCorrect };
  });
}

export default async function CefrTestResultsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("cefrTest");

  // Read auth state server-side.
  const session = await auth();
  const sessionUser = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  const isAuthed = Boolean(sessionUser?.id) && !sessionUser?.isAdmin;

  // Read and verify the result cookie.
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? null;

  let payload: CefrCookiePayload | null = null;
  let isExpired = false;

  if (raw) {
    try {
      const decoded = await verifyResultCookie<Record<string, unknown>>(raw);
      // AC-X4: treat non-cefr cookies as absent.
      if (decoded.testType === "cefr") {
        payload = decoded as unknown as CefrCookiePayload;
      }
    } catch {
      // Expired or tampered cookie — treat as missing.
      // If the cookie name exists but decoding failed, it likely expired.
      isExpired = true;
    }
  }

  // Build per-question review data server-side (BLOCKER-3 fix).
  let reviewQuestions: ReviewQuestion[] = [];
  if (payload) {
    const compositeIds = (payload.questionCompositeIds as string[] | undefined) ?? [];
    const answersByIndex = (payload.answersByIndex as (string | Record<string, string>)[] | undefined) ?? [];
    reviewQuestions = await buildReviewQuestions(compositeIds, answersByIndex);
  }

  // Re-hydrate exerciseScores from the slim cookie tuples. title/skill/level are fetched
  // from the live Exercise table because the cookie intentionally omits them (4 KB cap).
  if (payload) {
    const slim = (payload as unknown as { slimScores?: [string, number, number][] }).slimScores ?? [];
    if (slim.length > 0) {
      const slugs = slim.map(([s]) => s);
      const exRows = await prisma.exercise.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, skill: true, title: true, level: true },
      });
      const meta = new Map(exRows.map((r) => [r.slug, r]));
      payload.exerciseScores = slim.map(([slug, correct, total]) => {
        const m = meta.get(slug);
        return {
          slug,
          skill: m?.skill ?? "",
          title: m?.title ?? slug,
          level: m?.level ?? "",
          correct,
          total,
        };
      });
    }
  }

  const labels = {
    fullResultsHeading: t("fullResultsHeading"),
    scoreLabel: t("scoreLabel"),
    estimatedLevelLabel: t("estimatedLevelLabel"),
    c1PlusExplanation: t("c1PlusExplanation"),
    levelBreakdownHeading: t("levelBreakdownHeading"),
    levelBreakdownItem: t("levelBreakdownItem", { correct: "{correct}", total: "{total}" }),
    skillBreakdownHeading: t("skillBreakdownHeading"),
    skillBreakdownItem: t("skillBreakdownItem", { correct: "{correct}", total: "{total}" }),
    reviewHeading: t("reviewHeading"),
    reviewCorrect: t("reviewCorrect"),
    reviewIncorrect: t("reviewIncorrect"),
    reviewCorrectAnswer: t("reviewCorrectAnswer", { answer: "{answer}" }),
    retakeBtn: t("retakeBtn"),
    teaserSub: t("teaserSub"),
    teaserSignUpBtn: t("teaserSignUpBtn"),
    teaserLoginPrompt: t("teaserLoginPrompt"),
    teaserLoginLink: t("teaserLoginLink"),
    noResultsHeading: t("noResultsHeading"),
    noResultsBody: t("noResultsBody"),
    noResultsLink: t("noResultsLink"),
    expiredBody: t("expiredBody"),
  };

  return (
    <Container size="narrow" className="py-12">
      <main>
        {/* AC-9: disclaimer is server-rendered — present in HTML before JS hydration. */}
        <p
          data-testid="cefr-disclaimer"
          className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {t("disclaimer")}
        </p>

        <CefrResultsClient
          payload={payload}
          isAuthed={isAuthed}
          isExpired={isExpired}
          reviewQuestions={reviewQuestions}
          labels={labels}
        />
      </main>
    </Container>
  );
}
