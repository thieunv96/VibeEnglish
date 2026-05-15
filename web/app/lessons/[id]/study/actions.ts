"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  lessonAttempts,
  exerciseResponses,
  userProgress,
  skillScores,
  lessons,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { scoreQuiz, scoreWriting, scoreSpeaking } from "@/lib/ai";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Idempotent: ensure an in_progress attempt exists for (user, lesson). */
export async function startAttemptAction(input: { lessonId: string }) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };
  const id = await ensureAttempt(session.user.id, input.lessonId);
  return { ok: true as const, attemptId: id };
}

async function ensureAttempt(userId: string, lessonId: string) {
  const existing = await db
    .select()
    .from(lessonAttempts)
    .where(
      and(
        eq(lessonAttempts.userId, userId),
        eq(lessonAttempts.lessonId, lessonId),
        eq(lessonAttempts.status, "in_progress")
      )
    )
    .limit(1);
  if (existing[0]) return existing[0].id;
  const id = crypto.randomUUID();
  await db.insert(lessonAttempts).values({
    id,
    userId,
    lessonId,
    status: "in_progress",
  });
  return id;
}

export async function scoreQuizAction(input: { answers: { qid: string; correct: boolean }[] }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return scoreQuiz(input.answers);
}

export async function scoreWritingAction(input: { text: string; level: string; exerciseId: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return scoreWriting({ text: input.text, level: input.level });
}

export async function scoreSpeakingAction(input: { targetText: string; exerciseId: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return scoreSpeaking({ targetText: input.targetText });
}

export async function completeLessonAction(input: {
  lessonId: string;
  /** Optional final score (0-100). If omitted, defaults to 80. */
  score?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
    const userId = session.user.id;
    const attemptId = await ensureAttempt(userId, input.lessonId);

    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, input.lessonId)).limit(1);
    if (!lesson) return { ok: false as const, error: "Lesson not found" };

    const score = Math.max(0, Math.min(100, input.score ?? 80));
    const xp = 30 + Math.round(score / 5); // 30..50 xp based on score

  await db
    .update(lessonAttempts)
    .set({
      status: "completed",
      score,
      xpAwarded: xp,
      completedAt: new Date(),
      aiFeedback: {
        strengths: ["Hoàn thành tốt bài học", "Tốc độ làm bài ổn định"],
        improvements: ["Có thể nghe lại transcript để củng cố"],
        tips: ["Học đều mỗi ngày để giữ streak"],
      },
    })
    .where(eq(lessonAttempts.id, attemptId));

  // Update progress
  const [prog] = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
  const today = todayISO();
  if (prog) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = prog.lastActiveDate === today
      ? prog.streakDays
      : prog.lastActiveDate === yesterday
      ? prog.streakDays + 1
      : 1;
    await db
      .update(userProgress)
      .set({
        xp: prog.xp + xp,
        streakDays: newStreak,
        longestStreak: Math.max(prog.longestStreak, newStreak),
        lastActiveDate: today,
        totalLessons: prog.totalLessons + 1,
        totalMinutes: prog.totalMinutes + Math.max(1, Math.round(lesson.durationSec / 60)),
      })
      .where(eq(userProgress.userId, userId));
  } else {
    await db.insert(userProgress).values({
      userId,
      xp,
      streakDays: 1,
      longestStreak: 1,
      lastActiveDate: today,
      totalLessons: 1,
      totalMinutes: Math.max(1, Math.round(lesson.durationSec / 60)),
    });
  }

    // Bump skill scores slightly
    const skills = ["vocabulary", "grammar", "reading", "listening"] as const;
    for (const sk of skills) {
      const [row] = await db
        .select()
        .from(skillScores)
        .where(and(eq(skillScores.userId, userId), eq(skillScores.skill, sk)))
        .limit(1);
      const newScore = Math.min(100, (row?.score ?? 50) + 2);
      if (row) {
        await db
          .update(skillScores)
          .set({ score: newScore, updatedAt: new Date() })
          .where(and(eq(skillScores.userId, userId), eq(skillScores.skill, sk)));
      } else {
        await db.insert(skillScores).values({ userId, skill: sk, score: newScore });
      }
    }

    return { ok: true as const, attemptId };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Submit failed" };
  }
}
