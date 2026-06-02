import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Container } from "@/components/Container";
import { verifyResultCookie } from "@/lib/sample-test-jwt";
import { checkAnswer } from "@/lib/exercise-scoring";
import { ResultsClient } from "./ResultsClient";
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

  // Fetch all exercises; composite-key map avoids last-write-wins collision on bare ids.
  const exercises = await prisma.exercise.findMany({
    select: { slug: true, questions: true },
  });

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

export default async function SampleTestResultsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("sampleTest");

  // Read auth state server-side.
  const session = await auth();
  const sessionUser = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  const isAuthenticated = Boolean(sessionUser?.id) && !sessionUser?.isAdmin;

  // Read and verify the result cookie server-side.
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value ?? null;

  let cookiePayload: Record<string, unknown> | null = null;
  if (raw) {
    try {
      cookiePayload = await verifyResultCookie<Record<string, unknown>>(raw);
    } catch {
      // Expired or tampered cookie — treat as missing.
      cookiePayload = null;
    }
  }

  // Build per-question review data server-side (BLOCKER-3 fix).
  // Compact parallel arrays keep the cookie under the 4 KB per-cookie browser cap.
  let reviewQuestions: ReviewQuestion[] = [];
  if (cookiePayload) {
    const compositeIds = (cookiePayload.questionCompositeIds as string[] | undefined) ?? [];
    const answersByIndex = (cookiePayload.answersByIndex as (string | Record<string, string>)[] | undefined) ?? [];
    reviewQuestions = await buildReviewQuestions(compositeIds, answersByIndex);
  }

  // Re-hydrate exerciseScores from slim cookie tuples — title/skill fetched from DB
  // because the cookie intentionally omits them (4 KB cap).
  if (cookiePayload) {
    const slim = (cookiePayload.slimScores as [string, number, number][] | undefined) ?? [];
    if (slim.length > 0) {
      const slugs = slim.map(([s]) => s);
      const exRows = await prisma.exercise.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, skill: true, title: true, level: true },
      });
      const meta = new Map(exRows.map((r) => [r.slug, r]));
      cookiePayload.exerciseScores = slim.map(([slug, correct, total]) => {
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
    skillBreakdownHeading: t("skillBreakdownHeading"),
    skillBreakdownItem: t("skillBreakdownItem", { correct: "{correct}", total: "{total}" }),
    recommendationsHeading: t("recommendationsHeading"),
    recommendationsEmpty: t("recommendationsEmpty"),
    reviewHeading: t("reviewHeading"),
    reviewCorrect: t("reviewCorrect"),
    reviewIncorrect: t("reviewIncorrect"),
    reviewCorrectAnswer: t("reviewCorrectAnswer", { answer: "{answer}" }),
    retakeBtn: t("retakeBtn"),
    noResultsHeading: t("noResultsHeading"),
    noResultsBody: t("noResultsBody"),
    noResultsLink: t("noResultsLink"),
    expiredBody: t("expiredBody"),
    teaserHeading: t("teaserHeading", { correct: "{correct}", total: "{total}" }),
    teaserSub: t("teaserSub"),
    teaserSignUpBtn: t("teaserSignUpBtn"),
    teaserLoginPrompt: t("teaserLoginPrompt"),
    teaserLoginLink: t("teaserLoginLink"),
  };

  return (
    <Container size="narrow" className="py-12">
      <ResultsClient
        isAuthenticated={isAuthenticated}
        cookiePayload={cookiePayload}
        userId={sessionUser?.id ?? null}
        reviewQuestions={reviewQuestions}
        labels={labels}
      />
    </Container>
  );
}
